import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { getValidInvitation, hashInvitationToken } from '@/lib/invitations'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

const registrationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(255),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/, 'Invalid invitation'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
  confirmPassword: z.string(),
}).strict().refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export async function POST(request: Request) {
  const { allowed, retryAfter } = await checkRateLimit('register', getIp(request))
  if (!allowed) {
    const minutes = Math.ceil(retryAfter / 60)
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const parsed = registrationSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const { token, name, password } = parsed.data
    if (!(await getValidInvitation(token))) {
      return NextResponse.json({ error: 'Invitation is invalid, expired, or already used.' }, { status: 400 })
    }
    const tokenHash = hashInvitationToken(token)
    const hashedPassword = await bcrypt.hash(password, 12)
    const result = await prisma.$transaction(async (tx) => {
      const now = new Date()
      const invitation = await tx.invitation.findUnique({ where: { tokenHash } })
      if (!invitation || invitation.usedAt || invitation.expiresAt <= now) return 'invalid'
      const claimed = await tx.invitation.updateMany({
        where: { tokenHash, usedAt: null, expiresAt: { gt: now } },
        data: { usedAt: now },
      })
      if (claimed.count !== 1) return 'invalid'
      const existing = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE lower(email) = ${invitation.email} LIMIT 1`
      if (existing.length) throw new Error('INVITED_ACCOUNT_EXISTS')
      await tx.user.create({ data: { name, email: invitation.email, hashedPassword, emailVerified: now } })
      return 'created'
    })
    if (result === 'invalid') {
      return NextResponse.json({ error: 'Invitation is invalid, expired, or already used.' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Account created successfully.' }, { status: 201 })
  } catch (error) {
    if ((error instanceof Error && error.message === 'INVITED_ACCOUNT_EXISTS') ||
      (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) {
      return NextResponse.json({ error: 'An account already exists for this email.' }, { status: 409 })
    }
    console.error('Invitation registration failed', error)
    return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 })
  }
}
