import type { ItemWithType } from '@/lib/db/items'
import type { FavoriteCollection } from '@/lib/db/collections'

export type SortOption = 'date' | 'name' | 'type'

export const SORT_LABELS: Record<SortOption, string> = {
  date: 'Date',
  name: 'Name',
  type: 'Type',
}

export function sortItems(items: ItemWithType[], sort: SortOption): ItemWithType[] {
  return [...items].sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.title.localeCompare(b.title)
      case 'type':
        return a.itemType.name.localeCompare(b.itemType.name) || a.title.localeCompare(b.title)
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })
}

export function sortCollections(collections: FavoriteCollection[], sort: SortOption): FavoriteCollection[] {
  return [...collections].sort((a, b) => {
    switch (sort) {
      case 'name':
      case 'type':
        return a.name.localeCompare(b.name)
      case 'date':
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    }
  })
}
