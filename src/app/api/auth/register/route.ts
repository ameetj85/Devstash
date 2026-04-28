import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { generateVerificationToken } from '@/lib/tokens'
import { sendVerificationEmail } from '@/lib/email'
import { checkRateLimit, getIp } from '@/lib/rate-limit'

export async function POST(request: Request) {
  if (process.env.REGISTRATION_ENABLED !== 'true') {
    return NextResponse.json(
      { error: 'Registration is currently invite-only.' },
      { status: 403 }
    )
  }

  const ip = getIp(request)
  const { allowed, retryAfter } = await checkRateLimit('register', ip)
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

  const body = await request.json()
  const { name, email, password, confirmPassword } = body

  if (!name || !email || !password || !confirmPassword) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (password !== confirmPassword) {
    return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return NextResponse.json({ error: 'User already exists' }, { status: 409 })
  }

  const hashedPassword = await bcrypt.hash(password, 12)
  const verificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED === 'true'

  await prisma.user.create({
    data: {
      name,
      email,
      hashedPassword,
      emailVerified: verificationEnabled ? null : new Date(),
    },
  })

  if (verificationEnabled) {
    const verificationToken = await generateVerificationToken(email)
    await sendVerificationEmail(email, verificationToken.token)
    return NextResponse.json(
      { message: 'Check your email to verify your account.' },
      { status: 201 }
    )
  }

  return NextResponse.json(
    { message: 'Account created successfully.' },
    { status: 201 }
  )
}
