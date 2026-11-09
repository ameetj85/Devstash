import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { itemFile: { create: vi.fn(), deleteMany: vi.fn() } },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { POST } from '../route'

const mockAuth = vi.mocked(auth)
const mockCreate = vi.mocked(prisma.itemFile.create)
const mockDeleteMany = vi.mocked(prisma.itemFile.deleteMany)

function request(file?: File, itemType = 'file') {
  const form = new FormData()
  if (file) form.set('file', file)
  form.set('itemType', itemType)
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: form })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCreate.mockResolvedValue({ id: 'file-1' } as never)
})

describe('POST /api/upload', () => {
  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)
    const response = await POST(request())
    expect(response.status).toBe(401)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it.each([
    ['file', 'text/plain', 'test.txt'],
    ['image', 'image/png', 'test.png'],
  ])('uploads %s for a non-Pro user', async (type, mime, name) => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    const response = await POST(request(new File(['test'], name, { type: mime }), type))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({
      fileName: name,
      fileSize: 4,
      key: 'file-1',
      fileUrl: '/api/files/file-1',
    }))
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'user-1', itemType: type, mimeType: mime, size: 4 }),
    }))
    expect(mockDeleteMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', itemId: null, sourceKey: null }),
    }))
  })

  it('continues to reject invalid file types', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    const response = await POST(request(new File(['test'], 'test.exe', { type: 'application/octet-stream' })))
    expect(response.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('continues to require a file and valid item type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    expect((await POST(request())).status).toBe(400)
    expect((await POST(request(new File(['test'], 'test.txt', { type: 'text/plain' }), 'note'))).status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('continues to enforce upload size limits', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    expect((await POST(request(file, 'image'))).status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
