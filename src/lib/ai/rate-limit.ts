import { AiError } from './errors'
import type { AiFeature } from './config'
import type { AiPrincipal } from './permissions'

/**
 * Rate limiting for AI endpoints.
 *
 * The default implementation is an in-process fixed-window counter. On Vercel
 * each serverless instance has its own memory, so this bounds abuse per
 * instance but is NOT a global guarantee. It exists as the integration point:
 * swap `setRateLimiter()` for a Redis/Upstash or Postgres-backed limiter to get
 * a cluster-wide limit without touching any route.
 */

export type RateLimitDecision = Readonly<{
  allowed: boolean
  remaining: number
  limit: number
  /** Unix ms at which the current window resets. */
  resetAt: number
}>

export type RateLimiter = (key: string, limit: number, windowMs: number) => Promise<RateLimitDecision>

const WINDOW_MS = 24 * 60 * 60 * 1000
/** Short burst window, applied on top of the daily allowance. */
const BURST_WINDOW_MS = 60 * 1000
const BURST_LIMIT = 8

type Counter = { count: number; resetAt: number }

const counters = new Map<string, Counter>()

function pruneExpired(now: number) {
  if (counters.size < 5_000) return
  counters.forEach((counter, key) => {
    if (counter.resetAt <= now) counters.delete(key)
  })
}

const inMemoryRateLimiter: RateLimiter = async (key, limit, windowMs) => {
  const now = Date.now()
  pruneExpired(now)

  const existing = counters.get(key)
  const counter = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + windowMs }

  counter.count += 1
  counters.set(key, counter)

  return {
    allowed: counter.count <= limit,
    remaining: Math.max(0, limit - counter.count),
    limit,
    resetAt: counter.resetAt,
  }
}

let activeRateLimiter: RateLimiter = inMemoryRateLimiter

/** Replace the limiter, e.g. with a Redis-backed implementation. */
export function setRateLimiter(limiter: RateLimiter) {
  activeRateLimiter = limiter
}

export function resetRateLimiterState() {
  counters.clear()
}

/**
 * Identify the caller for rate-limiting. Authenticated users are limited by
 * user id; anonymous callers fall back to a proxy-provided IP. The IP is used
 * for counting only and is never logged or persisted.
 */
export function getRateLimitSubject(principal: AiPrincipal, request: Request): string {
  if (principal.user) return `user:${principal.user.id}`

  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return `anon:${forwarded || realIp || 'unknown'}`
}

/**
 * Enforce both the burst limit and the tier's daily allowance.
 * Throws `rate_limited` when either is exceeded.
 */
export async function enforceRateLimit(
  feature: AiFeature,
  principal: AiPrincipal,
  request: Request,
): Promise<RateLimitDecision> {
  const subject = getRateLimitSubject(principal, request)

  const burst = await activeRateLimiter(`ai:burst:${feature}:${subject}`, BURST_LIMIT, BURST_WINDOW_MS)
  if (!burst.allowed) {
    throw new AiError('rate_limited', 'Too many requests in a short period. Please wait a moment.', {
      details: { retryAfterSeconds: Math.ceil((burst.resetAt - Date.now()) / 1000) },
    })
  }

  const daily = await activeRateLimiter(`ai:daily:${subject}`, principal.dailyAllowance, WINDOW_MS)
  if (!daily.allowed) {
    throw new AiError('rate_limited', 'You have reached your AI usage allowance for today.', {
      details: {
        limit: daily.limit,
        resetAt: new Date(daily.resetAt).toISOString(),
      },
    })
  }

  return daily
}
