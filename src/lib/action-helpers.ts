import type { z } from 'zod'
import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/rate-limit'

export type AuthFailure = { success: false; error: 'Unauthorized' }
export type AuthSuccess = { userId: string }

export async function requireAuth(): Promise<AuthFailure | AuthSuccess> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false as const, error: 'Unauthorized' }
  }
  return { userId: session.user.id }
}

export type GateFailure = { success: false; error: string }

export async function checkAIRateLimit(userId: string): Promise<GateFailure | null> {
  const { allowed, retryAfter } = await checkRateLimit('ai', userId)
  if (allowed) return null

  const minutes = Math.ceil(retryAfter / 60)
  return {
    success: false as const,
    error: `AI rate limit reached. Try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`,
  }
}

export type ParseFailure = { success: false; error: Record<string, string[] | undefined> }
export type ParseSuccess<T> = { success: true; data: T }

export function parseOrFail<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ParseFailure | ParseSuccess<T> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.flatten().fieldErrors }
  }
  return { success: true as const, data: parsed.data }
}
