import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { User } from '@supabase/supabase-js'
import { AI_FEATURES } from '@/lib/ai/config'
import { AiError } from '@/lib/ai/errors'
import {
  assertFeatureAllowed,
  getDailyAllowance,
  getFeatureRule,
  normalizeSubscriptionTier,
  SUBSCRIPTION_TIERS,
  type AiPrincipal,
} from '@/lib/ai/permissions'
import type { PlatformRole } from '@/lib/roles'

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

function signedIn(role: PlatformRole | null, extra: Partial<AiPrincipal> = {}): AiPrincipal {
  return principal({ user: { id: 'user-1' } as User, role, isAuthenticated: true, ...extra })
}

let savedKey: string | undefined
let savedFlag: string | undefined

beforeEach(() => {
  savedKey = process.env.OPENAI_API_KEY
  savedFlag = process.env.OPENAI_AI_FEATURES_ENABLED
  process.env.OPENAI_API_KEY = 'sk-test-key'
  delete process.env.OPENAI_AI_FEATURES_ENABLED
})

afterEach(() => {
  if (savedKey === undefined) delete process.env.OPENAI_API_KEY
  else process.env.OPENAI_API_KEY = savedKey
  if (savedFlag === undefined) delete process.env.OPENAI_AI_FEATURES_ENABLED
  else process.env.OPENAI_AI_FEATURES_ENABLED = savedFlag
})

describe('assertFeatureAllowed', () => {
  it('lets anonymous visitors use public transparency features', () => {
    for (const feature of ['town-guide', 'forum-summary', 'business-transparency'] as const) {
      expect(() => assertFeatureAllowed(feature, principal())).not.toThrow()
    }
  })

  it('requires a session for the report assistant', () => {
    expect(() => assertFeatureAllowed('report-assistant', principal())).toThrow(AiError)
    expect(() => assertFeatureAllowed('report-assistant', signedIn('USER'))).not.toThrow()
  })

  it('restricts moderation review to moderators', () => {
    expect(() => assertFeatureAllowed('moderation-review', signedIn('USER'))).toThrow(/moderators only/)
    expect(() => assertFeatureAllowed('moderation-review', signedIn('MODERATOR'))).not.toThrow()
    expect(() => assertFeatureAllowed('moderation-review', signedIn('ADMIN'))).not.toThrow()
  })

  it('lets the platform owner into moderation review without a moderator role', () => {
    expect(() => assertFeatureAllowed('moderation-review', signedIn(null, { isPlatformOwner: true }))).not.toThrow()
  })

  it('reports unauthenticated before forbidden, so we never leak role requirements to anonymous callers', () => {
    try {
      assertFeatureAllowed('moderation-review', principal())
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AiError).code).toBe('unauthenticated')
    }
  })

  it.each(AI_FEATURES)('refuses %s entirely when the kill switch is off', (feature) => {
    process.env.OPENAI_AI_FEATURES_ENABLED = 'false'
    try {
      assertFeatureAllowed(feature, signedIn('ADMIN', { isPlatformOwner: true }))
      expect.unreachable('should have thrown')
    } catch (error) {
      expect((error as AiError).code).toBe('ai_disabled')
    }
  })

  it('refuses every feature when no API key is configured', () => {
    delete process.env.OPENAI_API_KEY
    for (const feature of AI_FEATURES) {
      expect(() => assertFeatureAllowed(feature, signedIn('ADMIN'))).toThrow(AiError)
    }
  })
})

describe('feature rules', () => {
  it('gates exactly the two non-public features', () => {
    const gated = AI_FEATURES.filter((feature) => getFeatureRule(feature).requiresAuth)
    expect(gated.slice().sort()).toEqual(['moderation-review', 'report-assistant'])
  })

  it('gates moderation review by role', () => {
    expect(getFeatureRule('moderation-review').requiresModerator).toBe(true)
    expect(getFeatureRule('town-guide').requiresModerator).toBeUndefined()
  })
})

describe('subscription tiers', () => {
  it('falls back to the free tier for anything unrecognised', () => {
    expect(normalizeSubscriptionTier('enterprise_district')).toBe('enterprise_district')
    expect(normalizeSubscriptionTier('platinum')).toBe('free_resident')
    expect(normalizeSubscriptionTier(undefined)).toBe('free_resident')
    expect(normalizeSubscriptionTier({ tier: 'enterprise_district' })).toBe('free_resident')
  })

  it('gives every tier a positive allowance that never decreases with tier', () => {
    const allowances = SUBSCRIPTION_TIERS.map(getDailyAllowance)
    expect(allowances.every((value) => value > 0)).toBe(true)
    for (let index = 1; index < allowances.length; index += 1) {
      expect(allowances[index]).toBeGreaterThan(allowances[index - 1])
    }
  })
})
