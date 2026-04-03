import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/collections', () => ({
  deleteCollection: vi.fn(),
}))

import { auth } from '@/auth'
import { deleteCollection as deleteCollectionQuery } from '@/lib/db/collections'
import { deleteCollection } from '@/actions/collections'

const mockAuth = vi.mocked(auth)
const mockDeleteCollectionQuery = vi.mocked(deleteCollectionQuery)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('deleteCollection server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await deleteCollection('col-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockDeleteCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await deleteCollection('col-1')

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockDeleteCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns success when collection is deleted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteCollectionQuery.mockResolvedValue(undefined)

    const result = await deleteCollection('col-1')

    expect(result).toEqual({ success: true })
    expect(mockDeleteCollectionQuery).toHaveBeenCalledWith('user-1', 'col-1')
  })

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockDeleteCollectionQuery.mockRejectedValue(new Error('P2025'))

    const result = await deleteCollection('nonexistent')

    expect(result).toEqual({ success: false, error: 'Collection not found' })
  })
})
