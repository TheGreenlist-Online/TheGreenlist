import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { BookOpen, FlaskConical, Plus, Scale, ShieldCheck, Users } from 'lucide-react'

export const metadata = {
  title: 'Knowledge Library - The Green List',
  description: 'Cannabis education, policy context, consumer protection, and public-interest resources.',
}

type EducationListRow = {
  id: string
  category: string
  title: string
  summary: string
  created_at: string
}

const CATEGORY_META: Record<string, { label: string; icon: typeof ShieldCheck }> = {
  SAFETY_GUIDE: { label: 'Safety Guide', icon: ShieldCheck },
  REGULATORY_RESOURCE: { label: 'Regulatory Resource', icon: Scale },
  WORKER_RIGHTS: { label: 'Worker Rights', icon: Users },
  RESEARCH_SUMMARY: { label: 'Research Summary', icon: FlaskConical },
}

function CategoryBadge({ category }: { category: string }) {
  const meta = CATEGORY_META[category]
  const Icon = meta?.icon ?? BookOpen
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-950/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
      <Icon className="h-3.5 w-3.5" />
      {meta?.label ?? category.replace(/_/g, ' ')}
    </span>
  )
}

export default async function EducationPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('education_resources')
    .select('id, category, title, summary, created_at')
    .eq('status', 'APPROVED')
    .order('created_at', { ascending: false })

  if (category && Object.keys(CATEGORY_META).includes(category)) {
    query = query.eq('category', category)
  }

  const { data, error } = await query.returns<EducationListRow[]>()
  const resources = data ?? []

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Knowledge Library</p>
        <h1 className="greenlist-page-title">
          Cannabis education & accountability resources
        </h1>
        <p className="greenlist-page-lede">
          Resources are reviewed for accuracy, sourcing, safety, and compliance before publication. The
          library does not provide cannabis sales, ordering, delivery, or medical advice.
        </p>
        <div className="mt-6">
          <Link
            href="/education/new"
            className="greenlist-primary-button"
          >
            <Plus className="h-4 w-4" />
            Submit a Resource
          </Link>
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/education"
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              !category ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-200' : 'border-white/10 text-zinc-400 hover:border-emerald-300/35'
            }`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_META).map(([value, meta]) => (
            <Link
              key={value}
              href={`/education?category=${value}`}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                category === value ? 'border-emerald-300/60 bg-emerald-300/10 text-emerald-200' : 'border-white/10 text-zinc-400 hover:border-emerald-300/35'
              }`}
            >
              {meta.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6">
        {error ? (
          <OrnatePanel className="mt-5">
            <p role="alert" className="text-amber-200">Resources could not be loaded right now.</p>
          </OrnatePanel>
        ) : resources.length === 0 ? (
          <OrnatePanel className="mt-5">
            <div className="flex items-start gap-3">
              <BookOpen className="mt-1 h-6 w-6 text-emerald-300" />
              <div>
                <p className="text-zinc-200 font-semibold">No approved resources yet{category ? ' in this category' : ''}.</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Approved submissions will appear here once reviewers have published them.
                </p>
              </div>
            </div>
          </OrnatePanel>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => (
              <Link key={resource.id} href={`/education/${resource.id}`} className="block">
                <OrnatePanel className="h-full transition hover:-translate-y-0.5 hover:border-emerald-300/35" innerClassName="h-full flex flex-col">
                  <CategoryBadge category={resource.category} />
                  <h3 className="greenlist-card-title mt-4">{resource.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-zinc-400">{resource.summary}</p>
                  <p className="mt-4 text-xs text-zinc-500">
                    Published {new Date(resource.created_at).toLocaleDateString()}
                  </p>
                </OrnatePanel>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
