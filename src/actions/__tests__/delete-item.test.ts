import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  deleteItem: vi.fn(),
  updateItem: vi.fn(),
}))

import { auth } from '@/auth'
import { deleteItem as deleteItemQuery } from '@/lib/db/items'
import { deleteItem } from '@/actions/items'

const mockAuth = vi.mocked(auth)
const mockDeleteItemQuery = vi.mocked(deleteItemQuery)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteItem server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await deleteItem('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockDeleteItemQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await deleteItem('item-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockDeleteItemQuery).not.toHaveBeenCalled()
  })

  it('returns error when item not found or not owned', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue(false)

    const result = await deleteItem('item-999')

    expect(result).toEqual({ success: false, error: 'Item not found or access denied' })
  })

  it('returns success when item is deleted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue(true)

    const result = await deleteItem('item-1')

    expect(result).toEqual({ success: true })
    expect(mockDeleteItemQuery).toHaveBeenCalledWith('user-1', 'item-1')
  })
})
