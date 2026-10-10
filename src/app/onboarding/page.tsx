import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Notice } from '@/components/record'
import { getOnboardingState, onboardingDestination } from '@/lib/onboarding'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export const metadata: Metadata = {
  title: 'Set up your account - The Green List',
  description: 'Three short steps: how you take part, the standards you agree to, and your name on the record.',
}

/**
 * First screen after sign-up. Three declarations, no marketing, no plan picker.
 *
 * The page decides what is left to do from the profile row, so someone who
 * leaves halfway resumes where they stopped, and someone who is finished is
 * sent straight to their destination.
 */
export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/signin?callbackUrl=/onboarding')

  const [state, { data: profile }] = await Promise.all([
    getOnboardingState(supabase, user.id),
    supabase.from('profiles').select('username, display_name').eq('id', user.id).maybeSingle<{ username: string | null; display_name: string | null }>(),
  ])

  if (state.available && state.completed && state.remaining.length === 0) {
    redirect(onboardingDestination(state.participation))
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Account"
        title="Set up your account"
        lede="Three short steps. Nothing here is a purchase, and nothing you answer changes how your reports are reviewed."
        meta={user.email ? <span>{user.email}</span> : undefined}
      />

      {!state.available ? (
        <Notice tone="review" className="mt-6" role="status">
          Account setup is not available on this database yet. You can continue to{' '}
          <a href="/dashboard" className="gl-link">
            your desk
          </a>
          .
        </Notice>
      ) : (
        <OnboardingFlow
          initial={{
            participation: state.participation,
            ageAttested: state.ageAttested,
            standardsAcknowledged: state.standardsAcknowledged,
            username: profile?.username ?? '',
            displayName: profile?.display_name ?? '',
          }}
        />
      )}
    </PageShell>
  )
}
