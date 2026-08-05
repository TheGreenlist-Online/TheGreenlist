import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type PatchBody = {
  display_name?: string | null
  bio?: string | null
  avatar_url?: string | null
  is_public?: boolean
}

const MAX_DISPLAY_NAME_LEN = 80
const MAX_BIO_LEN = 1000
const MAX_URL_LEN = 2048

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as PatchBody
    const update: Record<string, unknown> = {}

    if ('display_name' in body) {
      const value = typeof body.display_name === 'string' ? body.display_name.trim() : null
      if (value && value.length > MAX_DISPLAY_NAME_LEN) {
        return NextResponse.json({ error: `display_name must be ${MAX_DISPLAY_NAME_LEN} characters or fewer` }, { status: 400 })
      }
      update.display_name = value || null
    }

    if ('bio' in body) {
      const value = typeof body.bio === 'string' ? body.bio.trim() : null
      if (value && value.length > MAX_BIO_LEN) {
        return NextResponse.json({ error: `bio must be ${MAX_BIO_LEN} characters or fewer` }, { status: 400 })
      }
      update.bio = value || null
    }

    if ('avatar_url' in body) {
      const value = typeof body.avatar_url === 'string' ? body.avatar_url.trim() : null
      if (value) {
        if (value.length > MAX_URL_LEN) {
          return NextResponse.json({ error: 'avatar_url is too long' }, { status: 400 })
        }
        try {
          const parsed = new URL(value)
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('invalid protocol')
          }
        } catch {
          return NextResponse.json({ error: 'avatar_url must be a valid http(s) URL' }, { status: 400 })
        }
      }
      update.avatar_url = value || null
    }

    if ('is_public' in body) {
      if (typeof body.is_public !== 'boolean') {
        return NextResponse.json({ error: 'is_public must be a boolean' }, { status: 400 })
      }
      update.is_public = body.is_public
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No valid fields provided' }, { status: 400 })
    }

    update.updated_at = new Date().toISOString()

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', user.id)
      .select(
        'id, username, display_name, bio, avatar_url, role, verification_status, trust_score, transparency_score, is_anonymous_allowed, is_public, created_at, updated_at',
      )
      .single()

    if (error) throw error

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
