import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleItemFavorite } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.item.findFirst)
const mockUpdate = vi.mocked(prisma.item.update)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleItemFavorite', () => {
  it('returns null when item not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleItemFavorite('user-1', 'item-999')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns null when item belongs to a different user', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleItemFavorite('user-2', 'item-1')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('toggles isFavorite from false to true', async () => {
    mockFindFirst.mockResolvedValue({ isFavorite: false } as never)
    mockUpdate.mockResolvedValue({ isFavorite: true } as never)

    const result = await toggleItemFavorite('user-1', 'item-1')

    expect(result).toEqual({ isFavorite: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isFavorite: true },
      select: { isFavorite: true },
    })
  })

  it('toggles isFavorite from true to false', async () => {
    mockFindFirst.mockResolvedValue({ isFavorite: true } as never)
    mockUpdate.mockResolvedValue({ isFavorite: false } as never)

    const result = await toggleItemFavorite('user-1', 'item-1')

    expect(result).toEqual({ isFavorite: false })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isFavorite: false },
      select: { isFavorite: true },
    })
  })

  it('queries with correct userId and itemId', async () => {
    mockFindFirst.mockResolvedValue(null)

    await toggleItemFavorite('user-abc', 'item-xyz')

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-xyz', userId: 'user-abc' },
      select: { isFavorite: true },
    })
  })
})
