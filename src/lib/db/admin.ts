import { prisma } from '@/lib/prisma'

const adminUserSelect = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  image: true,
  isPro: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
} as const

export async function getAdminUsers() {
  return prisma.user.findMany({
    select: adminUserSelect,
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  })
}

export type AdminUser = Awaited<ReturnType<typeof getAdminUsers>>[number]

export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isAdmin: true },
  })

  return user?.isAdmin === true
}
