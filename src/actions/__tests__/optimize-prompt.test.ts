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
import { optimizePrompt } from '@/actions/ai'

const mockAuth = vi.mocked(auth)
const mockGetOpenAIClient = vi.mocked(getOpenAIClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const validInput = {
  content: 'Write a short poem about the moon.',
  typeName: 'prompt' as const,
  title: 'Moon poem prompt',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
})

describe('optimizePrompt server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for non-Pro users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: false },
    } as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error for invalid input (empty content)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await optimizePrompt({
      content: '',
      typeName: 'prompt',
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns error for invalid typeName (not prompt)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await optimizePrompt({
      ...validInput,
      typeName: 'snippet',
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns error when rate limited', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 })

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ai', 'user-1')
  })

  it('returns optimized prompt with changed=true', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            optimized: 'Write a 4-line haiku about the moon at midnight.',
            changed: true,
            rationale: 'Added format (haiku) and specificity.',
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.changed).toBe(true)
      expect(result.data.optimized).toContain('haiku')
      expect(result.data.rationale).toContain('format')
    }
  })

  it('returns changed=false when AI reports no improvement', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            optimized: validInput.content,
            changed: false,
            rationale: 'The prompt is already clear and well-structured.',
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.changed).toBe(false)
      expect(result.data.optimized).toBe(validInput.content)
    }
  })

  it('returns error when AI response has no optimized field', async () => {
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

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unexpected')
  })

  it('returns error when AI returns empty optimized string', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ optimized: '   ', changed: true }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unexpected')
  })

  it('truncates content to 2000 chars before sending to AI', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockCreate = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ optimized: 'ok', changed: true }),
    })
    mockGetOpenAIClient.mockReturnValue({
      responses: { create: mockCreate },
    } as never)

    const longContent = 'a'.repeat(5000)
    await optimizePrompt({ ...validInput, content: longContent })

    const inputArg = mockCreate.mock.calls[0][0].input as string
    expect(inputArg.length).toBeLessThan(5000)
  })

  it('caps optimized at 4000 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            optimized: 'x'.repeat(10_000),
            changed: true,
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.optimized.length).toBeLessThanOrEqual(4000)
    }
  })

  it('caps rationale at 500 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            optimized: 'refined prompt',
            changed: true,
            rationale: 'y'.repeat(2000),
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.rationale?.length ?? 0).toBeLessThanOrEqual(500)
    }
  })

  it('infers changed from content diff when AI omits the flag', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({
            optimized: 'A completely different refined prompt',
          }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.changed).toBe(true)
    }
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

    const result = await optimizePrompt(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to optimize')
  })
})
