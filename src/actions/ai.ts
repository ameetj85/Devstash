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

const explainCodeSchema = z.object({
  content: z.string().trim().min(1).max(500_000),
  language: z.string().max(50).nullable().optional(),
  typeName: z.enum(['snippet', 'command']),
  title: z.string().max(500).nullable().optional(),
})

const generateDescriptionSchema = z.object({
  title: z.string().trim().max(500).nullable().optional(),
  typeName: z.string().min(1).max(50),
  content: z.string().max(500_000).nullable().optional(),
  url: z.string().max(2000).nullable().optional(),
  fileName: z.string().max(500).nullable().optional(),
  language: z.string().max(50).nullable().optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
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

export async function explainCode(
  data: z.infer<typeof explainCodeSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const isPro = session.user.isPro ?? false
  if (!isPro) {
    return { success: false as const, error: 'AI features require a Pro subscription.' }
  }

  const parsed = explainCodeSchema.safeParse(data)
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

  const { content, language, typeName, title } = parsed.data
  const truncatedContent = content.slice(0, 2000)

  const inputLines: string[] = [
    'Explain this code and return it as JSON.',
    `Type: ${typeName}`,
  ]
  if (title && title.trim()) inputLines.push(`Title: ${title.trim()}`)
  if (language && language.trim()) inputLines.push(`Language: ${language.trim()}`)
  inputLines.push(`Content:\n${truncatedContent}`)

  try {
    const client = getOpenAIClient()

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool assistant. Explain the given code or terminal command clearly and concisely in 200-300 words. Cover what it does and any key concepts a developer should understand. Use markdown: short paragraphs, inline code for identifiers, and bullet points when useful. Do not restate the whole code block verbatim. Return a JSON object with a single "explanation" key whose value is the markdown string.',
      input: inputLines.join('\n'),
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsedResponse = JSON.parse(text)

    const raw: unknown =
      typeof parsedResponse === 'string'
        ? parsedResponse
        : parsedResponse?.explanation

    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return { success: false as const, error: 'Unexpected AI response format' }
    }

    const explanation = raw.trim().slice(0, 3000)

    return { success: true as const, data: { explanation } }
  } catch (error) {
    console.error('AI explain error:', error)
    return {
      success: false as const,
      error: 'Failed to generate explanation. Please try again.',
    }
  }
}

export async function generateDescription(
  data: z.infer<typeof generateDescriptionSchema>
) {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }

  const isPro = session.user.isPro ?? false
  if (!isPro) {
    return { success: false as const, error: 'AI features require a Pro subscription.' }
  }

  const parsed = generateDescriptionSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: 'Invalid input' }
  }

  const { title, typeName, content, url, fileName, language, tags } = parsed.data

  const hasSignal =
    (title && title.trim().length > 0) ||
    (content && content.trim().length > 0) ||
    (url && url.trim().length > 0) ||
    (fileName && fileName.trim().length > 0)

  if (!hasSignal) {
    return {
      success: false as const,
      error: 'Add a title or some content first so the AI has something to describe.',
    }
  }

  const { allowed, retryAfter } = await checkRateLimit('ai', session.user.id)
  if (!allowed) {
    const minutes = Math.ceil(retryAfter / 60)
    return {
      success: false as const,
      error: `AI rate limit reached. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
    }
  }

  const truncatedContent = content ? content.slice(0, 2000) : ''

  const inputLines: string[] = [
    'Write a 1-2 sentence description for this item and return it as JSON.',
    `Type: ${typeName}`,
  ]
  if (title && title.trim()) inputLines.push(`Title: ${title.trim()}`)
  if (language && language.trim()) inputLines.push(`Language: ${language.trim()}`)
  if (url && url.trim()) inputLines.push(`URL: ${url.trim()}`)
  if (fileName && fileName.trim()) inputLines.push(`File name: ${fileName.trim()}`)
  if (tags && tags.length > 0) inputLines.push(`Tags: ${tags.join(', ')}`)
  if (truncatedContent) inputLines.push(`Content:\n${truncatedContent}`)

  try {
    const client = getOpenAIClient()

    const response = await client.responses.create({
      model: AI_MODEL,
      instructions:
        'You are a developer tool assistant. Given an item\'s type, title, and optional content/URL/file name/language/tags, write a clear, concise description in 1-2 sentences (max ~220 characters). Describe what the item is or does, not what the user should do with it. Use plain prose. Do not wrap in quotes, do not prefix with "Description:", and do not use markdown. Return a JSON object with a single "description" key.',
      input: inputLines.join('\n'),
      text: {
        format: { type: 'json_object' },
      },
    })

    const text = response.output_text
    const parsedResponse = JSON.parse(text)

    const raw: unknown =
      typeof parsedResponse === 'string'
        ? parsedResponse
        : parsedResponse?.description

    if (typeof raw !== 'string' || raw.trim().length === 0) {
      return { success: false as const, error: 'Unexpected AI response format' }
    }

    const description = raw.trim().replace(/^["']|["']$/g, '').slice(0, 500)

    return { success: true as const, data: { description } }
  } catch (error) {
    console.error('AI description error:', error)
    return {
      success: false as const,
      error: 'Failed to generate description. Please try again.',
    }
  }
}
