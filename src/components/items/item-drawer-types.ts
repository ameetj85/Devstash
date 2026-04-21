import type { ItemFormState } from './item-form-body'

export type ItemDetailResponse = {
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
  createdAt: string
  updatedAt: string
  tags: string[]
  collections: { id: string; name: string }[]
  itemType: { name: string; icon: string; color: string }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function itemToFormState(item: ItemDetailResponse): ItemFormState {
  return {
    title: item.title,
    description: item.description ?? '',
    content: item.content ?? '',
    url: item.url ?? '',
    language: item.language ?? '',
    tags: item.tags.join(', '),
  }
}
