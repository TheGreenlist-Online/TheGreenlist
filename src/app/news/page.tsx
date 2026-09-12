import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { TrustBadge } from '@/components/TrustBadge'
import { NewsFeed, type NewsRow } from './news-feed'
import { DistrictLabel } from '@/components/DistrictLabel'

export const revalidate = 0

export default async function NewsPage() {
  const supabase = await createSupabaseServerClient()

  const { data, count } = await supabase
    .from('news')
    .select('id, title, summary, source_name, source_url, category, tags, published_at', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(0, 19)

  const items = (data ?? []) as NewsRow[]

  return (
    <PageShell>
      <OrnatePanel className="district-page-intro">
        <DistrictLabel />
        <h1 className="mt-3 text-4xl font-semibold text-zinc-100 md:text-5xl">News</h1>
        <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
          Cannabis industry updates, policy shifts, consumer alerts, accountability stories, and
          transparency-focused reporting — refreshed automatically every two hours from trusted
          public sources.
        </p>
      </OrnatePanel>

      <section className="mt-8">
        <NewsFeed initialItems={items} initialTotal={count ?? 0} />
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to homepage
        </Link>
        <TrustBadge />
      </div>
    </PageShell>
  )
}
