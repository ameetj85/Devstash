import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  toggleItemFavorite: vi.fn(),
}))

import { auth } from '@/auth'
import { toggleItemFavorite as toggleItemFavoriteQuery } from '@/lib/db/items'
import { toggleItemFavorite } from '@/actions/items'

const mockAuth = vi.mocked(auth)
const mockToggleQuery = vi.mocked(toggleItemFavoriteQuery)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleItemFavorite server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await toggleItemFavorite('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await toggleItemFavorite('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns error when item not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue(null)

    const result = await toggleItemFavorite('item-999')

    expect(result).toEqual({ success: false, error: 'Item not found or access denied' })
  })

  it('returns success with new favorite state', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue({ isFavorite: true })

    const result = await toggleItemFavorite('item-1')

    expect(result).toEqual({ success: true, data: { isFavorite: true } })
    expect(mockToggleQuery).toHaveBeenCalledWith('user-1', 'item-1')
  })

  it('passes correct userId and itemId to query', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-abc' } } as never)
    mockToggleQuery.mockResolvedValue({ isFavorite: false })

    await toggleItemFavorite('item-xyz')

    expect(mockToggleQuery).toHaveBeenCalledWith('user-abc', 'item-xyz')
  })
})
