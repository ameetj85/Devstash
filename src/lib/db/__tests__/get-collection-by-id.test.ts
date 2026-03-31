import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getCollectionById } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.collection.findFirst)

const fakeCollection = {
  id: 'col-1',
  name: 'React Patterns',
  description: 'Useful React patterns',
  isFavorite: true,
  createdAt: new Date('2026-03-23'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getCollectionById DB query', () => {
  it('returns collection when found for the user', async () => {
    mockFindFirst.mockResolvedValue(fakeCollection as never)

    const result = await getCollectionById('user-1', 'col-1')

    expect(result).toEqual(fakeCollection)
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
    })
  })

  it('returns null when collection does not exist', async () => {
    mockFindFirst.mockResolvedValue(null as never)

    const result = await getCollectionById('user-1', 'nonexistent')

    expect(result).toBeNull()
  })

  it('scopes query to the given userId', async () => {
    mockFindFirst.mockResolvedValue(null as never)

    await getCollectionById('user-42', 'col-1')

    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-42' }),
      })
    )
  })
})
