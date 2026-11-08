import { beforeEach, describe, expect, it, vi } from 'vitest'
import { requireAdmin } from '@/lib/admin-access'

const { mockAuth, mockIsUserAdmin, mockRedirect } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsUserAdmin: vi.fn(),
  mockRedirect: vi.fn((path: string): never => { throw new Error(`redirect:${path}`) }),
}))

vi.mock('@/auth', () => ({ auth: mockAuth }))
vi.mock('@/lib/db/admin', () => ({ isUserAdmin: mockIsUserAdmin }))
vi.mock('next/navigation', () => ({ redirect: mockRedirect }))

beforeEach(() => {
  vi.clearAllMocks()
})

describe('requireAdmin', () => {
  it('redirects unauthenticated users to sign in', async () => {
    mockAuth.mockResolvedValue(null)
    await expect(requireAdmin()).rejects.toThrow('redirect:/sign-in')
    expect(mockIsUserAdmin).not.toHaveBeenCalled()
  })

  it('checks the database even when the session claims admin access', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1', isAdmin: true } })
    mockIsUserAdmin.mockResolvedValue(false)
    await expect(requireAdmin()).rejects.toThrow('redirect:/dashboard')
    expect(mockIsUserAdmin).toHaveBeenCalledWith('user-1')
  })

  it('allows a current administrator', async () => {
    const session = { user: { id: 'user-1', isAdmin: true } }
    mockAuth.mockResolvedValue(session)
    mockIsUserAdmin.mockResolvedValue(true)
    await expect(requireAdmin()).resolves.toBe(session)
  })

  it('propagates database failures rather than granting access', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockIsUserAdmin.mockRejectedValue(new Error('database unavailable'))
    await expect(requireAdmin()).rejects.toThrow('database unavailable')
  })
})
