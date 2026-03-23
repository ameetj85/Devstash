import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCollection } from '@/lib/db/collections'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    collection: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockCreate = vi.mocked(prisma.collection.create)

const fakeCreated = {
  id: 'col-1',
  name: 'React Patterns',
  description: 'Useful React patterns',
  isFavorite: false,
  createdAt: new Date('2026-03-23'),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createCollection DB query', () => {
  it('creates and returns the new collection', async () => {
    mockCreate.mockResolvedValue(fakeCreated as never)

    const result = await createCollection('user-1', {
      name: 'React Patterns',
      description: 'Useful React patterns',
    })

    expect(result).toEqual(fakeCreated)
    expect(mockCreate).toHaveBeenCalledWith({
      data: { name: 'React Patterns', description: 'Useful React patterns', userId: 'user-1' },
      select: { id: true, name: true, description: true, isFavorite: true, createdAt: true },
    })
  })

  it('stores null description when not provided', async () => {
    mockCreate.mockResolvedValue({ ...fakeCreated, description: null } as never)

    await createCollection('user-1', { name: 'No Desc' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ description: null }),
      })
    )
  })

  it('passes userId from caller', async () => {
    mockCreate.mockResolvedValue(fakeCreated as never)

    await createCollection('user-42', { name: 'Mine' })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-42' }),
      })
    )
  })
})
