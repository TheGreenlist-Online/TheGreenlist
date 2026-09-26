import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewThreadForm } from './new-thread-form'

export const metadata = {
  title: 'Open a discussion',
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="mb-12 border-b border-[var(--gl-border)] pb-8">
          <p className="greenlist-eyebrow">Evidence Desk</p>
          <h1 className="greenlist-page-title max-w-4xl">Open a discussion</h1>
          <p className="greenlist-page-lede">
            Discussions are moderated and attached to a topic. Use them to request documentation, question a
            source, or flag a possible error in a record. Do not publish allegations about identifiable people;
            file a report instead so it can be reviewed against evidence.
          </p>
        </section>

        <NewThreadForm forums={forums ?? []} defaultForumSlug={forumSlug} />
      </main>
    </div>
  )
}
