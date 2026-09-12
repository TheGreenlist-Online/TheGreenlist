import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Server-side auth gate for every /settings route.
 *
 * Settings shows and writes account data, so the session is resolved on the
 * server before anything renders. Gating in a client effect (as the old
 * /dashboard/settings did) returns a 200 and paints an authenticated-looking
 * shell to anonymous visitors before bouncing them.
 */
export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/settings')
  }

  return <>{children}</>
}
