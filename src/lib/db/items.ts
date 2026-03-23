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
  fileUrl: string | null
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
  fileUrl: string | null
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
    fileUrl: item.fileUrl,
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

export type UpdateItemData = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  tags: string[]
}

export async function updateItem(userId: string, itemId: string, data: UpdateItemData): Promise<ItemDetail | null> {
  const existing = await prisma.item.findFirst({ where: { id: itemId, userId } })
  if (!existing) return null

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      tags: {
        deleteMany: {},
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
      collections: { include: { collection: { select: { id: true, name: true } } } },
    },
  })

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description,
    content: updated.content,
    contentType: updated.contentType,
    url: updated.url,
    fileUrl: updated.fileUrl,
    fileName: updated.fileName,
    language: updated.language,
    isFavorite: updated.isFavorite,
    isPinned: updated.isPinned,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    tags: updated.tags.map((t) => t.tag.name),
    collections: updated.collections.map((c) => ({ id: c.collection.id, name: c.collection.name })),
    itemType: {
      name: updated.itemType.name,
      icon: updated.itemType.icon,
      color: updated.itemType.color,
    },
  }
}

export type CreateItemData = {
  title: string
  description: string | null
  content: string | null
  url: string | null
  language: string | null
  typeName: string
  tags: string[]
  fileUrl: string | null
  fileName: string | null
}

/** Creates a new item for the user. Returns null if the item type is not found. */
export async function createItem(userId: string, data: CreateItemData): Promise<ItemDetail | null> {
  const itemType = await prisma.itemType.findFirst({
    where: { name: data.typeName, isSystem: true },
  })
  if (!itemType) return null

  const contentType = data.typeName === 'file' || data.typeName === 'image' ? 'FILE' : 'TEXT'

  const created = await prisma.item.create({
    data: {
      title: data.title,
      description: data.description,
      content: data.content,
      url: data.url,
      language: data.language,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      contentType,
      userId,
      itemTypeId: itemType.id,
      tags: {
        create: data.tags.map((name) => ({
          tag: {
            connectOrCreate: {
              where: { name },
              create: { name },
            },
          },
        })),
      },
    },
    include: {
      itemType: true,
      tags: { include: { tag: true } },
      collections: { include: { collection: true } },
    },
  })

  return {
    id: created.id,
    title: created.title,
    description: created.description,
    content: created.content,
    contentType: created.contentType,
    url: created.url,
    fileUrl: created.fileUrl,
    fileName: created.fileName,
    language: created.language,
    isFavorite: created.isFavorite,
    isPinned: created.isPinned,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt,
    tags: created.tags.map((t) => t.tag.name),
    collections: created.collections.map((c) => ({ id: c.collection.id, name: c.collection.name })),
    itemType: {
      name: created.itemType.name,
      icon: created.itemType.icon,
      color: created.itemType.color,
    },
  }
}

/** Returns the deleted item (with fileUrl) or null if not found / not owned. */
export async function deleteItem(userId: string, itemId: string): Promise<{ fileUrl: string | null } | null> {
  const item = await prisma.item.findFirst({
    where: { id: itemId, userId },
    select: { fileUrl: true },
  })
  if (!item) return null
  await prisma.item.delete({ where: { id: itemId } })
  return item
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

