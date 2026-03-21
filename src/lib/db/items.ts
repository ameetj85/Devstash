import { prisma } from '@/lib/prisma'

export type ItemDetail = {
  id: string
  title: string
  description: string | null
  content: string | null
  contentType: string
  url: string | null
  fileUrl: string | null
  fileName: string | null
  language: string | null
  isFavorite: boolean
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  tags: string[]
  collections: { id: string; name: string }[]
  itemType: {
    name: string
    icon: string
    color: string
  }
}

export async function getItemDetail(userId: string, itemId: string): Promise<ItemDetail | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
      collections: { include: { collection: { select: { id: true, name: true } } } },
    },
  })

  if (!item) return null

  return {
    id: item.id,
    title: item.title,
    description: item.description,
    content: item.content,
    contentType: item.contentType,
    url: item.url,
    fileUrl: item.fileUrl,
    fileName: item.fileName,
    language: item.language,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    tags: item.tags.map((t) => t.tag.name),
    collections: item.collections.map((c) => ({ id: c.collection.id, name: c.collection.name })),
    itemType: {
      name: item.itemType.name,
      icon: item.itemType.icon,
      color: item.itemType.color,
    },
  }
}

export type ItemWithType = {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  updatedAt: Date
  tags: string[]
  itemType: {
    name: string
    icon: string
    color: string
  }
}

export type ItemStats = {
  totalItems: number
  favoriteItems: number
}

function mapItem(item: {
  id: string
  title: string
  description: string | null
  isFavorite: boolean
  isPinned: boolean
  updatedAt: Date
  tags: { tag: { name: string } }[]
  itemType: { name: string; icon: string; color: string }
}): ItemWithType {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    isFavorite: item.isFavorite,
    isPinned: item.isPinned,
    updatedAt: item.updatedAt,
    tags: item.tags.map((t) => t.tag.name),
    itemType: item.itemType,
  }
}

export async function getPinnedItems(userId: string): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId, isPinned: true },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return items.map(mapItem)
}

export async function getRecentItems(userId: string, limit = 10): Promise<ItemWithType[]> {
  const items = await prisma.item.findMany({
    where: { userId },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
  return items.map(mapItem)
}

export async function getItemStats(userId: string): Promise<ItemStats> {
  const [totalItems, favoriteItems] = await Promise.all([
    prisma.item.count({ where: { userId } }),
    prisma.item.count({ where: { userId, isFavorite: true } }),
  ])
  return { totalItems, favoriteItems }
}

export type ItemTypeWithCount = {
  id: string
  name: string
  icon: string
  color: string
  count: number
}

export type ItemTypeInfo = {
  id: string
  name: string
  icon: string
  color: string
}

export async function getItemsByType(userId: string, typeName: string): Promise<{ items: ItemWithType[]; itemType: ItemTypeInfo | null }> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: typeName, isSystem: true },
    select: { id: true, name: true, icon: true, color: true },
  })

  if (!itemType) return { items: [], itemType: null }

  const items = await prisma.item.findMany({
    where: { userId, itemTypeId: itemType.id },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return { items: items.map(mapItem), itemType }
}

export async function getItemTypesWithCounts(userId: string): Promise<ItemTypeWithCount[]> {
  const types = await prisma.itemType.findMany({
    where: { isSystem: true },
    include: {
      _count: { select: { items: { where: { userId } } } },
    },
    orderBy: { name: 'asc' },
  })
  return types.map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: t.color,
    count: t._count.items,
  }))
}
