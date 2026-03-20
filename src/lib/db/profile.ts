import { prisma } from '@/lib/prisma'

export type ProfileData = {
  id: string
  name: string | null
  email: string | null
  image: string | null
  createdAt: Date
  hasPassword: boolean
  totalItems: number
  totalCollections: number
  itemTypeCounts: { name: string; icon: string; color: string; count: number }[]
}

export async function getProfileData(userId: string): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      hashedPassword: true,
    },
  })

  if (!user) return null

  const [totalItems, totalCollections, itemTypes] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.collection.count({ where: { userId } }),
    prisma.itemType.findMany({
      where: { isSystem: true },
      include: {
        _count: { select: { items: { where: { userId } } } },
      },
      orderBy: { name: 'asc' },
    }),
  ])

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    createdAt: user.createdAt,
    hasPassword: !!user.hashedPassword,
    totalItems,
    totalCollections,
    itemTypeCounts: itemTypes.map((t) => ({
      name: t.name,
      icon: t.icon,
      color: t.color,
      count: t._count.items,
    })),
  }
}
