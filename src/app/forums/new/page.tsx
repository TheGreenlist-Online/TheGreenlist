import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewThreadForm } from './new-thread-form'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel } from '@/components/record'
import Link from 'next/link'

export const metadata = {
  title: 'Open a discussion - The Green List',
  description: 'Open a discussion on the Evidence Desk',
}

type ForumOption = {
  id: string
  slug: string
  name: string
  category: string | null
}

export default async function ForumsNewPage({
  searchParams,
}: {
  searchParams: Promise<{ forum?: string }>
}) {
  const { forum: forumSlug } = await searchParams
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/signin?callbackUrl=/forums/new${forumSlug ? `?forum=${forumSlug}` : ''}`)
  }

  const { data: forums } = await supabase
    .from('forums')
    .select('id, slug, name, category')
    .eq('is_active', true)
    .order('name', { ascending: true })
    .returns<ForumOption[]>()

  return (
    <PageShell>
      <PageIntro
        eyebrow="Evidence Desk"
        title="Open a discussion"
        lede="Discussions are moderated and attached to a desk. Use them to request documentation, question a source, or flag a possible error in a record. Do not publish allegations about identifiable people; file a report instead so it can be reviewed against evidence."
        meta={
          <>
            <span>Moderated</span>
            <span>Public once posted</span>
          </>
        }
        actions={
          <Link href="/forums" className="greenlist-quiet-button">
            All desks
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">
        <NewThreadForm forums={forums ?? []} defaultForumSlug={forumSlug} />
        <Ledger
          title="Desk rules"
          className="content-start"
          rows={[
            { label: 'Documents, not people', value: 'Ask for records and cite sources. Allegations about identifiable people belong in a report.' },
            { label: 'No status change', value: 'Discussion never changes a record’s status. Documentary review does.' },
            { label: 'Held posts', value: 'Unsourced claims about a named business may be held until a reviewer has looked at them.' },
            { label: 'Corrections', value: 'If you believe a record is wrong, use the correction path so it is logged and answered.' },
          ]}
        />
      </div>

      <LimitationsPanel subject="discussion" className="mt-8" />
    </PageShell>
  )
}
