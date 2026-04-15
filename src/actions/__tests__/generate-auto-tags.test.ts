import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}))

vi.mock('@/lib/openai', () => ({
  AI_MODEL: 'gpt-5-nano',
  getOpenAIClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(),
}))

import { auth } from '@/auth'
import { getOpenAIClient } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'
import { generateAutoTags } from '@/actions/ai'

const mockAuth = vi.mocked(auth)
const mockGetOpenAIClient = vi.mocked(getOpenAIClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const validInput = {
  title: 'React useEffect cleanup',
  content: 'useEffect(() => { return () => cleanup() }, [dep])',
  typeName: 'snippet',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
})

describe('generateAutoTags server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for non-Pro users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: false },
    } as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error when rate limited', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 })

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ai', 'user-1')
  })

  it('returns error for invalid input', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await generateAutoTags({ title: '', content: null, typeName: 'snippet' })

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns tags from {"tags": [...]} response format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ tags: ['React', 'useEffect', 'Hooks'] }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'useeffect', 'hooks'])
    }
  })

  it('returns tags from array response format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify(['React', 'Cleanup', 'Lifecycle']),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual(['react', 'cleanup', 'lifecycle'])
    }
  })

  it('truncates content to 2000 chars', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockCreate = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ tags: ['test'] }),
    })
    mockGetOpenAIClient.mockReturnValue({
      responses: { create: mockCreate },
    } as never)

    const longContent = 'a'.repeat(5000)
    await generateAutoTags({ ...validInput, content: longContent })

    const inputArg = mockCreate.mock.calls[0][0].input as string
    // Content portion should be truncated to 2000 chars
    expect(inputArg.length).toBeLessThan(5000)
  })

  it('handles AI service errors gracefully', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockRejectedValue(new Error('API error')),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to generate')
  })

  it('limits tags to max 5', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateAutoTags(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags.length).toBeLessThanOrEqual(5)
    }
  })
})
