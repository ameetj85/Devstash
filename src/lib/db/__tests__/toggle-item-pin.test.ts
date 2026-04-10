import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toggleItemPin } from '@/lib/db/items'

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

describe('toggleItemPin', () => {
  it('returns null when item not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleItemPin('user-1', 'item-999')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns null when item belongs to a different user', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await toggleItemPin('user-2', 'item-1')

    expect(result).toBeNull()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('toggles isPinned from false to true', async () => {
    mockFindFirst.mockResolvedValue({ isPinned: false } as never)
    mockUpdate.mockResolvedValue({ isPinned: true } as never)

    const result = await toggleItemPin('user-1', 'item-1')

    expect(result).toEqual({ isPinned: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isPinned: true },
      select: { isPinned: true },
    })
  })

  it('toggles isPinned from true to false', async () => {
    mockFindFirst.mockResolvedValue({ isPinned: true } as never)
    mockUpdate.mockResolvedValue({ isPinned: false } as never)

    const result = await toggleItemPin('user-1', 'item-1')

    expect(result).toEqual({ isPinned: false })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'item-1' },
      data: { isPinned: false },
      select: { isPinned: true },
    })
  })

  it('queries with correct userId and itemId', async () => {
    mockFindFirst.mockResolvedValue(null)

    await toggleItemPin('user-abc', 'item-xyz')

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: 'item-xyz', userId: 'user-abc' },
      select: { isPinned: true },
    })
  })
})
