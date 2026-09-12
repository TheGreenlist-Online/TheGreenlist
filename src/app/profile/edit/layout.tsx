import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

/**
 * Server-side gate for the profile editor.
 *
 * The editor itself is a client component that resolved the session after
 * mount, so an anonymous visitor got a 200 and a "Loading profile…" shell
 * before being turned away. Every other protected route redirects on the
 * server; this makes /profile/edit behave the same way. No data was exposed
 * either way — the shell never contained profile data — but the flash of an
 * authenticated-looking page was wrong.
 */
export default async function ProfileEditLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/profile/edit')
  }

  return <>{children}</>
}
