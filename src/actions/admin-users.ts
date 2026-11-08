'use server'

import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/action-helpers'
import { isUserAdmin } from '@/lib/db/admin'
import { isAllowedImageUrl } from '@/lib/image-hosts'

const userSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().max(255).nullable(),
  email: z.string().trim().email('Enter a valid email address').max(255).nullable(),
  image: z.string().trim().url('Enter a valid image URL').max(2048)
    .refine(isAllowedImageUrl, 'Image URL must use a supported HTTPS image host').nullable(),
  emailVerified: z.boolean(),
  isAdmin: z.boolean(),
  isPro: z.boolean(),
})

const passwordFields = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters')
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 UTF-8 bytes'),
  confirmPassword: z.string(),
})

const passwordSchema = passwordFields.extend({ id: z.string().min(1) }).refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

const createUserSchema = passwordFields.extend({
  name: z.string().trim().min(1, 'Name is required').max(255),
  email: z.string().trim().email('Enter a valid email address').max(255).transform((value) => value.toLowerCase()),
  emailVerified: z.boolean(),
  isPro: z.boolean(),
  isAdmin: z.boolean(),
}).strict().refine((value) => value.password === value.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

async function authorizeAdmin() {
  const auth = await requireAuth()
  if ('success' in auth) return auth
  if (!(await isUserAdmin(auth.userId))) {
    return { success: false as const, error: 'Administrator access required' }
  }
  return auth
}

export async function createAdminUser(data: z.input<typeof createUserSchema>) {
  const admin = await authorizeAdmin()
  if ('success' in admin) return admin

  const parsed = createUserSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }
  const { name, email, password, emailVerified, isPro, isAdmin } = parsed.data

  try {
    const hashedPassword = await bcrypt.hash(password, 12)
    const created = await prisma.$transaction(async (tx) => {
      const existing = await tx.$queryRaw<{ id: string }[]>`SELECT id FROM "User" WHERE lower(email) = ${email} LIMIT 1`
      if (existing.length) return false
      await tx.user.create({
        data: { name, email, hashedPassword, emailVerified: emailVerified ? new Date() : null, isPro, isAdmin },
      })
      return true
    })
    if (!created) return { success: false as const, error: 'Email is already in use' }
    return { success: true as const }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false as const, error: 'Email is already in use' }
    }
    console.error('Failed to create user', error)
    return { success: false as const, error: 'Failed to create user' }
  }
}

export async function updateAdminUser(data: z.input<typeof userSchema>) {
  const admin = await authorizeAdmin()
  if ('success' in admin) return admin

  const parsed = userSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }
  const { id, emailVerified, ...fields } = parsed.data
  if (id === admin.userId && !fields.isAdmin) {
    return { success: false as const, error: 'You cannot remove your own administrator access' }
  }

  try {
    const user = await prisma.user.findUnique({ where: { id }, select: { emailVerified: true } })
    if (!user) return { success: false as const, error: 'User not found' }
    await prisma.user.update({
      where: { id },
      data: { ...fields, emailVerified: emailVerified ? user.emailVerified ?? new Date() : null },
    })
    return { success: true as const }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return { success: false as const, error: 'Email is already in use' }
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false as const, error: 'User not found' }
    }
    console.error('Failed to update user', error)
    return { success: false as const, error: 'Failed to update user' }
  }
}

export async function resetAdminUserPassword(data: z.input<typeof passwordSchema>) {
  const admin = await authorizeAdmin()
  if ('success' in admin) return admin

  const parsed = passwordSchema.safeParse(data)
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0].message }

  try {
    const hashedPassword = await bcrypt.hash(parsed.data.password, 12)
    await prisma.user.update({
      where: { id: parsed.data.id },
      data: { hashedPassword },
    })
    return { success: true as const }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return { success: false as const, error: 'User not found' }
    }
    console.error('Failed to reset user password', error)
    return { success: false as const, error: 'Failed to reset password' }
  }
}
