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
import { explainCode } from '@/actions/ai'

const mockAuth = vi.mocked(auth)
const mockGetOpenAIClient = vi.mocked(getOpenAIClient)
const mockCheckRateLimit = vi.mocked(checkRateLimit)

const validInput = {
  content: 'const sum = (a: number, b: number) => a + b',
  typeName: 'snippet' as const,
  language: 'typescript',
  title: 'Sum function',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfter: 0 })
})

describe('explainCode server action', () => {
  it('returns unauthorized when no session', async () => {
    mockAuth.mockResolvedValue(null as never)

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Unauthorized')
  })

  it('returns error for non-Pro users', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: false },
    } as never)

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Pro subscription')
  })

  it('returns error for invalid input (empty content)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await explainCode({
      content: '',
      typeName: 'snippet',
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns error for invalid typeName (not snippet or command)', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const result = await explainCode({
      ...validInput,
      typeName: 'note',
    } as never)

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid input')
  })

  it('returns error when rate limited', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)
    mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 120 })

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('rate limit')
    expect(mockCheckRateLimit).toHaveBeenCalledWith('ai', 'user-1')
  })

  it('returns explanation from {"explanation": "..."} response format', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const markdown = '## Overview\n\nAdds two numbers and returns the result.'
    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ explanation: markdown }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await explainCode(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.explanation).toBe(markdown)
    }
  })

  it('returns error when AI response has no explanation field', async () => {
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

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unexpected')
  })

  it('truncates content to 2000 chars before sending to AI', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockCreate = vi.fn().mockResolvedValue({
      output_text: JSON.stringify({ explanation: 'ok' }),
    })
    mockGetOpenAIClient.mockReturnValue({
      responses: { create: mockCreate },
    } as never)

    const longContent = 'a'.repeat(5000)
    await explainCode({ ...validInput, content: longContent })

    const inputArg = mockCreate.mock.calls[0][0].input as string
    expect(inputArg.length).toBeLessThan(5000)
  })

  it('works for command type without language', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ explanation: 'Lists files with details.' }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await explainCode({
      content: 'ls -la',
      typeName: 'command',
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

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to generate')
  })

  it('caps explanation at 3000 characters', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ explanation: 'x'.repeat(10_000) }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await explainCode(validInput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.explanation.length).toBeLessThanOrEqual(3000)
    }
  })

  it('returns error when AI returns empty explanation', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', isPro: true },
    } as never)

    const mockClient = {
      responses: {
        create: vi.fn().mockResolvedValue({
          output_text: JSON.stringify({ explanation: '   ' }),
        }),
      },
    }
    mockGetOpenAIClient.mockReturnValue(mockClient as never)

    const result = await explainCode(validInput)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unexpected')
  })
})
