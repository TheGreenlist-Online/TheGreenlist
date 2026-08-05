import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Calendar, User as UserIcon } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { TrustBadge } from '@/components/TrustBadge'
import { ScoreMeter } from '@/components/ScoreMeter'
import { normalizePlatformRole } from '@/lib/roles'

type PublicProfile = {
  id?: string
  username: string | null
  display_name?: string | null
  bio?: string | null
  avatar_url: string | null
  role?: string | null
  verification_status?: string | null
  trust_score?: number | null
  transparency_score?: number | null
  is_public?: boolean | null
  created_at?: string
}

function formatMemberSince(dateString?: string) {
  if (!dateString) return null
  try {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  } catch {
    return null
  }
}

async function getBaseUrl() {
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = process.env.NODE_ENV === 'development' || host?.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

async function fetchProfile(username: string): Promise<{ profile: PublicProfile | null; status: number }> {
  try {
    const baseUrl = await getBaseUrl()
    const cookieHeader = (await headers()).get('cookie') ?? ''

    const response = await fetch(`${baseUrl}/api/profiles/${encodeURIComponent(username)}`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    })

    if (response.status === 404) {
      return { profile: null, status: 404 }
    }

    if (!response.ok) {
      return { profile: null, status: response.status }
    }

    const data = await response.json()
    return { profile: data, status: 200 }
  } catch (error) {
    console.error('Error fetching public profile:', error)
    return { profile: null, status: 500 }
  }
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  return { title: `@${username} - The Green List` }
}

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  const { profile, status } = await fetchProfile(username)

  if (status === 404 || !profile) {
    notFound()
  }

  const isMinimal = profile.is_public === false && !profile.role

  return (
    <PageShell>
      <OrnatePanel>
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
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Member profile</p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-100 md:text-4xl">
              {profile.display_name || profile.username || 'Member'}
            </h1>
            {profile.username ? <p className="mt-1 text-sm text-zinc-500">@{profile.username}</p> : null}

            {!isMinimal ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.role ? <RoleBadge role={normalizePlatformRole(profile.role)} /> : null}
                <TrustBadge status={profile.verification_status ?? 'unverified'} />
              </div>
            ) : null}
          </div>
        </div>

        {isMinimal ? (
          <p className="mt-6 rounded-lg border border-zinc-500/20 bg-zinc-500/[.04] p-4 text-sm text-zinc-400">
            This member has a private profile. Only their username and avatar are shown.
          </p>
        ) : (
          <>
            {profile.bio ? (
              <p className="mt-6 max-w-3xl whitespace-pre-wrap leading-7 text-zinc-400">{profile.bio}</p>
            ) : null}
            {formatMemberSince(profile.created_at) ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500">
                <Calendar className="h-4 w-4" />
                Member since {formatMemberSince(profile.created_at)}
              </p>
            ) : null}
          </>
        )}
      </OrnatePanel>

      {!isMinimal ? (
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
      ) : null}

      <div className="mt-10">
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">
          ← Back to homepage
        </Link>
      </div>
    </PageShell>
  )
}
