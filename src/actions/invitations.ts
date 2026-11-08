'use server'

import { z } from 'zod'
import { requireAuth } from '@/lib/action-helpers'
import { isUserAdmin } from '@/lib/db/admin'
import { prisma } from '@/lib/prisma'
import { sendInvitationEmail } from '@/lib/email'
import { createInvitationToken, hashInvitationToken, INVITATION_LIFETIME_MS } from '@/lib/invitations'

const emailSchema = z.string().trim().email('Enter a valid email address').max(255).transform((email) => email.toLowerCase())

export async function sendInvitation(input: string) {
  const admin = await requireAuth()
  if ('success' in admin) return admin
  if (!(await isUserAdmin(admin.userId))) return { success: false as const, error: 'Administrator access required' }

  const parsed = emailSchema.safeParse(input)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }
  const email = parsed.data
  const token = createInvitationToken()
  const tokenHash = hashInvitationToken(token)

  try {
    const existing = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE lower(email) = ${email} LIMIT 1`
    if (existing.length) return { success: false as const, error: 'An account already exists for this email' }

    await prisma.invitation.upsert({
      where: { email },
      create: { email, tokenHash, expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS) },
      update: { tokenHash, expiresAt: new Date(Date.now() + INVITATION_LIFETIME_MS), usedAt: null },
    })
    try {
      await sendInvitationEmail(email, token)
    } catch (error) {
      await prisma.invitation.deleteMany({ where: { email, tokenHash, usedAt: null } })
      throw error
    }
    const current = await prisma.invitation.findUnique({ where: { email }, select: { tokenHash: true } })
    if (current?.tokenHash !== tokenHash) {
      return { success: false as const, error: 'A newer invitation replaced this link. Send another invitation if needed.' }
    }
    return { success: true as const }
  } catch (error) {
    console.error('Failed to send invitation', error)
    return { success: false as const, error: 'Could not send invitation. Check email configuration and try again. A previous invitation may no longer be valid.' }
  }
}
