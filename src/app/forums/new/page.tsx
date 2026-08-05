import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { NewThreadForm } from './new-thread-form'

export const metadata = {
  title: 'Create Forum Thread - The Green List',
  description: 'Start a discussion in The Green List forums',
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
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Create Forum Thread</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">Join the Community Conversation</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Participate in moderated discussions about cannabis transparency, consumer safety, industry
              accountability, and community trust.
            </p>
          </div>
        </section>

        <NewThreadForm forums={forums ?? []} defaultForumSlug={forumSlug} />
      </main>
    </div>
  )
}
