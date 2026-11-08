import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/r2', () => ({
  r2: { send: vi.fn() },
  R2_BUCKET_NAME: 'test-bucket',
}))

import { auth } from '@/auth'
import { r2 } from '@/lib/r2'
import { POST } from '../route'

const mockAuth = vi.mocked(auth)
const mockSend = vi.mocked(r2.send)

function request(file?: File, itemType = 'file') {
  const form = new FormData()
  if (file) form.set('file', file)
  form.set('itemType', itemType)
  return new NextRequest('http://localhost/api/upload', { method: 'POST', body: form })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('R2_PUBLIC_URL', 'https://storage.example')
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('POST /api/upload', () => {
  it('requires authentication', async () => {
    mockAuth.mockResolvedValue(null as never)
    const response = await POST(request())
    expect(response.status).toBe(401)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it.each([
    ['file', 'text/plain', 'test.txt'],
    ['image', 'image/png', 'test.png'],
  ])('uploads %s for a non-Pro user', async (type, mime, name) => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    mockSend.mockResolvedValue({} as never)
    const response = await POST(request(new File(['test'], name, { type: mime }), type))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({
      fileName: name,
      fileSize: 4,
      key: expect.stringMatching(/^user-1\//),
    }))
    expect(mockSend).toHaveBeenCalledOnce()
  })

  it('continues to reject invalid file types', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    const response = await POST(request(new File(['test'], 'test.exe', { type: 'application/octet-stream' })))
    expect(response.status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('continues to require a file and valid item type', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    expect((await POST(request())).status).toBe(400)
    expect((await POST(request(new File(['test'], 'test.txt', { type: 'text/plain' }), 'note'))).status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('continues to enforce upload size limits', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isPro: false } } as never)
    const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })
    expect((await POST(request(file, 'image'))).status).toBe(400)
    expect(mockSend).not.toHaveBeenCalled()
  })
})
