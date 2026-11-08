import { createHash, randomBytes } from 'node:crypto'
import { prisma } from '@/lib/prisma'

export const INVITATION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000

export function createInvitationToken() {
  return randomBytes(32).toString('base64url')
}

export function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getValidInvitation(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  return prisma.invitation.findFirst({
    where: { tokenHash: hashInvitationToken(token), usedAt: null, expiresAt: { gt: new Date() } },
    select: { email: true },
  })
}
