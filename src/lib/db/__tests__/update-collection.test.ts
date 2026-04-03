import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateCollection } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      update: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockUpdate = vi.mocked(prisma.collection.update)

const fakeUpdated = {
  id: 'col-1',
  name: 'Updated Name',
  description: 'Updated description',
  isFavorite: false,
  createdAt: new Date('2026-03-23'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateCollection DB query', () => {
  it('updates and returns the collection', async () => {
    mockUpdate.mockResolvedValue(fakeUpdated as never)

    const result = await updateCollection('user-1', 'col-1', {
      name: 'Updated Name',
      description: 'Updated description',
    })

    expect(result).toEqual(fakeUpdated)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
      data: { name: 'Updated Name', description: 'Updated description' },
      select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
    })
  })

  it('sets description to null when not provided', async () => {
    mockUpdate.mockResolvedValue({ ...fakeUpdated, description: null } as never)

    await updateCollection('user-1', 'col-1', { name: 'No Desc' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    )
  })

  it('scopes update to the correct user', async () => {
    mockUpdate.mockResolvedValue(fakeUpdated as never)

    await updateCollection('user-42', 'col-5', { name: 'Test' })

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'col-5', userId: 'user-42' },
      })
    )
  })
})
