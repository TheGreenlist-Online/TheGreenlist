import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Onboarding state for the signed-in user.
 *
 * Three declarations make an account "set up": how the person takes part,
 * that they are of legal age, and that they have read the standards. The
 * server stamps completion once all three exist (see complete_onboarding()).
 *
 * The columns arrive with migration 20261003200000. Until it is applied on a
 * given database the read fails with 42703 (undefined column); that is
 * reported as `available: false` so the dashboard can hide the checklist
 * rather than break.
 */

export type Participation = 'consumer' | 'professional' | 'business'

export type OnboardingState = {
  available: boolean
  participation: Participation | null
  ageAttested: boolean
  standardsAcknowledged: boolean
  hasUsername: boolean
  completed: boolean
  /** Steps still open, in the order the flow presents them. */
  remaining: OnboardingStep[]
}

export type OnboardingStep = 'participation' | 'standards' | 'identity'

export const PARTICIPATION_OPTIONS: Array<{
  value: Participation
  title: string
  body: string
  afterwards: string
}> = [
  {
    value: 'consumer',
    title: 'Consumer or patient',
    body: 'You use cannabis products or care for someone who does. You want to read the record, ask questions, and report what you see.',
    afterwards: 'You can read everything, open two discussions a month, and reply without limit.',
  },
  {
    value: 'professional',
    title: 'Industry professional',
    body: 'You work in cultivation, processing, testing, distribution, or retail. You want to answer questions under your real line of work.',
    afterwards: 'Your line of work is shown as declared until a reviewer verifies it. Nothing you post is treated as a finding.',
  },
  {
    value: 'business',
    title: 'Business representative',
    body: 'You are authorised to speak for a licensed business and want to manage its public record and respond to findings about it.',
    afterwards: 'Next you will be asked to claim the record. A reviewer confirms you represent the business before anything is labelled verified.',
  },
]

type OnboardingRow = {
  username: string | null
  participation: Participation | null
  age_attested_at: string | null
  standards_acknowledged_at: string | null
  onboarding_completed_at: string | null
}

export async function getOnboardingState(supabase: SupabaseClient, userId: string): Promise<OnboardingState> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, participation, age_attested_at, standards_acknowledged_at, onboarding_completed_at')
    .eq('id', userId)
    .maybeSingle<OnboardingRow>()

  if (error) {
    // 42703 = undefined_column: migration not applied here yet.
    if (error.code !== '42703') console.error('[onboarding] read failed:', error.message)
    return {
      available: false,
      participation: null,
      ageAttested: false,
      standardsAcknowledged: false,
      hasUsername: false,
      completed: false,
      remaining: [],
    }
  }

  const participation = data?.participation ?? null
  const ageAttested = Boolean(data?.age_attested_at)
  const standardsAcknowledged = Boolean(data?.standards_acknowledged_at)
  const hasUsername = Boolean(data?.username?.trim())
  const completed = Boolean(data?.onboarding_completed_at)

  const remaining: OnboardingStep[] = []
  if (!participation) remaining.push('participation')
  if (!ageAttested || !standardsAcknowledged) remaining.push('standards')
  if (!hasUsername) remaining.push('identity')

  return { available: true, participation, ageAttested, standardsAcknowledged, hasUsername, completed, remaining }
}

/** Where a finished onboarding sends people, by what they said they are. */
export function onboardingDestination(participation: Participation | null): string {
  if (participation === 'business') return '/businesses/claim?from=onboarding'
  return '/dashboard'
}
