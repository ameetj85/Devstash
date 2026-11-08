import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { Prisma } from '@/generated/prisma/client'
import { createAdminUser } from '@/actions/admin-users'
import { requireAuth } from '@/lib/action-helpers'
import { isUserAdmin } from '@/lib/db/admin'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/action-helpers', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/db/admin', () => ({ isUserAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { $transaction: vi.fn(), $queryRaw: vi.fn(), user: { create: vi.fn() } },
}))

const input = {
  name: ' New User ',
  email: ' New@Example.Test ',
  password: 'secure-password',
  confirmPassword: 'secure-password',
  emailVerified: true,
  isPro: true,
  isAdmin: true,
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(requireAuth).mockResolvedValue({ userId: 'admin' })
  vi.mocked(isUserAdmin).mockResolvedValue(true)
  vi.mocked(prisma.$transaction).mockImplementation(async (callback) => {
    if (typeof callback !== 'function') throw new Error('Expected transaction callback')
    return callback(prisma as never)
  })
  vi.mocked(prisma.$queryRaw).mockResolvedValue([])
  vi.mocked(prisma.user.create).mockResolvedValue({} as never)
})

describe('createAdminUser', () => {
  it('rejects unauthenticated and non-admin callers', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ success: false, error: 'Unauthorized' })
    expect(await createAdminUser(input)).toEqual({ success: false, error: 'Unauthorized' })
    vi.mocked(isUserAdmin).mockResolvedValueOnce(false)
    expect(await createAdminUser(input)).toEqual({ success: false, error: 'Administrator access required' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('creates a normalized, verified admin and hashes the password with 12 rounds', async () => {
    expect(await createAdminUser(input)).toEqual({ success: true })
    const data = vi.mocked(prisma.user.create).mock.calls[0][0].data
    expect(data).toMatchObject({
      name: 'New User', email: 'new@example.test', emailVerified: expect.any(Date), isPro: true, isAdmin: true,
    })
    if (typeof data.hashedPassword !== 'string') throw new Error('Missing password hash')
    expect(bcrypt.getRounds(data.hashedPassword)).toBe(12)
    expect(await bcrypt.compare(input.password, data.hashedPassword)).toBe(true)
  })

  it('persists false flags and leaves email unverified', async () => {
    expect(await createAdminUser({ ...input, emailVerified: false, isPro: false, isAdmin: false })).toEqual({ success: true })
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ emailVerified: null, isPro: false, isAdmin: false }),
    })
  })

  it('rejects invalid input and cannot accept a user id', async () => {
    for (const invalid of [
      { ...input, name: ' ' },
      { ...input, email: 'invalid' },
      { ...input, password: 'short' },
      { ...input, password: '🔒'.repeat(19), confirmPassword: '🔒'.repeat(19) },
      { ...input, confirmPassword: 'different' },
      { ...input, id: 'chosen-id' },
    ]) {
      expect((await createAdminUser(invalid)).success).toBe(false)
    }
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it('rejects existing emails, including differently cased ones', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ id: 'existing' }])
    expect(await createAdminUser(input)).toEqual({ success: false, error: 'Email is already in use' })
    expect(prisma.$queryRaw).toHaveBeenCalledWith(expect.anything(), 'new@example.test')
    expect(prisma.user.create).not.toHaveBeenCalled()
  })

  it('reports database uniqueness conflicts and unexpected failures', async () => {
    vi.mocked(prisma.user.create).mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '7.5.0' }))
    expect(await createAdminUser(input)).toEqual({ success: false, error: 'Email is already in use' })
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(prisma.user.create).mockRejectedValueOnce(new Error('database unavailable'))
    expect(await createAdminUser(input)).toEqual({ success: false, error: 'Failed to create user' })
    expect(log).toHaveBeenCalled()
    log.mockRestore()
  })
})
