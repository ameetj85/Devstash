import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/collections', () => ({
  toggleCollectionFavorite: vi.fn(),
}))

import { auth } from '@/auth'
import { toggleCollectionFavorite as toggleCollectionFavoriteQuery } from '@/lib/db/collections'
import { toggleCollectionFavorite } from '@/actions/collections'

const mockAuth = vi.mocked(auth)
const mockToggleQuery = vi.mocked(toggleCollectionFavoriteQuery)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleCollectionFavorite server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await toggleCollectionFavorite('col-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await toggleCollectionFavorite('col-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue(null)

    const result = await toggleCollectionFavorite('col-999')

    expect(result).toEqual({ success: false, error: 'Collection not found or access denied' })
  })

  it('returns success with new favorite state', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue({ isFavorite: true })

    const result = await toggleCollectionFavorite('col-1')

    expect(result).toEqual({ success: true, data: { isFavorite: true } })
    expect(mockToggleQuery).toHaveBeenCalledWith('user-1', 'col-1')
  })

  it('passes correct userId and collectionId to query', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-abc' } } as never)
    mockToggleQuery.mockResolvedValue({ isFavorite: false })

    await toggleCollectionFavorite('col-xyz')

    expect(mockToggleQuery).toHaveBeenCalledWith('user-abc', 'col-xyz')
  })
})
