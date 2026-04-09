import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}))

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { updateEditorPreferences } from '@/actions/settings'

const mockAuth = vi.mocked(auth)
const mockUpdate = vi.mocked(prisma.user.update)

const validInput = {
  fontSize: 14,
  tabSize: 4,
  wordWrap: true,
  minimap: false,
  theme: 'monokai' as const,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('updateEditorPreferences server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await updateEditorPreferences(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns unauthorized when session has no user id', async () => {
    mockAuth.mockResolvedValue({ user: {} } as never)

    const result = await updateEditorPreferences(validInput)

    expect(result).toEqual({ success: false, error: 'Unauthorized' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid fontSize', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateEditorPreferences({ ...validInput, fontSize: 50 })

    expect(result).toEqual({ success: false, error: 'Invalid preferences' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for invalid theme', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateEditorPreferences({ ...validInput, theme: 'nope' as never })

    expect(result).toEqual({ success: false, error: 'Invalid preferences' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns error for non-integer tabSize', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)

    const result = await updateEditorPreferences({ ...validInput, tabSize: 3.5 })

    expect(result).toEqual({ success: false, error: 'Invalid preferences' })
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('saves valid preferences and returns success', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } } as never)
    mockUpdate.mockResolvedValue({} as never)

    const result = await updateEditorPreferences(validInput)

    expect(result).toEqual({ success: true })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { editorPreferences: validInput },
    })
  })
})
