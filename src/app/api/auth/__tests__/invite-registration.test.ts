import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

vi.mock('bcryptjs', () => ({ default: { hash: vi.fn().mockResolvedValue('hashed') } }))
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: vi.fn(), getIp: vi.fn().mockReturnValue('ip') }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
    invitation: { findFirst: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    user: { create: vi.fn() },
    $queryRaw: vi.fn(),
  },
}))

const token = 'a'.repeat(43)
const input = { name: 'New User', token, password: 'secure-password', confirmPassword: 'secure-password' }
function request(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(bcrypt.hash).mockResolvedValue('hashed' as never)
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, retryAfter: 0 })
  vi.mocked(prisma.invitation.findFirst).mockResolvedValue({ email: 'invited@example.test' } as never)
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
    if (typeof callback !== 'function') throw new Error('Expected transaction callback')
    return callback(prisma as never)
  })
  vi.mocked(prisma.invitation.findUnique).mockResolvedValue({
    email: 'invited@example.test', usedAt: null, expiresAt: new Date(Date.now() + 60000),
  } as never)
  vi.mocked(prisma.invitation.updateMany).mockResolvedValue({ count: 1 })
  vi.mocked(prisma.$queryRaw).mockResolvedValue([])
  vi.mocked(prisma.user.create).mockResolvedValue({} as never)
})

describe('invite registration', () => {
  it('requires a valid invitation regardless of public registration flag', async () => {
    vi.stubEnv('REGISTRATION_ENABLED', 'true')
    expect((await POST(request({ ...input, token: '' }))).status).toBe(400)
    vi.unstubAllEnvs()
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('rejects a client-supplied email rather than allowing substitution', async () => {
    expect((await POST(request({ ...input, email: 'attacker@example.test' }))).status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('creates a verified user from the invite and consumes it in a transaction', async () => {
    const response = await POST(request(input))
    expect(response.status).toBe(201)
    expect(prisma.invitation.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: expect.any(String), usedAt: null, expiresAt: { gt: expect.any(Date) } },
      data: { usedAt: expect.any(Date) },
    })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { name: 'New User', email: 'invited@example.test', hashedPassword: 'hashed', emailVerified: expect.any(Date) },
    })
  })

  it.each([
    null,
    { email: 'invited@example.test', usedAt: new Date(), expiresAt: new Date(Date.now() + 60000) },
    { email: 'invited@example.test', usedAt: null, expiresAt: new Date(Date.now() - 1) },
  ])('rejects missing, used, or expired invitations', async (invitation) => {
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue(invitation as never)
    expect((await POST(request(input))).status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('rejects an invitation claimed concurrently', async () => {
    vi.mocked(prisma.invitation.updateMany).mockResolvedValue({ count: 0 })
    expect((await POST(request(input))).status).toBe(400)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('does not consume an invite for an existing account', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'existing' }])
    expect((await POST(request(input))).status).toBe(409)
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('validates passwords and honors rate limits', async () => {
    expect((await POST(request({ ...input, confirmPassword: 'different' }))).status).toBe(400)
    expect((await POST(request({ ...input, password: '🔒'.repeat(19), confirmPassword: '🔒'.repeat(19) }))).status).toBe(400)
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, retryAfter: 60 })
    const response = await POST(request(input))
    expect(response.status).toBe(429)
    expect(response.headers.get('Retry-After')).toBe('60')
  })
})
