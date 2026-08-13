import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getSupabasePublishableKey, getSupabaseUrl } from '@/lib/supabase/env'

export const runtime = 'nodejs'

export async function GET() {
  const checks = {
    supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseKeyConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    databaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseReachable: false,
    databaseReachable: false,
    usersTableReachable: false,
  }

  // Supabase auth is primary system
  if (!checks.supabaseUrlConfigured || !checks.supabaseKeyConfigured) {
    return NextResponse.json(
      {
        ok: false,
        checks,
        message: 'Supabase Auth configuration missing. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel and redeploy.',
      },
      { status: 503 }
    )
  }

  // Check Supabase connection
  try {
    const response = await fetch(`${getSupabaseUrl()}/auth/v1/health`, {
      headers: { apikey: getSupabasePublishableKey() },
      cache: 'no-store',
    })
    checks.supabaseReachable = response.ok
  } catch (error) {
    console.warn('Supabase auth check warning (non-fatal):', error)
  }

  // Check database (Supabase Postgres) via the profiles table
  if (checks.databaseUrlConfigured) {
    try {
      const supabase = await createSupabaseServerClient()
      const { error } = await supabase.from('profiles').select('id').limit(1)
      if (!error) {
        checks.databaseReachable = true
        checks.usersTableReachable = true
      }
    } catch (error) {
      console.warn('Database check warning (non-fatal):', error)
    }
  }

  return NextResponse.json({
    ok: checks.supabaseReachable,
    checks,
    message: checks.supabaseReachable ? 'Supabase Auth is reachable.' : 'Unable to reach Supabase Auth.',
  })
}
