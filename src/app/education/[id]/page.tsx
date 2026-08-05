import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { ArrowLeft, BookOpen, FlaskConical, Scale, ShieldCheck, Users } from 'lucide-react'

type EducationDetailRow = {
  id: string
  category: string
  title: string
  summary: string
  content: string
  source_urls: string[] | null
  status: string
  created_at: string
}

const CATEGORY_META: Record<string, { label: string; icon: typeof ShieldCheck }> = {
  SAFETY_GUIDE: { label: 'Safety Guide', icon: ShieldCheck },
  REGULATORY_RESOURCE: { label: 'Regulatory Resource', icon: Scale },
  WORKER_RIGHTS: { label: 'Worker Rights', icon: Users },
  RESEARCH_SUMMARY: { label: 'Research Summary', icon: FlaskConical },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const { data: resource } = await supabase
    .from('education_resources')
    .select('title')
    .eq('id', id)
    .eq('status', 'APPROVED')
    .maybeSingle<{ title: string }>()

  return {
    title: resource ? `${resource.title} - The Green List` : 'Resource - The Green List',
  }
}

export default async function EducationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: resource, error } = await supabase
    .from('education_resources')
    .select('id, category, title, summary, content, source_urls, status, created_at')
    .eq('id', id)
    .maybeSingle<EducationDetailRow>()

  // 404 for anything not APPROVED so pending/draft/rejected content is never leaked.
  if (error || !resource || resource.status !== 'APPROVED') {
    notFound()
  }

  const meta = CATEGORY_META[resource.category]
  const Icon = meta?.icon ?? BookOpen
  const paragraphs = resource.content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  const sourceUrls = (resource.source_urls ?? []).filter(Boolean)

  return (
    <PageShell>
      <Link href="/education" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Knowledge Library
      </Link>

      <OrnatePanel className="mt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/35 bg-emerald-950/25 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
          <Icon className="h-3.5 w-3.5" />
          {meta?.label ?? resource.category.replace(/_/g, ' ')}
        </span>

        <h1 className="mt-4 text-3xl font-semibold text-zinc-100 md:text-4xl">{resource.title}</h1>
        <p className="mt-2 text-xs text-zinc-500">
          Published {new Date(resource.created_at).toLocaleDateString()}
        </p>

        <p className="mt-5 text-lg leading-8 text-zinc-300">{resource.summary}</p>

        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="leading-7 text-zinc-300 whitespace-pre-wrap">
              {paragraph}
            </p>
          ))}
        </div>

        {sourceUrls.length > 0 ? (
          <div className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Sources</h2>
            <ul className="mt-3 space-y-2">
              {sourceUrls.map((url) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="break-all text-sm text-emerald-300 hover:underline"
                  >
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </OrnatePanel>
    </PageShell>
  )
}
