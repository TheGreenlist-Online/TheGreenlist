import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { VerifiedFactsAdmin } from './verified-facts-admin'

export const metadata = {
  title: 'Verified Facts - Admin',
}

export const revalidate = 0

export default async function AdminVerifiedFactsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/verified-facts')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data, error } = await principal.supabase
    .from('verified_facts')
    .select('*')
    .order('verified_at', { ascending: false })
    .limit(100)

  const facts = data ?? []

  return (
    <PageShell>
      <OrnatePanel>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Admin command center</p>
        <h1 className="mt-3 text-4xl text-amber-100">Verified Wall</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Add or remove moderator-verified facts shown on user profiles and business pages. This is
          moderator-curated content only — users and businesses cannot self-add entries.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <RoleBadge role="ADMIN" />
          {error ? <span className="text-sm text-red-300">Failed to load facts: {error.message}</span> : null}
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <VerifiedFactsAdmin initialFacts={facts} />
      </section>

      <section className="mt-8 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
