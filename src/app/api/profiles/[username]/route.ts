import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { normalizePlatformRole, hasPermission } from '@/lib/roles'

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
  is_anonymous_allowed: boolean | null
  is_public: boolean | null
  created_at: string
  updated_at: string | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params

    if (!username || typeof username !== 'string') {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()

    const { data: profile, error } = await supabase
      .from('profiles')
      .select(
        'id, username, display_name, bio, avatar_url, role, verification_status, trust_score, transparency_score, is_anonymous_allowed, is_public, created_at, updated_at',
      )
      .eq('username', username)
      .maybeSingle<ProfileRow>()

    if (error) throw error

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    const {
      data: { user: requester },
    } = await supabase.auth.getUser()

    let isOwner = false
    let isAdmin = false

    if (requester) {
      isOwner = requester.id === profile.id

      if (!isOwner) {
        const { data: requesterProfile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', requester.id)
          .maybeSingle<{ role: string | null }>()

        const role = normalizePlatformRole(requesterProfile?.role)
        const isPlatformOwner = requester.app_metadata?.platform_owner === true
        isAdmin = hasPermission(role, 'platform:admin', isPlatformOwner)
      }
    }

    if (profile.is_public === false && !isOwner && !isAdmin) {
      return NextResponse.json({
        username: profile.username,
        avatar_url: profile.avatar_url,
        is_public: false,
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}
