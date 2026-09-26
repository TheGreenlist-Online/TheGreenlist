import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { TrustBadge } from '@/components/TrustBadge'
import { NewsFeed, type NewsRow } from './news-feed'
import { PageIntro } from '@/components/PageIntro'

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
      <PageIntro
        title="News"
        lede="Industry, policy, enforcement, and recall coverage aggregated from named public outlets and linked to the original publication. Items refresh automatically every two hours. Aggregated coverage is not a Green List finding."
      />

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
