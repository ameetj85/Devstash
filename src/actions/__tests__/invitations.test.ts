import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendInvitation } from '@/actions/invitations'
import { requireAuth } from '@/lib/action-helpers'
import { isUserAdmin } from '@/lib/db/admin'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'

vi.mock('@/lib/action-helpers', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/db/admin', () => ({ isUserAdmin: vi.fn() }))
vi.mock('@/lib/email', () => ({ sendInvitationEmail: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    invitation: { upsert: vi.fn(), deleteMany: vi.fn(), findUnique: vi.fn() },
  },
}))

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(requireAuth).mockResolvedValue({ userId: 'admin' })
  vi.mocked(isUserAdmin).mockResolvedValue(true)
  vi.mocked(prisma.$queryRaw).mockResolvedValue([])
  vi.mocked(prisma.invitation.upsert).mockResolvedValue({} as never)
  vi.mocked(sendInvitationEmail).mockImplementation(async () => {
    const args = vi.mocked(prisma.invitation.upsert).mock.calls[0][0]
    vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ tokenHash: args.create.tokenHash } as never)
  })
  vi.mocked(prisma.invitation.deleteMany).mockResolvedValue({ count: 1 })
})

describe('sendInvitation', () => {
  it('requires an authenticated administrator', async () => {
    vi.mocked(requireAuth).mockResolvedValueOnce({ success: false, error: 'Unauthorized' })
    expect(await sendInvitation('user@example.test')).toEqual({ success: false, error: 'Unauthorized' })
    vi.mocked(isUserAdmin).mockResolvedValueOnce(false)
    expect(await sendInvitation('user@example.test')).toEqual({ success: false, error: 'Administrator access required' })
    expect(sendInvitationEmail).not.toHaveBeenCalled()
  })

  it('validates emails and rejects existing accounts', async () => {
    expect((await sendInvitation('invalid')).success).toBe(false)
    vi.mocked(prisma.$queryRaw).mockResolvedValueOnce([{ id: 'existing' }])
    expect(await sendInvitation('USER@example.test')).toEqual({ success: false, error: 'An account already exists for this email' })
    expect(prisma.invitation.upsert).not.toHaveBeenCalled()
  })

  it('stores only a hash and replaces the previous invitation', async () => {
    const now = Date.now()
    expect(await sendInvitation(' User@Example.Test ')).toEqual({ success: true })
    const args = vi.mocked(prisma.invitation.upsert).mock.calls[0][0]
    const [email, token] = vi.mocked(sendInvitationEmail).mock.calls[0]
    expect(email).toBe('user@example.test')
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(args.where).toEqual({ email })
    expect(args.create.tokenHash).not.toBe(token)
    expect(args.update).toMatchObject({ tokenHash: args.create.tokenHash, usedAt: null })
    expect(new Date(args.create.expiresAt).getTime() - now).toBeGreaterThanOrEqual(7 * 86400000)
  })

  it('removes its own token when delivery fails', async () => {
    vi.mocked(sendInvitationEmail).mockRejectedValueOnce(new Error('delivery failed'))
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await sendInvitation('user@example.test')).success).toBe(false)
    const args = vi.mocked(prisma.invitation.upsert).mock.calls[0][0]
    expect(prisma.invitation.deleteMany).toHaveBeenCalledWith({
      where: { email: 'user@example.test', tokenHash: args.create.tokenHash, usedAt: null },
    })
    log.mockRestore()
  })

  it('reports when another send replaced the link', async () => {
    vi.mocked(sendInvitationEmail).mockImplementationOnce(async () => {
      vi.mocked(prisma.invitation.findUnique).mockResolvedValue({ tokenHash: 'newer' } as never)
    })
    expect((await sendInvitation('user@example.test')).success).toBe(false)
  })
})
