import { prisma } from '@/lib/prisma'

export type CreatedCollection = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
}

export async function createCollection(
  userId: string,
  data: { name: string; description?: string | null },
): Promise<CreatedCollection> {
  return prisma.collection.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  })
}

export type CollectionOption = {
  id: string
  name: string
}

/** Returns a simple id+name list of collections for the current user (for pickers). */
export async function getUserCollections(userId: string): Promise<CollectionOption[]> {
  return prisma.collection.findMany({
    where: { userId },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })
}

export type CollectionDetail = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  createdAt: Date
}

export async function getCollectionById(userId: string, collectionId: string): Promise<CollectionDetail | null> {
  return prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      isFavorite: true,
      createdAt: true,
    },
  })
}

export type CollectionWithMeta = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  dominantColor: string
  typeIcons: { icon: string; color: string; name: string }[]
}

export async function getCollections(userId: string): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
      items: {
        select: {
          item: {
            select: {
              itemType: {
                select: { id: true, icon: true, color: true, name: true },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections.map((col) => {
    // Count items per type to find dominant and unique types
    const typeCounts: Record<
      string,
      { count: number; icon: string; color: string; name: string }
    > = {}

    for (const ic of col.items) {
      const t = ic.item.itemType
      if (!typeCounts[t.id]) {
        typeCounts[t.id] = { count: 0, icon: t.icon, color: t.color, name: t.name }
      }
      typeCounts[t.id].count++
    }

    const typeEntries = Object.values(typeCounts).sort((a, b) => b.count - a.count)
    const dominantColor = typeEntries[0]?.color ?? '#6b7280'
    const typeIcons = typeEntries.map(({ icon, color, name }) => ({ icon, color, name }))

    return {
      id: col.id,
      name: col.name,
      description: col.description,
      isFavorite: col.isFavorite,
      itemCount: col._count.items,
      dominantColor,
      typeIcons,
    }
  })
}
