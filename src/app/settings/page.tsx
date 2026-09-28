import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { RoleBadge } from '@/components/RoleBadge'
import { Ledger, Notice, StatusLabel } from '@/components/record'
import { normalizePlatformRole } from '@/lib/roles'
import { toneClass, type StatusTone } from '@/lib/statusTones'
import { ProfileSettingsForm, type EditableProfile } from '@/components/settings/ProfileSettingsForm'
import { AppearanceSettings } from '@/components/settings/AppearanceSettings'
import { SecuritySettings } from '@/components/settings/SecuritySettings'
import { DataSettings } from '@/components/settings/DataSettings'
import { SettingsNav } from '@/components/settings/SettingsNav'

export const metadata: Metadata = {
  title: 'Account settings - The Green List',
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
        eyebrow="Account"
        title="Account settings"
        lede="Identity, privacy, security, and data. Changes apply when you save them."
        meta={
          <>
            {user.email ? <span>{user.email}</span> : null}
            {memberSince ? <span>Account opened {memberSince}</span> : null}
          </>
        }
        actions={
          <>
            <RoleBadge role={role} />
            <span className={toneClass(ACCOUNT_STATUS_TONES[accountStatus])}>{formatLabel(accountStatus, 'active')}</span>
          </>
        }
      >
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard" className="greenlist-quiet-button">
            Your desk
          </Link>
          {profile?.username ? (
            <Link href={`/profile/${profile.username}`} className="greenlist-quiet-button">
              Public profile
            </Link>
          ) : null}
        </div>
      </PageIntro>

      {accountStatus !== 'active' ? (
        <Notice tone="review" className="mt-6" title={`Your account is ${formatLabel(accountStatus, 'restricted')}.`}>
          {profile?.status_reason ?? 'Some actions are limited while this is in place. Contact support if you believe this is a mistake.'}
        </Notice>
      ) : null}

      <div className="mt-8 gap-8 lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:items-start">
        <SettingsNav />

        <div className="min-w-0 grid gap-6">
          <ProfileSettingsForm initial={initial} />

          <AppearanceSettings />

          <SecuritySettings email={user.email ?? ''} />

          <div id="standing" className="scroll-mt-28">
            <Ledger
              title="Account standing"
              aside="Set by administrators; not editable here"
              rows={[
                { label: 'Role', value: <RoleBadge role={role} />, note: 'Platform permissions. Assigned by administrators.' },
                { label: 'Identity check', value: <StatusLabel value={verification} fallback={{ label: 'Not verified', tone: 'neutral' }} /> },
                { label: 'Account status', value: <span className={toneClass(ACCOUNT_STATUS_TONES[accountStatus])}>{formatLabel(accountStatus, 'active')}</span> },
                { label: 'Account opened', value: memberSince ?? 'Not stated' },
              ]}
            />
          </div>

          <DataSettings hasOpenRequest={Boolean(openClosureRequest)} />
        </div>
      </div>
    </PageShell>
  )
}
