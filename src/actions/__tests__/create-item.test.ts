import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/db/items', () => ({
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

import { auth } from '@/auth'
import { createItem as createItemQuery } from '@/lib/db/items'
import { createItem } from '@/actions/items'

const mockAuth = vi.mocked(auth)
const mockCreateItemQuery = vi.mocked(createItemQuery)

const validInput = {
  title: 'My Snippet',
  typeName: 'snippet' as const,
  description: null,
  content: 'const x = 1',
  url: null,
  language: 'typescript',
  tags: ['ts'],
}

const fakeItem = {
  id: 'item-1',
  title: 'My Snippet',
  description: null,
  content: 'const x = 1',
  contentType: 'TEXT',
  url: null,
  fileUrl: null,
  fileName: null,
  language: 'typescript',
  isFavorite: false,
  isPinned: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: ['ts'],
  collections: [],
  itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createItem server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null)

    const result = await createItem(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockCreateItemQuery).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await createItem(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
  })

  it('returns validation error when title is empty', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await createItem({ ...validInput, title: '  ' })

    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(mockCreateItemQuery).not.toHaveBeenCalled()
  })

  it('returns validation error when link type has no URL', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await createItem({
      ...validInput,
      typeName: 'link',
      url: null,
    })

    expect(result.success).toBe(false)
    expect(mockCreateItemQuery).not.toHaveBeenCalled()
  })

  it('returns error when item type is not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateItemQuery.mockResolvedValue(null)

    const result = await createItem(validInput)

    expect(result).toEqual({ success: false, error: 'Invalid item type' })
  })

  it('returns success with created item', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateItemQuery.mockResolvedValue(fakeItem)

    const result = await createItem(validInput)

    expect(result).toEqual({ success: true, data: fakeItem })
    expect(mockCreateItemQuery).toHaveBeenCalledWith('user-1', expect.objectContaining({
      title: 'My Snippet',
      typeName: 'snippet',
      tags: ['ts'],
    }))
  })

  it('passes valid link item through successfully', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockCreateItemQuery.mockResolvedValue({ ...fakeItem, typeName: 'link' } as never)

    const result = await createItem({
      ...validInput,
      typeName: 'link',
      url: 'https://example.com',
      content: null,
    })

    expect(result.success).toBe(true)
    expect(mockCreateItemQuery).toHaveBeenCalledWith('user-1', expect.objectContaining({
      typeName: 'link',
      url: 'https://example.com',
    }))
  })
})
