import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  deleteItem: vi.fn(),
  updateItem: vi.fn(),
}))

vi.mock('@/lib/r2', () => ({
  deleteR2Object: vi.fn().mockResolvedValue(undefined),
  keyFromUrl: vi.fn().mockReturnValue(null),
}))

import { auth } from '@/auth'
import { deleteItem as deleteItemQuery } from '@/lib/db/items'
import { deleteR2Object, keyFromUrl } from '@/lib/r2'
import { deleteItem } from '@/actions/items'

const mockAuth = vi.mocked(auth)
const mockDeleteItemQuery = vi.mocked(deleteItemQuery)
const mockDeleteR2Object = vi.mocked(deleteR2Object)
const mockKeyFromUrl = vi.mocked(keyFromUrl)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteItem server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

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
    mockDeleteItemQuery.mockResolvedValue(null)

    const result = await deleteItem('item-999')

    expect(result).toEqual({ success: false, error: 'Item not found or access denied' })
  })

  it('returns success when item is deleted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue({ fileUrl: null })

    const result = await deleteItem('item-1')

    expect(result).toEqual({ success: true })
    expect(mockDeleteItemQuery).toHaveBeenCalledWith('user-1', 'item-1')
  })

  it('deletes R2 object when item has a fileUrl', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue({ fileUrl: 'https://pub.r2.dev/user-1/file.pdf' })
    mockKeyFromUrl.mockReturnValue('user-1/file.pdf')

    await deleteItem('item-1')

    expect(mockKeyFromUrl).toHaveBeenCalledWith('https://pub.r2.dev/user-1/file.pdf')
    expect(mockDeleteR2Object).toHaveBeenCalledWith('user-1/file.pdf')
  })

  it('does not call deleteR2Object when item has no fileUrl', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue({ fileUrl: null })

    await deleteItem('item-1')

    expect(mockDeleteR2Object).not.toHaveBeenCalled()
  })

  it('does not call deleteR2Object when key cannot be extracted from fileUrl', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteItemQuery.mockResolvedValue({ fileUrl: 'https://external.com/file.pdf' })
    mockKeyFromUrl.mockReturnValue(null)

    await deleteItem('item-1')

    expect(mockDeleteR2Object).not.toHaveBeenCalled()
  })
})
