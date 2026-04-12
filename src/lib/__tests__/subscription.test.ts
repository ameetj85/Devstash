import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canCreateItem, canCreateCollection, canUseFileUpload } from '../subscription'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    item: { count: vi.fn() },
    collection: { count: vi.fn() },
  },
}))

import { prisma } from '@/lib/prisma'

const mockItemCount = prisma.item.count as ReturnType<typeof vi.fn>
const mockCollectionCount = prisma.collection.count as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
})

describe('canCreateItem', () => {
  it('returns true for Pro user', async () => {
    expect(await canCreateItem('user-1', true)).toBe(true)
    expect(mockItemCount).not.toHaveBeenCalled()
  })

  it('returns true for free user under limit', async () => {
    mockItemCount.mockResolvedValue(10)
    expect(await canCreateItem('user-1', false)).toBe(true)
  })

  it('returns false for free user at limit', async () => {
    mockItemCount.mockResolvedValue(50)
    expect(await canCreateItem('user-1', false)).toBe(false)
  })
})

describe('canCreateCollection', () => {
  it('returns true for Pro user', async () => {
    expect(await canCreateCollection('user-1', true)).toBe(true)
    expect(mockCollectionCount).not.toHaveBeenCalled()
  })

  it('returns true for free user under limit', async () => {
    mockCollectionCount.mockResolvedValue(1)
    expect(await canCreateCollection('user-1', false)).toBe(true)
  })

  it('returns false for free user at limit', async () => {
    mockCollectionCount.mockResolvedValue(3)
    expect(await canCreateCollection('user-1', false)).toBe(false)
  })
})

describe('canUseFileUpload', () => {
  it('returns true for Pro user', () => {
    expect(canUseFileUpload(true)).toBe(true)
  })

  it('returns false for free user', () => {
    expect(canUseFileUpload(false)).toBe(false)
  })
})
