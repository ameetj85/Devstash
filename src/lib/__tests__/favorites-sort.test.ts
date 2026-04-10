import { describe, it, expect } from 'vitest'
import { sortItems, sortCollections } from '../favorites-sort'
import type { ItemWithType } from '@/lib/db/items'
import type { FavoriteCollection } from '@/lib/db/collections'

function makeItem(overrides: { title: string; typeName: string; updatedAt: string; id?: string }): ItemWithType {
  return {
    id: overrides.id ?? overrides.title.toLowerCase().replace(/\s+/g, '-'),
    title: overrides.title,
    description: null,
    isFavorite: true,
    isPinned: false,
    fileUrl: null,
    updatedAt: new Date(overrides.updatedAt),
    itemType: {
      name: overrides.typeName,
      icon: 'Code',
      color: '#3b82f6',
    },
  } as ItemWithType
}

function makeCollection(overrides: { name: string; updatedAt: string; itemCount?: number }): FavoriteCollection {
  return {
    id: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    name: overrides.name,
    itemCount: overrides.itemCount ?? 0,
    updatedAt: new Date(overrides.updatedAt),
  }
}

const items: ItemWithType[] = [
  makeItem({ title: 'Zsh Config', typeName: 'command', updatedAt: '2026-04-01' }),
  makeItem({ title: 'Auth Hook', typeName: 'snippet', updatedAt: '2026-04-05' }),
  makeItem({ title: 'Deploy Steps', typeName: 'note', updatedAt: '2026-04-03' }),
  makeItem({ title: 'API Prompt', typeName: 'prompt', updatedAt: '2026-04-02' }),
]

const collections: FavoriteCollection[] = [
  makeCollection({ name: 'React Patterns', updatedAt: '2026-04-01' }),
  makeCollection({ name: 'AI Workflows', updatedAt: '2026-04-05' }),
  makeCollection({ name: 'DevOps', updatedAt: '2026-04-03' }),
]

describe('sortItems', () => {
  it('sorts by date descending (newest first)', () => {
    const result = sortItems(items, 'date')
    expect(result.map(i => i.title)).toEqual([
      'Auth Hook',
      'Deploy Steps',
      'API Prompt',
      'Zsh Config',
    ])
  })

  it('sorts by name alphabetically', () => {
    const result = sortItems(items, 'name')
    expect(result.map(i => i.title)).toEqual([
      'API Prompt',
      'Auth Hook',
      'Deploy Steps',
      'Zsh Config',
    ])
  })

  it('sorts by type name, then by title within same type', () => {
    const extraItems = [
      ...items,
      makeItem({ title: 'Docker Run', typeName: 'command', updatedAt: '2026-04-05', id: 'docker-run' }),
    ]
    const result = sortItems(extraItems, 'type')
    const types = result.map(i => i.itemType.name)
    expect(types).toEqual(['command', 'command', 'note', 'prompt', 'snippet'])
    const commands = result.filter(i => i.itemType.name === 'command')
    expect(commands.map(i => i.title)).toEqual(['Docker Run', 'Zsh Config'])
  })

  it('does not mutate the original array', () => {
    const original = items.map(i => i.title)
    sortItems(items, 'name')
    expect(items.map(i => i.title)).toEqual(original)
  })

  it('handles empty array', () => {
    expect(sortItems([], 'date')).toEqual([])
    expect(sortItems([], 'name')).toEqual([])
    expect(sortItems([], 'type')).toEqual([])
  })

  it('handles single item', () => {
    const single = [items[0]]
    expect(sortItems(single, 'name')).toEqual(single)
  })
})

describe('sortCollections', () => {
  it('sorts by date descending (newest first)', () => {
    const result = sortCollections(collections, 'date')
    expect(result.map(c => c.name)).toEqual([
      'AI Workflows',
      'DevOps',
      'React Patterns',
    ])
  })

  it('sorts by name alphabetically', () => {
    const result = sortCollections(collections, 'name')
    expect(result.map(c => c.name)).toEqual([
      'AI Workflows',
      'DevOps',
      'React Patterns',
    ])
  })

  it('sorts by name when type is selected (collections have no type)', () => {
    const result = sortCollections(collections, 'type')
    expect(result.map(c => c.name)).toEqual([
      'AI Workflows',
      'DevOps',
      'React Patterns',
    ])
  })

  it('does not mutate the original array', () => {
    const original = collections.map(c => c.name)
    sortCollections(collections, 'name')
    expect(collections.map(c => c.name)).toEqual(original)
  })

  it('handles empty array', () => {
    expect(sortCollections([], 'date')).toEqual([])
    expect(sortCollections([], 'name')).toEqual([])
  })
})
