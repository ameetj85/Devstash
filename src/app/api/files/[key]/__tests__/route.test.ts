import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { itemFile: { findFirst: vi.fn() } } }))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { GET } from '../route'

const mockAuth = vi.mocked(auth)
const mockFind = vi.mocked(prisma.itemFile.findFirst)
const params = { params: Promise.resolve({ key: 'file-1' }) }

beforeEach(() => vi.clearAllMocks())

describe('GET /api/files/[key]', () => {
  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)
    expect((await GET(new NextRequest('http://localhost/api/files/file-1'), params)).status).toBe(401)
    expect(mockFind).not.toHaveBeenCalled()
  })

  it('does not disclose files belonging to another user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-2' } } as never)
    mockFind.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/files/file-1'), params)).status).toBe(404)
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'file-1', userId: 'user-2' } }))
  })

  it('serves images inline and returns the original bytes', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFind.mockResolvedValue({ data: new Uint8Array([0, 1, 255]), mimeType: 'image/png', fileName: 'a.png' } as never)
    const response = await GET(new NextRequest('http://localhost/api/files/file-1'), params)
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('inline')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect([...new Uint8Array(await response.arrayBuffer())]).toEqual([0, 1, 255])
  })

  it('serves downloads as attachments with the stored filename', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockFind.mockResolvedValue({ data: new Uint8Array([1]), mimeType: 'image/svg+xml', fileName: 'a.svg' } as never)
    const response = await GET(new NextRequest('http://localhost/api/files/file-1?name=other.txt'), params)
    expect(response.headers.get('content-disposition')).toBe('attachment; filename="a.svg"')
    expect(response.headers.get('content-security-policy')).toContain('sandbox')
  })
})
