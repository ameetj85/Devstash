import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createItem } from '@/lib/db/items'

vi.mock('@/lib/prisma', () => ({
  prisma: {
    itemType: {
      findFirst: vi.fn(),
    },
    item: {
      create: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.itemType.findFirst)
const mockCreate = vi.mocked(prisma.item.create)

const fakeItemType = { id: 'type-1', name: 'snippet', icon: 'Code', color: '#3b82f6', isSystem: true }

const fakeCreated = {
  id: 'item-1',
  title: 'My Snippet',
  description: null,
  content: 'console.log("hello")',
  contentType: 'TEXT',
  url: null,
  fileUrl: null,
  fileName: null,
  language: 'javascript',
  isFavorite: false,
  isPinned: false,
  createdAt: new Date('2026-03-21'),
  updatedAt: new Date('2026-03-21'),
  tags: [{ tag: { name: 'js' } }],
  collections: [],
  itemType: { name: 'snippet', icon: 'Code', color: '#3b82f6' },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('createItem', () => {
  it('returns null when item type is not found', async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await createItem('user-1', {
      title: 'Test',
      typeName: 'snippet',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: null,
      fileName: null,
    })

    expect(result).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates item and returns ItemDetail on success', async () => {
    mockFindFirst.mockResolvedValue(fakeItemType as never)
    mockCreate.mockResolvedValue(fakeCreated as never)

    const result = await createItem('user-1', {
      title: 'My Snippet',
      typeName: 'snippet',
      description: null,
      content: 'console.log("hello")',
      url: null,
      language: 'javascript',
      tags: ['js'],
      fileUrl: null,
      fileName: null,
    })

    expect(result).not.toBeNull()
    expect(result?.title).toBe('My Snippet')
    expect(result?.tags).toEqual(['js'])
    expect(result?.itemType.name).toBe('snippet')
  })

  it('sets contentType to TEXT for non-link types', async () => {
    mockFindFirst.mockResolvedValue(fakeItemType as never)
    mockCreate.mockResolvedValue(fakeCreated as never)

    await createItem('user-1', {
      title: 'Test',
      typeName: 'snippet',
      description: null,
      content: 'code',
      url: null,
      language: null,
      tags: [],
      fileUrl: null,
      fileName: null,
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'TEXT' }),
      })
    )
  })

  it('sets contentType to FILE for file type', async () => {
    const fileType = { ...fakeItemType, name: 'file' }
    mockFindFirst.mockResolvedValue(fileType as never)
    mockCreate.mockResolvedValue({ ...fakeCreated, contentType: 'FILE' } as never)

    await createItem('user-1', {
      title: 'My File',
      typeName: 'file',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: 'https://r2.example.com/file.pdf',
      fileName: 'file.pdf',
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ contentType: 'FILE' }),
      })
    )
  })

  it('looks up type with isSystem: true', async () => {
    mockFindFirst.mockResolvedValue(null)

    await createItem('user-1', {
      title: 'Test',
      typeName: 'prompt',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: null,
      fileName: null,
    })

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { name: 'prompt', isSystem: true },
    })
  })
})
