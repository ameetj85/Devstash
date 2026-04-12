import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/collections', () => ({
  createCollection: vi.fn(),
  getCollections: vi.fn(),
}))

vi.mock('@/lib/subscription', () => ({
  canCreateCollection: vi.fn().mockResolvedValue(true),
}))

import { auth } from '@/auth'
import { createCollection as createCollectionQuery } from '@/lib/db/collections'
import { createCollection } from '@/actions/collections'

const mockAuth = vi.mocked(auth)
const mockCreateCollectionQuery = vi.mocked(createCollectionQuery)

const validInput = {
  name: 'React Patterns',
  description: 'Useful hooks and patterns',
}

const fakeCreated = {
  id: 'col-1',
  name: 'React Patterns',
  description: 'Useful hooks and patterns',
  isFavorite: false,
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createCollection server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await createCollection(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await createCollection(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns validation error when name is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: true } } as never)

    const result = await createCollection({ name: '  ', description: null })

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns validation error when name exceeds max length', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: true } } as never)

    const result = await createCollection({ name: 'a'.repeat(256), description: null })

    expect(result.success).toBe(false)
    expect(mockCreateCollectionQuery).not.toHaveBeenCalled()
  })

  it('returns success with the created collection', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: true } } as never)
    mockCreateCollectionQuery.mockResolvedValue(fakeCreated)

    const result = await createCollection(validInput)

    expect(result).toEqual({ success: true, data: fakeCreated })
    expect(mockCreateCollectionQuery).toHaveBeenCalledWith('user-1', {
      name: 'React Patterns',
      description: 'Useful hooks and patterns',
    })
  })

  it('creates collection without description', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: true } } as never)
    mockCreateCollectionQuery.mockResolvedValue({ ...fakeCreated, description: null })

    const result = await createCollection({ name: 'No Desc' })

    expect(result.success).toBe(true)
    expect(mockCreateCollectionQuery).toHaveBeenCalledWith('user-1', {
      name: 'No Desc',
      description: null,
    })
  })
})
