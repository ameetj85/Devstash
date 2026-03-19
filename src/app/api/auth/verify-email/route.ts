import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getVerificationToken } from '@/lib/tokens'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const verificationToken = await getVerificationToken(token)

  if (!verificationToken) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  if (verificationToken.expires < new Date()) {
    await prisma.verificationToken.delete({ where: { token } })
    return NextResponse.json({ error: 'Token has expired' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { email: verificationToken.identifier },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 400 })
  }

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({ where: { token } })

  return NextResponse.json({ message: 'Email verified successfully' })
}
