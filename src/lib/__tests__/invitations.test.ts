import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInvitationToken, getValidInvitation, hashInvitationToken, INVITATION_LIFETIME_MS } from '@/lib/invitations'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({ prisma: { invitation: { findFirst: vi.fn() } } }))

beforeEach(() => vi.resetAllMocks())

describe('invitation tokens', () => {
  it('generates random URL-safe tokens and hashes them', () => {
    const first = createInvitationToken()
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(createInvitationToken()).not.toBe(first)
    expect(hashInvitationToken(first)).toMatch(/^[a-f0-9]{64}$/)
    expect(INVITATION_LIFETIME_MS).toBe(7 * 24 * 60 * 60 * 1000)
  })

  it('looks up only unexpired, unused tokens by hash', async () => {
    const token = createInvitationToken()
    vi.mocked(prisma.invitation.findFirst).mockResolvedValue({ email: 'user@example.test' } as never)
    await expect(getValidInvitation(token)).resolves.toEqual({ email: 'user@example.test' })
    expect(prisma.invitation.findFirst).toHaveBeenCalledWith({
      where: { tokenHash: hashInvitationToken(token), usedAt: null, expiresAt: { gt: expect.any(Date) } },
      select: { email: true },
    })
  })

  it('rejects malformed or unavailable tokens', async () => {
    expect(await getValidInvitation('invalid')).toBeNull()
    expect(prisma.invitation.findFirst).not.toHaveBeenCalled()
    vi.mocked(prisma.invitation.findFirst).mockResolvedValue(null)
    expect(await getValidInvitation(createInvitationToken())).toBeNull()
  })
})
