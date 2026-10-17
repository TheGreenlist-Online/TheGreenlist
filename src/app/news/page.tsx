import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { LimitationsPanel, Section } from '@/components/record'
import { NewsFeed, type NewsRow } from './news-feed'
import { PageIntro } from '@/components/PageIntro'

export const revalidate = 0

export const metadata = {
  title: 'News - The Green List',
  description: 'Industry, policy, enforcement, and recall coverage aggregated from named public outlets.',
}

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
        meta={
          <>
            <span>{count ?? 0} items on file</span>
            <span>Refreshed every two hours</span>
            <span>Linked to original publication</span>
          </>
        }
      />

      <Section title="Coverage" aside={<span>Newest first</span>}>
        <NewsFeed initialItems={items} initialTotal={count ?? 0} />
      </Section>

      <LimitationsPanel subject="news" />
    </PageShell>
  )
}
