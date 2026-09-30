import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type ForumRow = {
  id: string
  slug: string
  name: string
  description: string | null
  accent_color: string | null
}

const MAX_FEATURED = 6

export async function FeaturedForums() {
  const supabase = await createSupabaseServerClient()
  const { data: forums } = await supabase
    .from('forums')
    .select('id, slug, name, description, accent_color')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(MAX_FEATURED)
    .returns<ForumRow[]>()

  if (!forums || forums.length === 0) {
    return null
  }

  const threadCounts = await Promise.all(
    forums.map(async (forum) => {
      const { count } = await supabase
        .from('forum_threads')
        .select('id', { count: 'exact', head: true })
        .eq('forum_id', forum.id)
        .eq('status', 'published')
      return [forum.id, count ?? 0] as const
    })
  )
  const countsById = new Map(threadCounts)

  return (
    <section className="py-12">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          Featured Forums
        </h2>
        <Link href="/forums" className="text-sm font-semibold text-accent transition-colors hover:text-accent/80">
          View all forums →
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {forums.map((forum) => {
          const threadCount = countsById.get(forum.id) ?? 0
          const accent = forum.accent_color || '#39ff88'

          return (
            <Link key={forum.id} href={`/forums/${forum.slug}`} className="block h-full">
              <div className="glass-card group h-full rounded-lg p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }} />
                  <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-accent">
                    {forum.name}
                  </h3>
                </div>

                {forum.description ? (
                  <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{forum.description}</p>
                ) : null}

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>
                      {threadCount} {threadCount === 1 ? 'thread' : 'threads'}
                    </span>
                  </div>
                  <span className="font-semibold text-accent">Active</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
