import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { ProfileRecord } from '@/components/ProfileRecord'
import { type VerifiedFact } from '@/components/VerifiedWall'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

async function getBaseUrl() {
  const headerList = await headers()
  const host = headerList.get('host')
  const protocol = process.env.NODE_ENV === 'development' || host?.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

async function fetchVerifiedFacts(subjectUserId: string): Promise<VerifiedFact[]> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data } = await supabase
      .from('verified_facts')
      .select('id, fact_text, category, source_url, verified_at')
      .eq('subject_user_id', subjectUserId)
      .order('verified_at', { ascending: false })
      .returns<VerifiedFact[]>()
    return data ?? []
  } catch (error) {
    console.error('Error fetching verified facts for profile:', error)
    return []
  }
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
  const verifiedFacts = !isMinimal && profile.id ? await fetchVerifiedFacts(profile.id) : []

  return (
    <PageShell width="record">
      <ProfileRecord profile={profile} role={profile.role ? normalizePlatformRole(profile.role) : null} facts={verifiedFacts} isMinimal={isMinimal} />
    </PageShell>
  )
}
