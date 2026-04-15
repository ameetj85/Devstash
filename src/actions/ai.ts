'use server'

import { z } from 'zod'
import { auth } from '@/auth'
import { getOpenAIClient, AI_MODEL } from '@/lib/openai'
import { checkRateLimit } from '@/lib/rate-limit'

const generateAutoTagsSchema = z.object({
  title: z.string().trim().min(1).max(500),
  content: z.string().max(500_000).nullable().optional(),
  typeName: z.string().min(1).max(50),
})

export async function generateAutoTags(
  data: z.infer<typeof generateAutoTagsSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const isPro = session.user.isPro ?? false
  if (!isPro) {
    return { success: false as const, error: 'AI features require a Pro subscription.' }
  }

  const parsed = generateAutoTagsSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid input' }
  }

  const { allowed, retryAfter } = await checkRateLimit('ai', session.user.id)
  if (!allowed) {
    const minutes = Math.ceil(retryAfter / 60)
    return {
      success: false as const,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    }
  }

  const { title, content, typeName } = parsed.data
  const truncatedContent = content ? content.slice(0, 2000) : ''

  const prompt = truncatedContent
    ? `Suggest 3-5 tags for this item as JSON.\nTitle: ${title}\nType: ${typeName}\nContent:\n${truncatedContent}`
    : `Suggest 3-5 tags for this item as JSON.\nTitle: ${title}\nType: ${typeName}`

  try {
    const client = getOpenAIClient()

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool assistant. Given an item title, type, and optional content, suggest 3-5 relevant tags for categorizing this item. Return a JSON object with a "tags" key containing an array of lowercase tag strings. Tags should be concise (1-3 words), relevant to the content, and useful for developers. Do not include generic tags like "code" or "programming".',
      input: prompt,
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsed = JSON.parse(text)

    // Handle both {"tags": [...]} and [...] formats
    const rawTags: unknown[] = Array.isArray(parsed) ? parsed : parsed.tags
    if (!Array.isArray(rawTags)) {
      return { success: false as const, error: 'Unexpected AI response format' }
    }

    const tags = rawTags
      .filter((t): t is string => typeof t === 'string')
      .map((t) => t.toLowerCase().trim())
      .filter((t) => t.length > 0)
      .slice(0, 5)

    return { success: true as const, data: { tags } }
  } catch (error) {
    console.error('AI auto-tag error:', error)
    return { success: false as const, error: 'Failed to generate tag suggestions. Please try again.' }
  }
}
