import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/collections', () => ({
  updateCollection: vi.fn(),
}))

import { auth } from '@/auth'
import { updateCollection as updateCollectionQuery } from '@/lib/db/collections'
import { updateCollection } from '@/actions/collections'

const mockAuth = vi.mocked(auth)
const mockUpdateCollectionQuery = vi.mocked(updateCollectionQuery)

const validInput = {
  id: 'col-1',
  name: 'Updated Name',
  description: 'Updated description',
}

const fakeUpdated = {
  id: 'col-1',
  name: 'Updated Name',
  description: 'Updated description',
  isFavorite: false,
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateCollection server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await updateCollection(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await updateCollection(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns validation error when name is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateCollection({ id: 'col-1', name: '  ', description: null })

    expect(result.success).toBe(false)
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns validation error when name exceeds max length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateCollection({ id: 'col-1', name: 'a'.repeat(256), description: null })

    expect(result.success).toBe(false)
    expect(mockUpdateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns success with the updated collection', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockUpdateCollectionQuery.mockResolvedValue(fakeUpdated)

    const result = await updateCollection(validInput)

    expect(result).toEqual({ success: true, data: fakeUpdated })
    expect(mockUpdateCollectionQuery).toHaveBeenCalledWith('user-1', 'col-1', {
      name: 'Updated Name',
      description: 'Updated description',
    })
  })

  it('returns error when collection not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockUpdateCollectionQuery.mockRejectedValue(new Error('P2025'))

    const result = await updateCollection(validInput)

    expect(result).toEqual({ success: false, error: 'Collection not found' })
  })
})
