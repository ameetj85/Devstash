import OpenAI from 'openai'

export const AI_MODEL = 'gpt-5-nano'

// Lazily initialised — avoids module-level crash when env var is missing
let client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured')
    }
    client = new OpenAI({ apiKey })
  }
  return client
}
