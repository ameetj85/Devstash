import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// NOTE: Rate limiting relies on the x-forwarded-for header being set by a
// trusted upstream proxy (e.g., Vercel, Cloudflare). If deployed without a
// proxy that controls this header, clients can spoof their IP and bypass limits.

type LimiterConfig = {
  limit: number
  window: Parameters<typeof Ratelimit.slidingWindow>[1]
  prefix: string
}

const LIMITERS: Record<string, LimiterConfig> = {
  // 5 attempts per 15 minutes, keyed by IP + email
  login: { limit: 5, window: '15 m', prefix: 'rl:login' },
  // 3 attempts per 1 hour, keyed by IP
  register: { limit: 3, window: '1 h', prefix: 'rl:register' },
  // 3 attempts per 1 hour, keyed by IP
  forgotPassword: { limit: 3, window: '1 h', prefix: 'rl:forgot-password' },
  // 5 attempts per 15 minutes, keyed by IP
  resetPassword: { limit: 5, window: '15 m', prefix: 'rl:reset-password' },
  // 5 attempts per 15 minutes, keyed by user ID
  changePassword: { limit: 5, window: '15 m', prefix: 'rl:change-password' },
  // 20 requests per 1 hour, keyed by user ID
  ai: { limit: 20, window: '1 h', prefix: 'rl:ai' },
}

// Lazily initialised — avoids module-level crash when env vars are missing.
// Returns null when Upstash credentials are not configured; callers fail open.
let redis: Redis | null = null
const limiters = new Map<string, Ratelimit>()

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  if (!redis) redis = new Redis({ url, token })
  return redis
}

function getLimiter(key: string): Ratelimit | null {
  const config = LIMITERS[key]
  if (!config) return null

  if (!limiters.has(key)) {
    const client = getRedis()
    if (!client) return null
    limiters.set(
      key,
      new Ratelimit({
        redis: client,
        limiter: Ratelimit.slidingWindow(config.limit, config.window),
        prefix: config.prefix,
      })
    )
  }
  return limiters.get(key) ?? null
}

export function getIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() ?? '127.0.0.1'
}

type LimiterKey = keyof typeof LIMITERS

export async function checkRateLimit(
  key: LimiterKey,
  identifier: string
): Promise<{ allowed: boolean; retryAfter: number }> {
  try {
    const limiter = getLimiter(key)
    if (!limiter) {
      // Fail open: Upstash not configured or unavailable
      return { allowed: true, retryAfter: 0 }
    }

    const result = await limiter.limit(identifier)
    if (result.success) {
      return { allowed: true, retryAfter: 0 }
    }

    // Clamp to minimum 1 second to avoid "0 minutes" user-facing messages
    const retryAfterSeconds = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
    return { allowed: false, retryAfter: retryAfterSeconds }
  } catch {
    // Fail open: Upstash unavailable
    return { allowed: true, retryAfter: 0 }
  }
}
