import type { SupabaseClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'
import { getCurrentPrincipal } from '@/lib/supabase/authz'
import { canModerate, type PlatformRole } from '@/lib/roles'
import { AiError } from './errors'
import { getAiConfig, type AiFeature } from './config'

/**
 * Server-authoritative authorization and entitlement layer for AI features.
 *
 * Entitlements are derived on the server from the account's role and
 * subscription tier. Nothing here trusts a client-supplied tier, and the
 * subscription tier is deliberately read from the profile record rather than
 * from the request.
 */

export const SUBSCRIPTION_TIERS = [
  'free_resident',
  'verified_resident',
  'professional_member',
  'business_property',
  'enterprise_district',
] as const

export type SubscriptionTier = (typeof SUBSCRIPTION_TIERS)[number]

export function isSubscriptionTier(value: unknown): value is SubscriptionTier {
  return typeof value === 'string' && SUBSCRIPTION_TIERS.includes(value as SubscriptionTier)
}

export function normalizeSubscriptionTier(value: unknown): SubscriptionTier {
  return isSubscriptionTier(value) ? value : 'free_resident'
}

/**
 * Daily request allowance per tier. Paid tiers buy *more usage*, never better
 * outcomes — see the platform doctrine in `src/config/platform-policies.ts`.
 */
const DAILY_ALLOWANCE: Readonly<Record<SubscriptionTier, number>> = {
  free_resident: 25,
  verified_resident: 75,
  professional_member: 250,
  business_property: 500,
  enterprise_district: 2_000,
}

/** Anonymous visitors get a small allowance so public navigation still works. */
const ANONYMOUS_DAILY_ALLOWANCE = 10

type FeatureRule = Readonly<{
  /** Whether an authenticated session is required at all. */
  requiresAuth: boolean
  /** Extra role gate, if any. */
  requiresModerator?: boolean
}>

const FEATURE_RULES: Readonly<Record<AiFeature, FeatureRule>> = {
  // Public transparency navigation must work without an account.
  'town-guide': { requiresAuth: false },
  'forum-summary': { requiresAuth: false },
  'report-assistant': { requiresAuth: true },
  'moderation-review': { requiresAuth: true, requiresModerator: true },
  'business-transparency': { requiresAuth: false },
}

export type AiPrincipal = Readonly<{
  supabase: SupabaseClient
  user: User | null
  role: PlatformRole | null
  isPlatformOwner: boolean
  tier: SubscriptionTier
  dailyAllowance: number
  isAuthenticated: boolean
}>

/**
 * Resolve the caller. The returned Supabase client carries the caller's
 * session, so every query made with it is enforced by RLS as that user — this
 * is what keeps AI tools from reading records the user cannot see.
 */
export async function resolveAiPrincipal(): Promise<AiPrincipal> {
  const { supabase, user, role, isPlatformOwner } = await getCurrentPrincipal()

  let tier: SubscriptionTier = 'free_resident'
  if (user) {
    // `subscription_tier` may not exist yet in every environment; a missing
    // column must not break AI access, it just means the free tier.
    const { data } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .maybeSingle()

    tier = normalizeSubscriptionTier((data as { subscription_tier?: unknown } | null)?.subscription_tier)
  }

  return Object.freeze({
    supabase: supabase as SupabaseClient,
    user,
    role,
    isPlatformOwner,
    tier,
    dailyAllowance: user ? DAILY_ALLOWANCE[tier] : ANONYMOUS_DAILY_ALLOWANCE,
    isAuthenticated: user !== null,
  })
}

/**
 * Throw a client-safe error unless the principal may use this feature.
 * Checks, in order: feature flag, authentication, role.
 */
export function assertFeatureAllowed(feature: AiFeature, principal: AiPrincipal): void {
  const config = getAiConfig()
  if (!config.enabled) {
    throw new AiError('ai_disabled', config.disabledReason ?? 'AI features are unavailable.')
  }

  const rule = FEATURE_RULES[feature]

  if (rule.requiresAuth && !principal.isAuthenticated) {
    throw new AiError('unauthenticated', 'Sign in to use this assistant.')
  }

  if (rule.requiresModerator && !canModerate(principal.role, principal.isPlatformOwner)) {
    throw new AiError('forbidden', 'This assistant is available to moderators only.')
  }
}

export function getFeatureRule(feature: AiFeature): FeatureRule {
  return FEATURE_RULES[feature]
}

export function getDailyAllowance(tier: SubscriptionTier): number {
  return DAILY_ALLOWANCE[tier]
}
