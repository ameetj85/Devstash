import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleCollectionFavorite } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.collection.findFirst)
const mockUpdate = vi.mocked(prisma.collection.update)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleCollectionFavorite', () => {
  it('returns null when collection not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleCollectionFavorite('user-1', 'col-999')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns null when collection belongs to a different user', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleCollectionFavorite('user-2', 'col-1')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('toggles isFavorite from false to true', async () => {
    mockFindFirst.mockResolvedValue({ isFavorite: false } as never)
    mockUpdate.mockResolvedValue({ isFavorite: true } as never)

    const result = await toggleCollectionFavorite('user-1', 'col-1')

    expect(result).toEqual({ isFavorite: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'col-1' },
      data: { isFavorite: true },
      select: { isFavorite: true },
    })
  })

  it('toggles isFavorite from true to false', async () => {
    mockFindFirst.mockResolvedValue({ isFavorite: true } as never)
    mockUpdate.mockResolvedValue({ isFavorite: false } as never)

    const result = await toggleCollectionFavorite('user-1', 'col-1')

    expect(result).toEqual({ isFavorite: false })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'col-1' },
      data: { isFavorite: false },
      select: { isFavorite: true },
    })
  })

  it('queries with correct userId and collectionId', async () => {
    mockFindFirst.mockResolvedValue(null)

    await toggleCollectionFavorite('user-abc', 'col-xyz')

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'col-xyz', userId: 'user-abc' },
      select: { isFavorite: true },
    })
  })
})
