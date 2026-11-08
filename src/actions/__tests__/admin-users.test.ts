import { beforeEach, describe, expect, it, vi } from 'vitest'
import bcrypt from 'bcryptjs'
import { Prisma } from '@/generated/prisma/client'
import { updateAdminUser, resetAdminUserPassword } from '@/actions/admin-users'
import { requireAuth } from '@/lib/action-helpers'
import { isUserAdmin } from '@/lib/db/admin'
import { prisma } from '@/lib/prisma'

vi.mock('@/lib/action-helpers', () => ({ requireAuth: vi.fn() }))
vi.mock('@/lib/db/admin', () => ({ isUserAdmin: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
}))

const auth = vi.mocked(requireAuth)
const isAdmin = vi.mocked(isUserAdmin)
const findUser = vi.mocked(prisma.user.findUnique)
const updateUser = vi.mocked(prisma.user.update)
const input = {
  id: 'target',
  name: 'Target',
  email: 'target@example.com',
  image: null,
  emailVerified: true,
  isAdmin: false,
  isPro: false,
}
const passwords = { id: 'target', password: 'secure-password', confirmPassword: 'secure-password' }

beforeEach(() => {
  vi.resetAllMocks()
  auth.mockResolvedValue({ userId: 'admin' })
  isAdmin.mockResolvedValue(true)
  findUser.mockResolvedValue({ emailVerified: new Date('2026-01-01') } as never)
  updateUser.mockResolvedValue({} as never)
})

describe('admin user actions', () => {
  it('denies unauthenticated requests', async () => {
    auth.mockResolvedValue({ success: false, error: 'Unauthorized' })
    expect(await updateAdminUser(input)).toEqual({ success: false, error: 'Unauthorized' })
    expect(await resetAdminUserPassword(passwords)).toEqual({ success: false, error: 'Unauthorized' })
    expect(isAdmin).not.toHaveBeenCalled()
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejects non-admin changes even with valid input', async () => {
    isAdmin.mockResolvedValue(false)
    expect(await updateAdminUser(input)).toEqual({ success: false, error: 'Administrator access required' })
    expect(await resetAdminUserPassword(passwords)).toEqual({ success: false, error: 'Administrator access required' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('preserves verification timestamp when changing email', async () => {
    expect(await updateAdminUser({ ...input, email: 'changed@example.com' })).toEqual({ success: true })
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: 'target' },
      data: {
        name: 'Target', email: 'changed@example.com', image: null,
        emailVerified: new Date('2026-01-01'), isAdmin: false, isPro: false,
      },
    })
  })

  it('can mark an email unverified or newly verified', async () => {
    await updateAdminUser({ ...input, emailVerified: false })
    expect(updateUser).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ emailVerified: null }) }))
    findUser.mockResolvedValue({ emailVerified: null } as never)
    await updateAdminUser(input)
    expect(updateUser).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ emailVerified: expect.any(Date) }) }))
  })

  it('blocks self-demotion even when submitted directly', async () => {
    const result = await updateAdminUser({ ...input, id: 'admin', isAdmin: false })
    expect(result).toEqual({ success: false, error: 'You cannot remove your own administrator access' })
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('rejects invalid emails and unsupported image hosts', async () => {
    expect((await updateAdminUser({ ...input, email: 'invalid' })).success).toBe(false)
    expect((await updateAdminUser({ ...input, image: 'https://example.com/avatar.png' })).success).toBe(false)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('returns a useful error when the user does not exist or email is taken', async () => {
    findUser.mockResolvedValueOnce(null)
    expect(await updateAdminUser(input)).toEqual({ success: false, error: 'User not found' })
    updateUser.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('duplicate', { code: 'P2002', clientVersion: '7.5.0' }))
    expect(await updateAdminUser(input)).toEqual({ success: false, error: 'Email is already in use' })
  })

  it('validates password length, byte length, and confirmation', async () => {
    expect((await resetAdminUserPassword({ ...passwords, password: 'short' })).success).toBe(false)
    expect((await resetAdminUserPassword({ ...passwords, password: '🔒'.repeat(19), confirmPassword: '🔒'.repeat(19) })).success).toBe(false)
    expect((await resetAdminUserPassword({ ...passwords, confirmPassword: 'different' })).success).toBe(false)
    expect(updateUser).not.toHaveBeenCalled()
  })

  it('hashes the password using bcrypt with 12 rounds', async () => {
    expect(await resetAdminUserPassword(passwords)).toEqual({ success: true })
    const call = updateUser.mock.calls[0][0]
    const hash = call.data.hashedPassword
    expect(typeof hash).toBe('string')
    if (typeof hash !== 'string') throw new Error('Expected hashed password')
    expect(call.where).toEqual({ id: 'target' })
    expect(bcrypt.getRounds(hash)).toBe(12)
    expect(await bcrypt.compare(passwords.password, hash)).toBe(true)
  })

  it('returns not found on a missing password reset target', async () => {
    updateUser.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '7.5.0' }))
    expect(await resetAdminUserPassword(passwords)).toEqual({ success: false, error: 'User not found' })
  })
})
