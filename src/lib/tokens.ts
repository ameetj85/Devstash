import { v4 as uuidv4 } from 'uuid'
import { prisma } from '@/lib/prisma'

export async function generateVerificationToken(email: string) {
  const token = uuidv4()
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete any existing token for this email
  await prisma.verificationToken.deleteMany({ where: { identifier: email } })

  return prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  })
}

export async function getVerificationToken(token: string) {
  return prisma.verificationToken.findUnique({ where: { token } })
}
