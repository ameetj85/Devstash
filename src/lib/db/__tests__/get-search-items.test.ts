import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getSearchItems } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: {
      findMany: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindMany = vi.mocked(prisma.item.findMany)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('getSearchItems DB query', () => {
  it('returns mapped search items', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'item-1', title: 'React Hook', itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' } },
      { id: 'item-2', title: 'Git Push', itemType: { name: 'command', icon: 'Terminal', color: '#f97316' } },
    ] as never)

    const result = await getSearchItems('user-1')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'item-1',
      title: 'React Hook',
      typeName: 'snippet',
      typeIcon: 'Code',
      typeColor: '#3b82f6',
    })
    expect(result[1]).toEqual({
      id: 'item-2',
      title: 'Git Push',
      typeName: 'command',
      typeIcon: 'Terminal',
      typeColor: '#f97316',
    })
  })

  it('queries with correct userId and select fields', async () => {
    mockFindMany.mockResolvedValue([] as never)

    await getSearchItems('user-1')

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      select: {
        id: true,
        title: true,
        itemType: { select: { name: true, icon: true, color: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })
  })

  it('returns empty array when user has no items', async () => {
    mockFindMany.mockResolvedValue([] as never)

    const result = await getSearchItems('user-1')

    expect(result).toEqual([])
  })
})
