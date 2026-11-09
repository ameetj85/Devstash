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
    itemFile: {
      findFirst: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/prisma'

const mockFindFirst = vi.mocked(prisma.itemType.findFirst)
const mockCreate = vi.mocked(prisma.item.create)
const mockFindFile = vi.mocked(prisma.itemFile.findFirst)

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
  fileSize: null,
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
      fileSize: null,
      collectionIds: [],
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
      fileSize: null,
      collectionIds: [],
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
      fileSize: null,
      collectionIds: [],
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
    mockFindFile.mockResolvedValue({ id: 'file-1', fileName: 'file.pdf', size: 1024 } as never)
    mockCreate.mockResolvedValue({ ...fakeCreated, contentType: 'FILE' } as never)

    await createItem('user-1', {
      title: 'My File',
      typeName: 'file',
      description: null,
      content: null,
      url: null,
      language: null,
      tags: [],
      fileUrl: '/api/files/file-1',
      fileName: 'file.pdf',
      fileSize: 1024,
      collectionIds: [],
    })

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contentType: 'FILE',
          file: { connect: expect.objectContaining({ id: 'file-1', userId: 'user-1' }) },
        }),
      })
    )
  })

  it('rejects a file that is not an owned, unattached upload', async () => {
    mockFindFirst.mockResolvedValue({ ...fakeItemType, name: 'file' } as never)
    mockFindFile.mockResolvedValue(null)
    const result = await createItem('user-1', {
      title: 'File', typeName: 'file', description: null, content: null, url: null,
      language: null, tags: [], fileUrl: '/api/files/file-1', fileName: 'claimed.txt',
      fileSize: 1, collectionIds: [],
    })
    expect(result).toBeNull()
    expect(mockFindFile).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'file-1', userId: 'user-1', itemId: null, itemType: 'file', sourceKey: null },
    }))
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects remote file URLs instead of attaching them', async () => {
    mockFindFirst.mockResolvedValue({ ...fakeItemType, name: 'file' } as never)
    const result = await createItem('user-1', {
      title: 'File', typeName: 'file', description: null, content: null, url: null,
      language: null, tags: [], fileUrl: 'https://example.com/file', fileName: 'file',
      fileSize: 1, collectionIds: [],
    })
    expect(result).toBeNull()
    expect(mockFindFile).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('rejects an upload claimed concurrently by another item', async () => {
    mockFindFirst.mockResolvedValue({ ...fakeItemType, name: 'file' } as never)
    mockFindFile.mockResolvedValue({ id: 'file-1', fileName: 'file.txt', size: 1 } as never)
    mockCreate.mockRejectedValue({ code: 'P2025' })
    const result = await createItem('user-1', {
      title: 'File', typeName: 'file', description: null, content: null, url: null,
      language: null, tags: [], fileUrl: '/api/files/file-1', fileName: 'file.txt',
      fileSize: 1, collectionIds: [],
    })
    expect(result).toBeNull()
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
      fileSize: null,
      collectionIds: [],
    })

    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { name: 'prompt', isSystem: true },
    })
  })
})
