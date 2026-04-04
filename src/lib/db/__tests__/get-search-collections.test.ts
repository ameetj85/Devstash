import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSearchCollections } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindMany = vi.mocked(prisma.collection.findMany)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSearchCollections DB query', () => {
  it('returns mapped search collections with item counts', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'col-1', name: 'React Patterns', _count: { items: 5 } },
      { id: 'col-2', name: 'AI Workflows', _count: { items: 0 } },
    ] as never)

    const result = await getSearchCollections('user-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 'col-1', name: 'React Patterns', itemCount: 5 })
    expect(result[1]).toEqual({ id: 'col-2', name: 'AI Workflows', itemCount: 0 })
  })

  it('queries with correct userId and select fields', async () => {
    mockFindMany.mockResolvedValue([] as never)

    await getSearchCollections('user-1')

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

  it('returns empty array when user has no collections', async () => {
    mockFindMany.mockResolvedValue([] as never)

    const result = await getSearchCollections('user-1')

    expect(result).toEqual([])
  })
})
