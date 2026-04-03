import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteCollection } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      delete: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockDelete = vi.mocked(prisma.collection.delete)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteCollection DB query', () => {
  it('deletes the collection scoped to user', async () => {
    mockDelete.mockResolvedValue(undefined as never)

    await deleteCollection('user-1', 'col-1')

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 'col-1', userId: 'user-1' },
    })
  })

  it('scopes delete to the correct user', async () => {
    mockDelete.mockResolvedValue(undefined as never)

    await deleteCollection('user-42', 'col-5')

    expect(mockDelete).toHaveBeenCalledWith({
      where: { id: 'col-5', userId: 'user-42' },
    })
  })

  it('propagates errors from Prisma', async () => {
    mockDelete.mockRejectedValue(new Error('P2025'))

    await expect(deleteCollection('user-1', 'nonexistent')).rejects.toThrow('P2025')
  })
})
