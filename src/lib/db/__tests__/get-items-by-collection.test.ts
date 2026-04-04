import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getItemsByCollection } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindMany = vi.mocked(prisma.item.findMany)
const mockCount = vi.mocked(prisma.item.count)

function fakeItem(overrides: Record<string, unknown> = {}) {
  return {
    id: 'item-1',
    title: 'Test Item',
    description: 'A test item',
    content: 'console.log("hi")',
    url: null,
    isFavorite: false,
    isPinned: false,
    fileUrl: null,
    fileName: null,
    fileSize: null,
    createdAt: new Date('2026-03-20'),
    updatedAt: new Date('2026-03-21'),
    tags: [{ tag: { name: 'react' } }],
    itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getItemsByCollection DB query', () => {
  it('returns mapped items and totalCount for the collection', async () => {
    mockFindMany.mockResolvedValue([fakeItem()] as never)
    mockCount.mockResolvedValue(1 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result.items).toHaveLength(1)
    expect(result.items[0].id).toBe('item-1')
    expect(result.items[0].tags).toEqual(['react'])
    expect(result.items[0].itemType.name).toBe('snippet')
    expect(result.totalCount).toBe(1)
  })

  it('filters by userId and collectionId with default pagination', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    await getItemsByCollection('user-1', 'col-1')

    expect(mockFindMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        collections: { some: { collectionId: 'col-1' } },
      },
      include: {
        itemType: true,
        tags: { include: { tag: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip: 0,
      take: 21,
    })
  })

  it('applies skip/take for page 2', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(30 as never)

    const result = await getItemsByCollection('user-1', 'col-1', 2, 10)

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    )
    expect(result.totalCount).toBe(30)
  })

  it('returns empty items and zero totalCount when no items in collection', async () => {
    mockFindMany.mockResolvedValue([] as never)
    mockCount.mockResolvedValue(0 as never)

    const result = await getItemsByCollection('user-1', 'col-empty')

    expect(result.items).toEqual([])
    expect(result.totalCount).toBe(0)
  })

  it('maps multiple items correctly', async () => {
    mockFindMany.mockResolvedValue([
      fakeItem({ id: 'item-1', tags: [{ tag: { name: 'react' } }] }),
      fakeItem({ id: 'item-2', tags: [{ tag: { name: 'vue' } }, { tag: { name: 'js' } }] }),
    ] as never)
    mockCount.mockResolvedValue(2 as never)

    const result = await getItemsByCollection('user-1', 'col-1')

    expect(result.items).toHaveLength(2)
    expect(result.items[0].tags).toEqual(['react'])
    expect(result.items[1].tags).toEqual(['vue', 'js'])
  })
})
