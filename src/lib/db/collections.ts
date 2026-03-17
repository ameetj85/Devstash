import { prisma } from '@/lib/prisma'

export type CollectionWithMeta = {
  id: string
  name: string
  description: string | null
  isFavorite: boolean
  itemCount: number
  dominantColor: string
  typeIcons: { icon: string; color: string; name: string }[]
}

export async function getCollections(): Promise<CollectionWithMeta[]> {
  const collections = await prisma.collection.findMany({
    include: {
      items: {
        include: {
          item: {
            include: {
              itemType: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return collections.map((col) => {
    const items = col.items.map((ic) => ic.item)

    // Count items per type to find dominant and unique types
    const typeCounts: Record<
      string,
      { count: number; icon: string; color: string; name: string }
    > = {}

    for (const item of items) {
      const t = item.itemType
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
      itemCount: items.length,
      dominantColor,
      typeIcons,
    }
  })
}
