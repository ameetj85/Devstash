import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generatePasswordResetToken } from '@/lib/tokens'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { email } = body

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  // Always return success to avoid leaking whether an email is registered
  if (!user || !user.hashedPassword) {
    return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
  }

  const { token } = await generatePasswordResetToken(email)
  await sendPasswordResetEmail(email, token)

  return NextResponse.json({ message: 'If that email exists, a reset link has been sent.' })
}
