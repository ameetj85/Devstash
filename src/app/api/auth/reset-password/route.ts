import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getPasswordResetToken } from '@/lib/tokens'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(req: Request) {
  const ip = getIp(req)
  const { allowed, retryAfter } = await checkRateLimit('resetPassword', ip)
  if (!allowed) {
    const minutes = Math.ceil(retryAfter / 60)
    return NextResponse.json(
      { error: `Too many attempts. Please try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  const body = await req.json().catch(() => ({}))
  const { token, password, confirmPassword } = body

  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 })
  }

  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match.' }, { status: 400 })
  }

  const record = await getPasswordResetToken(token)

  if (!record) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  if (new Date() > record.expires) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.json({ error: 'Reset link has expired. Please request a new one.' }, { status: 400 })
  }

  // identifier is stored as `reset:<email>`
  const email = record.identifier.replace(/^reset:/, '')
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired reset link.' }, { status: 400 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)

  await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.json({ message: 'Password reset successfully.' })
}
