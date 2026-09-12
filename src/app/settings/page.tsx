import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { ScoreMeter } from '@/components/ScoreMeter'
import { normalizePlatformRole } from '@/lib/roles'
import { statusBadgeBase, toneClass, type StatusTone } from '@/lib/statusTones'
import { ProfileSettingsForm, type EditableProfile } from '@/components/settings/ProfileSettingsForm'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { DataSettings } from '@/components/settings/DataSettings'
import { SettingsNav } from '@/components/settings/SettingsNav'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your profile, privacy, appearance, security and account data.',
}

type SettingsProfile = {
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  role: string | null
  verification_status: string | null
  account_status: string | null
  status_reason: string | null
  trust_score: number | null
  transparency_score: number | null
  is_public: boolean | null
  is_anonymous_allowed: boolean | null
  created_at: string | null
}

const VERIFICATION_TONES: Record<string, StatusTone> = {
  verified: 'success',
  pending: 'pending',
  in_review: 'progress',
  unverified: 'neutral',
  rejected: 'danger',
}

const ACCOUNT_STATUS_TONES: Record<string, StatusTone> = {
  active: 'success',
  warned: 'pending',
  silenced: 'danger',
  restricted: 'danger',
  suspended: 'critical',
  banned: 'critical',
}

function formatLabel(value: string | null | undefined, fallback: string) {
  if (!value) return fallback
  return value.replace(/_/g, ' ')
}

function formatDate(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function SettingsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // The layout already gates this route; this satisfies the type narrowing and
  // covers the case where the session expires between the two reads.
  if (!user) {
    redirect('/auth/signin?callbackUrl=/settings')
  }

  const [{ data: profile }, { data: openClosureRequest }] = await Promise.all([
    supabase
      .from('profiles')
      .select(
        'username, display_name, bio, avatar_url, role, verification_status, account_status, status_reason, trust_score, transparency_score, is_public, is_anonymous_allowed, created_at',
      )
      .eq('id', user.id)
      .maybeSingle<SettingsProfile>(),
    supabase
      .from('support_tickets')
      .select('id')
      .eq('profile_id', user.id)
      .eq('ticket_type', 'ACCOUNT_DELETION')
      .eq('status', 'open')
      .maybeSingle(),
  ])

  const role = normalizePlatformRole(profile?.role)
  const accountStatus = profile?.account_status ?? 'active'
  const verification = profile?.verification_status ?? 'unverified'
  const memberSince = formatDate(profile?.created_at ?? user.created_at ?? null)

  const initial: EditableProfile = {
    username: profile?.username ?? '',
    display_name: profile?.display_name ?? '',
    bio: profile?.bio ?? '',
    avatar_url: profile?.avatar_url ?? '',
    is_public: profile?.is_public ?? true,
    is_anonymous_allowed: profile?.is_anonymous_allowed ?? true,
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Settings"
        title="Account settings"
        lede="Your identity, privacy, security and data — all in one place. Changes apply the moment you save them."
        actions={
          <>
            <RoleBadge role={role} />
            <span className={`${statusBadgeBase} ${toneClass(ACCOUNT_STATUS_TONES[accountStatus])}`}>
              {formatLabel(accountStatus, 'active')}
            </span>
            {user.email ? <span className="text-sm text-zinc-400">{user.email}</span> : null}
          </>
        }
      >
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/dashboard" className="greenlist-quiet-button">
            Back to dashboard
          </Link>
          {profile?.username ? (
            <Link href={`/profile/${profile.username}`} className="greenlist-quiet-button">
              View public profile
            </Link>
          ) : null}
        </div>
      </PageIntro>

      {accountStatus !== 'active' ? (
        <div className="mt-6 rounded-xl border border-amber-300/35 bg-amber-950/25 p-5">
          <p className="text-sm font-semibold text-amber-100">
            Your account is {formatLabel(accountStatus, 'restricted')}.
          </p>
          <p className="mt-1.5 text-sm leading-6 text-amber-200/80">
            {profile?.status_reason ??
              'Some actions are limited while this is in place. Contact support if you believe this is a mistake.'}
          </p>
        </div>
      ) : null}

      <div className="mt-8 gap-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
        <SettingsNav />

        <div className="min-w-0 space-y-6">
          <ProfileSettingsForm initial={initial} />

          <AppearanceSettings />

          <SecuritySettings email={user.email ?? ''} />

          <section id="standing" className="scroll-mt-28">
            <OrnatePanel>
              <h2 className="greenlist-section-title">Account standing</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                Set by moderators and by your contribution history. These can&apos;t be edited here — they&apos;re the
                record other members rely on.
              </p>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-white/[.07] bg-white/[.02] p-4">
                  <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">Role</dt>
                  <dd className="mt-2">
                    <RoleBadge role={role} />
                  </dd>
                </div>

                <div className="rounded-lg border border-white/[.07] bg-white/[.02] p-4">
                  <dt className="text-xs uppercase tracking-[0.14em] text-zinc-500">Verification</dt>
                  <dd className="mt-2">
                    <span className={`${statusBadgeBase} ${toneClass(VERIFICATION_TONES[verification])}`}>
                      {formatLabel(verification, 'unverified')}
                    </span>
                  </dd>
                </div>

                <div className="rounded-lg border border-white/[.07] bg-white/[.02] p-4">
                  <dt className="sr-only">Trust score</dt>
                  <dd>
                    <ScoreMeter label="Trust score" score={Number(profile?.trust_score ?? 0)} />
                  </dd>
                </div>

                <div className="rounded-lg border border-white/[.07] bg-white/[.02] p-4">
                  <dt className="sr-only">Transparency score</dt>
                  <dd>
                    <ScoreMeter label="Transparency" score={Number(profile?.transparency_score ?? 0)} />
                  </dd>
                </div>
              </dl>

              {memberSince ? <p className="mt-5 text-xs text-zinc-500">Member since {memberSince}.</p> : null}
            </OrnatePanel>
          </section>

          <DataSettings hasOpenRequest={Boolean(openClosureRequest)} />
        </div>
      </div>
    </PageShell>
  )
}
