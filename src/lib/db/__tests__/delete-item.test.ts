import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteItem } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.item.findFirst)
const mockDelete = vi.mocked(prisma.item.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteItem', () => {
  it('returns null when item not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await deleteItem('user-1', 'item-999')

    expect(result).toBeNull()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('returns null when item belongs to a different user', async () => {
    mockFindFirst.mockResolvedValue(null) // findFirst with userId filter returns null

    const result = await deleteItem('user-2', 'item-1')

    expect(result).toBeNull()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes the item and returns it when found and owned', async () => {
    const fakeItem = { fileUrl: null }
    mockFindFirst.mockResolvedValue(fakeItem as never)
    mockDelete.mockResolvedValue(fakeItem as never)

    const result = await deleteItem('user-1', 'item-1')

    expect(result).toEqual({ fileUrl: null })
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: 'item-1' } })
  })

  it('queries with correct userId and itemId', async () => {
    mockFindFirst.mockResolvedValue(null)

    await deleteItem('user-abc', 'item-xyz')

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-xyz', userId: 'user-abc' },
      select: { fileUrl: true },
    })
  })
})
