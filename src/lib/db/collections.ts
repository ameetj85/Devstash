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

export async function updateCollection(
  userId: string,
  collectionId: string,
  data: { name: string; description?: string | null },
): Promise<CollectionDetail> {
  return prisma.collection.update({
    where: { id: collectionId, userId },
    data: {
      name: data.name,
      description: data.description ?? null,
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

/** Toggles isFavorite on a collection. Returns the new value or null if not found / not owned. */
export async function toggleCollectionFavorite(userId: string, collectionId: string): Promise<{ isFavorite: boolean } | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, userId },
    select: { isFavorite: true },
  })
  if (!collection) return null

  const updated = await prisma.collection.update({
    where: { id: collectionId },
    data: { isFavorite: !collection.isFavorite },
    select: { isFavorite: true },
  })
  return updated
}

export async function deleteCollection(
  userId: string,
  collectionId: string,
): Promise<void> {
  await prisma.collection.delete({
    where: { id: collectionId, userId },
  })
}

export type SearchCollection = {
  id: string
  name: string
  itemCount: number
}

export async function getSearchCollections(userId: string): Promise<SearchCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    itemCount: c._count.items,
  }))
}

export type FavoriteCollection = {
  id: string
  name: string
  itemCount: number
  updatedAt: Date
}

export async function getFavoriteCollections(userId: string): Promise<FavoriteCollection[]> {
  const collections = await prisma.collection.findMany({
    where: { userId, isFavorite: true },
    select: {
      id: true,
      name: true,
      updatedAt: true,
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return collections.map((c) => ({
    id: c.id,
    name: c.name,
    itemCount: c._count.items,
    updatedAt: c.updatedAt,
  }))
}

export async function getCollections(
  userId: string,
  options?: { limit?: number; page?: number; perPage?: number },
): Promise<{ collections: CollectionWithMeta[]; totalCount: number }> {
  const { limit, page, perPage } = options ?? {}

  const skip = page && perPage ? (page - 1) * perPage : undefined
  const take = page && perPage ? perPage : limit ?? undefined

  const [rawCollections, totalCount] = await Promise.all([
    prisma.collection.findMany({
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
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {}),
    }),
    prisma.collection.count({ where: { userId } }),
  ])

  const collections = rawCollections.map((col) => {
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

  return { collections, totalCount }
}
