import { beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { AiError } from '@/lib/ai/errors'
import type { AiPrincipal } from '@/lib/ai/permissions'
import { enforceRateLimit, getRateLimitSubject, resetRateLimiterState } from '@/lib/ai/rate-limit'

function principal(overrides: Partial<AiPrincipal> = {}): AiPrincipal {
  return {
    supabase: {} as AiPrincipal['supabase'],
    user: null,
    role: null,
    isPlatformOwner: false,
    tier: 'free_resident',
    dailyAllowance: 10,
    isAuthenticated: false,
    ...overrides,
  }
}

function requestFrom(headers: Record<string, string> = {}) {
  return new Request('https://greenlist.online/api/ai/town-guide', { headers })
}

beforeEach(() => {
  resetRateLimiterState()
})

describe('getRateLimitSubject', () => {
  it('keys authenticated callers by user id, ignoring spoofable headers', () => {
    const subject = getRateLimitSubject(
      principal({ user: { id: 'user-1' } as User, isAuthenticated: true }),
      requestFrom({ 'x-forwarded-for': '9.9.9.9' }),
    )
    expect(subject).toBe('user:user-1')
  })

  it('keys anonymous callers by the first forwarded address', () => {
    const subject = getRateLimitSubject(principal(), requestFrom({ 'x-forwarded-for': '203.0.113.7, 70.41.3.18' }))
    expect(subject).toBe('anon:203.0.113.7')
  })

  it('falls back to x-real-ip and then to a stable unknown bucket', () => {
    expect(getRateLimitSubject(principal(), requestFrom({ 'x-real-ip': '198.51.100.4' }))).toBe('anon:198.51.100.4')
    expect(getRateLimitSubject(principal(), requestFrom())).toBe('anon:unknown')
  })
})

describe('enforceRateLimit', () => {
  it('allows a caller up to their daily allowance and then refuses', async () => {
    const caller = principal({ user: { id: 'user-1' } as User, isAuthenticated: true, dailyAllowance: 3 })

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const decision = await enforceRateLimit('town-guide', caller, requestFrom())
      expect(decision.limit).toBe(3)
    }

    await expect(enforceRateLimit('town-guide', caller, requestFrom())).rejects.toThrow(/allowance for today/)
  })

  it('trips the burst limit before the daily allowance for a rapid flood', async () => {
    const caller = principal({ user: { id: 'flooder' } as User, isAuthenticated: true, dailyAllowance: 1_000 })

    for (let attempt = 0; attempt < 8; attempt += 1) {
      await enforceRateLimit('town-guide', caller, requestFrom())
    }

    await expect(enforceRateLimit('town-guide', caller, requestFrom())).rejects.toThrow(/short period/)
  })

  it('raises a rate_limited AiError carrying retry guidance', async () => {
    const caller = principal({ user: { id: 'user-2' } as User, isAuthenticated: true, dailyAllowance: 1 })
    await enforceRateLimit('town-guide', caller, requestFrom())

    try {
      await enforceRateLimit('town-guide', caller, requestFrom())
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(AiError)
      expect((error as AiError).code).toBe('rate_limited')
      expect((error as AiError).details).toHaveProperty('resetAt')
    }
  })

  it('counts the daily allowance across features, not per feature', async () => {
    const caller = principal({ user: { id: 'user-3' } as User, isAuthenticated: true, dailyAllowance: 2 })

    await enforceRateLimit('town-guide', caller, requestFrom())
    await enforceRateLimit('forum-summary', caller, requestFrom())

    await expect(enforceRateLimit('business-transparency', caller, requestFrom())).rejects.toThrow(AiError)
  })

  it('does not let one caller consume another caller\'s allowance', async () => {
    const first = principal({ user: { id: 'a' } as User, isAuthenticated: true, dailyAllowance: 1 })
    const second = principal({ user: { id: 'b' } as User, isAuthenticated: true, dailyAllowance: 1 })

    await enforceRateLimit('town-guide', first, requestFrom())
    await expect(enforceRateLimit('town-guide', second, requestFrom())).resolves.toBeTruthy()
  })
})
