import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { ProfileRecord } from '@/components/ProfileRecord'
import { Panel } from '@/components/record'
import { type VerifiedFact } from '@/components/VerifiedWall'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePlatformRole } from '@/lib/roles'

export const metadata = {
  title: 'Your account record - The Green List',
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
      <PageShell width="record">
        <PageIntro eyebrow="Account" title="Set up your account record" lede="No profile exists for this account yet. Choose a username, add a statement, and set what is shown publicly." />
        <Panel className="mt-8">
          <Link href="/profile/edit" className="greenlist-primary-button">
            Complete your profile
          </Link>
        </Panel>
      </PageShell>
    )
  }

  const role = normalizePlatformRole(profile.role)

  const { data: verifiedFactsData } = await supabase
    .from('verified_facts')
    .select('id, fact_text, category, source_url, verified_at')
    .eq('subject_user_id', profile.id)
    .order('verified_at', { ascending: false })
    .returns<VerifiedFact[]>()

  return (
    <PageShell width="record">
      <ProfileRecord
        profile={profile}
        role={role}
        facts={verifiedFactsData ?? []}
        isOwner
        actions={
          <Link href="/profile/edit" className="greenlist-secondary-button">
            Edit profile
          </Link>
        }
      />
    </PageShell>
  )
}
