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
import { generateDescription } from '@/actions/ai'

const mockAuth = vi.mocked(auth)
const mockGetOpenAIClient = vi.mocked(getOpenAIClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const validInput = {
  title: 'React useEffect cleanup',
  typeName: 'snippet',
  content: 'useEffect(() => { return () => cleanup() }, [dep])',
  language: 'typescript',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
})

describe('generateDescription server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for non-Pro users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: false },
    } as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error for invalid input', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await generateDescription({ title: '', typeName: '' } as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns error when no signal (no title, content, url, or fileName)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await generateDescription({
      title: null,
      typeName: 'snippet',
      content: null,
      url: null,
      fileName: null,
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('title or some content')
  })

  it('returns error when rate limited', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 })

    const result = await generateDescription(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ai', 'user-1')
  })

  it('returns description from {"description": "..."} response format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            description: 'A TypeScript React hook for cleanup logic on unmount.',
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe(
        'A TypeScript React hook for cleanup logic on unmount.'
      )
    }
  })

  it('strips surrounding quotes from the returned description', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ description: '"Hello world."' }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description).toBe('Hello world.')
    }
  })

  it('returns error when AI response has no description field', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ other: 'field' }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unexpected')
  })

  it('truncates content to 2000 chars', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockCreate = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ description: 'ok.' }),
    })
    mockGetOpenAIClient.mockReturnValue({
      responses: { create: mockCreate },
    } as never)

    const longContent = 'a'.repeat(5000)
    await generateDescription({ ...validInput, content: longContent })

    const inputArg = mockCreate.mock.calls[0][0].input as string
    expect(inputArg.length).toBeLessThan(5000)
  })

  it('works for link type with only url', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ description: 'React docs home page.' }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateDescription({
      title: null,
      typeName: 'link',
      url: 'https://react.dev',
    })

    expect(result.success).toBe(true)
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

    const result = await generateDescription(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to generate')
  })

  it('caps description at 500 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ description: 'x'.repeat(1000) }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await generateDescription(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.description.length).toBeLessThanOrEqual(500)
    }
  })
})
