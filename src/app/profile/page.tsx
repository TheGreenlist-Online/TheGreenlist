import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Calendar, Pencil, User as UserIcon } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { TrustBadge } from '@/components/TrustBadge'
import { ScoreMeter } from '@/components/ScoreMeter'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePlatformRole } from '@/lib/roles'

export const metadata = {
  title: 'My Profile - The Green List',
}

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  role: string | null
  verification_status: string | null
  trust_score: number | null
  transparency_score: number | null
  is_public: boolean | null
  created_at: string
}

function formatMemberSince(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  } catch {
    return null
  }
}

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/profile')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, display_name, bio, avatar_url, role, verification_status, trust_score, transparency_score, is_public, created_at')
    .eq('id', user.id)
    .maybeSingle<ProfileRow>()

  if (!profile) {
    return (
      <PageShell>
        <OrnatePanel className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Profile</p>
          <h1 className="mt-3 text-3xl font-semibold text-zinc-100">Let&apos;s set up your profile</h1>
          <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-400">
            We couldn&apos;t find a profile for your account yet. Complete your profile to choose a username,
            add a bio, and control what other members can see.
          </p>
          <Link
            href="/profile/edit"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-5 py-2.5 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
          >
            <Pencil className="h-4 w-4" />
            Complete your profile
          </Link>
        </OrnatePanel>
      </PageShell>
    )
  }

  const role = normalizePlatformRole(profile.role)
  const memberSince = formatMemberSince(profile.created_at)

  return (
    <PageShell>
      <OrnatePanel>
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-emerald-300/25 bg-[#121a15]">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.display_name ?? profile.username ?? 'Profile avatar'} className="h-full w-full object-cover" />
              ) : (
                <UserIcon className="h-9 w-9 text-emerald-300/60" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">My Profile</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-100 md:text-4xl">
                {profile.display_name || profile.username || 'Unnamed member'}
              </h1>
              {profile.username ? <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p> : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={role} />
                <TrustBadge status={profile.verification_status ?? 'unverified'} />
                {profile.is_public === false ? (
                  <span className="inline-flex items-center rounded-full border border-zinc-500/30 bg-zinc-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    Private profile
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <Link
            href="/profile/edit"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300/35 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-emerald-300 hover:text-emerald-200"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>

        {profile.bio ? (
          <p className="mt-6 max-w-3xl whitespace-pre-wrap leading-7 text-zinc-400">{profile.bio}</p>
        ) : (
          <p className="mt-6 text-sm text-zinc-500">No bio yet. Add one from Edit Profile.</p>
        )}

        {memberSince ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
            <Calendar className="h-4 w-4" />
            Member since {memberSince}
          </p>
        ) : null}
      </OrnatePanel>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <OrnatePanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Trust score</p>
          <div className="mt-4">
            <ScoreMeter label="Trust" score={profile.trust_score} />
          </div>
        </OrnatePanel>
        <OrnatePanel>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Transparency score</p>
          <div className="mt-4">
            <ScoreMeter label="Transparency" score={profile.transparency_score} />
          </div>
        </OrnatePanel>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <Link href="/dashboard" className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Back to dashboard
        </Link>
        {profile.username ? (
          <Link href={`/profile/${profile.username}`} className="text-sm font-semibold text-emerald-300 hover:underline">
            View public profile →
          </Link>
        ) : null}
      </div>
    </PageShell>
  )
}
