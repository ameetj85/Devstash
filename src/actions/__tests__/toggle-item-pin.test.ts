import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  toggleItemPin: vi.fn(),
}))

import { auth } from '@/auth'
import { toggleItemPin as toggleItemPinQuery } from '@/lib/db/items'
import { toggleItemPin } from '@/actions/items'

const mockAuth = vi.mocked(auth)
const mockToggleQuery = vi.mocked(toggleItemPinQuery)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('toggleItemPin server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await toggleItemPin('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await toggleItemPin('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockToggleQuery).not.toHaveBeenCalled()
  })

  it('returns error when item not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue(null)

    const result = await toggleItemPin('item-999')

    expect(result).toEqual({ success: false, error: 'Item not found or access denied' })
  })

  it('returns success with new pinned state', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockToggleQuery.mockResolvedValue({ isPinned: true })

    const result = await toggleItemPin('item-1')

    expect(result).toEqual({ success: true, data: { isPinned: true } })
    expect(mockToggleQuery).toHaveBeenCalledWith('user-1', 'item-1')
  })

  it('passes correct userId and itemId to query', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-abc' } } as never)
    mockToggleQuery.mockResolvedValue({ isPinned: false })

    await toggleItemPin('item-xyz')

    expect(mockToggleQuery).toHaveBeenCalledWith('user-abc', 'item-xyz')
  })
})
