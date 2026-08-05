import Link from 'next/link'
import { Lock, MessageSquare, ShieldAlert, Sparkles } from 'lucide-react'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getCurrentPrincipal } from '@/lib/supabase/authz'
import { isAdmin } from '@/lib/roles'

export const metadata = {
  title: 'Forums - The Green List',
  description: 'Community discussion spaces for cannabis transparency and accountability',
}

type ForumRow = {
  id: string
  slug: string
  name: string
  description: string | null
  category: string | null
  accent_color: string | null
  is_active: boolean
  is_sensitive: boolean
  requires_auth: boolean
  created_at: string
}

function formatCategory(category: string | null) {
  if (!category) return 'General'
  return category
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default async function ForumsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: forums, error } = await supabase
    .from('forums')
    .select('id, slug, name, description, category, accent_color, is_active, is_sensitive, requires_auth, created_at')
    .eq('is_active', true)
    .order('category', { ascending: true })
    .order('name', { ascending: true })
    .returns<ForumRow[]>()

  const { role, isPlatformOwner } = await getCurrentPrincipal()
  const viewerIsAdmin = isAdmin(role, isPlatformOwner)

  const grouped = new Map<string, ForumRow[]>()
  for (const forum of forums ?? []) {
    const key = formatCategory(forum.category)
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(forum)
  }

  return (
    <PageShell>
      <OrnatePanel className="district-page-intro">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">District services</p>
        <h1 className="mt-3 text-4xl font-semibold text-zinc-100 md:text-5xl">Forums</h1>
        <p className="mt-4 max-w-3xl leading-7 text-zinc-400">
          Community discussion spaces for cannabis transparency, consumer reports, industry accountability, and open
          public oversight.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/forums/new"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-300"
          >
            <Sparkles className="h-4 w-4" />
            Start a new thread
          </Link>
        </div>
      </OrnatePanel>

      {error ? (
        <OrnatePanel className="mt-8">
          <p className="text-sm text-red-300">Forums could not be loaded right now. Please try again shortly.</p>
        </OrnatePanel>
      ) : grouped.size === 0 ? (
        <OrnatePanel className="mt-8">
          <p className="text-lg font-semibold text-zinc-100">No forums yet</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Forums have not been created yet. Check back soon for community discussion spaces.
          </p>
          {viewerIsAdmin ? (
            <Link
              href="/admin/moderation"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300/30 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
            >
              Create the first forum
            </Link>
          ) : null}
        </OrnatePanel>
      ) : (
        <div className="mt-8 space-y-10">
          {Array.from(grouped.entries()).map(([category, categoryForums]) => (
            <section key={category}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">{category}</h2>
              <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {categoryForums.map((forum) => (
                  <Link key={forum.id} href={`/forums/${forum.slug}`} className="block">
                    <OrnatePanel className="h-full transition hover:-translate-y-0.5 hover:border-emerald-300/35">
                      <div className="flex items-center gap-3">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: forum.accent_color || '#34d399' }}
                        />
                        <h3 className="text-lg font-semibold text-zinc-100">{forum.name}</h3>
                      </div>
                      {forum.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{forum.description}</p>
                      ) : null}
                      <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          Discussion space
                        </span>
                        {forum.is_sensitive ? (
                          <span className="inline-flex items-center gap-1 text-amber-300">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            Sensitive
                          </span>
                        ) : null}
                        {forum.requires_auth ? (
                          <span className="inline-flex items-center gap-1">
                            <Lock className="h-3.5 w-3.5" />
                            Sign-in required
                          </span>
                        ) : null}
                      </div>
                    </OrnatePanel>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10">
        <Link href="/" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to homepage
        </Link>
      </div>
    </PageShell>
  )
}
