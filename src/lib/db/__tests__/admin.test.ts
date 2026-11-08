import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminUsers, isUserAdmin } from '@/lib/db/admin'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), findMany: vi.fn() } },
}))

const findUser = vi.mocked(prisma.user.findUnique)

beforeEach(() => {
  vi.resetAllMocks()
})

describe('getAdminUsers', () => {
  it('selects only the fields needed by the console', async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([] as never)
    await getAdminUsers()
    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true, name: true, email: true, emailVerified: true, image: true,
        isPro: true, isAdmin: true, createdAt: true, updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    })
  })
})

describe('isUserAdmin', () => {
  it('checks the current flag for the requested user', async () => {
    findUser.mockResolvedValue({ isAdmin: true } as never)

    await expect(isUserAdmin('user-1')).resolves.toBe(true)
    expect(findUser).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: { isAdmin: true },
    })
  })

  it.each([{ isAdmin: false }, null])('denies access when user is %s', async (user) => {
    findUser.mockResolvedValue(user as never)
    await expect(isUserAdmin('user-1')).resolves.toBe(false)
  })

  it('propagates database failures', async () => {
    findUser.mockRejectedValue(new Error('database unavailable'))
    await expect(isUserAdmin('user-1')).rejects.toThrow('database unavailable')
  })
})
