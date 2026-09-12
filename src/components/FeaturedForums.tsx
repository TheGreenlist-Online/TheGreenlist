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
      <div className="flex items-center justify-between mb-8">
        <h2 className="greenlist-section-title">Featured Forums</h2>
        <Link href="/forums" className="text-sm font-medium text-accent hover:text-accent/80">
          View all forums →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forums.map((forum) => {
          const threadCount = countsById.get(forum.id) ?? 0
          return (
            <Link key={forum.id} href={`/forums/${forum.slug}`}>
              <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: forum.accent_color || '#34d399' }}
                  />
                  <h3 className="greenlist-card-title">{forum.name}</h3>
                </div>

                {forum.description ? (
                  <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{forum.description}</p>
                ) : null}

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>
                      {threadCount} {threadCount === 1 ? 'thread' : 'threads'}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
