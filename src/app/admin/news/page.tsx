import Link from 'next/link'
import { redirect } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { requireAdmin } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { NewsRefreshPanel } from './news-refresh-panel'
import { ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'News - Admin',
}

export const revalidate = 0

type AutomationJobRow = {
  id: string
  name: string
  status: string
  items_processed: number
  message: string | null
  started_at: string
  finished_at: string | null
}

const STATUS_STYLES: Record<string, string> = {
  running: 'border-sky-300/35 bg-sky-950/25 text-sky-200',
  success: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
  partial: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  error: 'border-red-400/35 bg-red-950/25 text-red-200',
}

export default async function AdminNewsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/news')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  let jobs: AutomationJobRow[] = []
  let loadError: string | null = null

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('automation_jobs')
      .select('id, name, status, items_processed, message, started_at, finished_at')
      .eq('name', 'refresh-news')
      .order('started_at', { ascending: false })
      .limit(10)

    if (error) throw error
    jobs = (data ?? []) as AutomationJobRow[]
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Failed to load job history.'
  }

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Admin command center</p>
        <h1 className="mt-3 text-4xl text-amber-100">News controls</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Manage the automated news feed. Articles are pulled from free public RSS feeds every two
          hours, summarized with OpenAI, and published to the /news page.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <RoleBadge role="ADMIN" />
          {loadError ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-red-300">
              <ShieldAlert className="h-4 w-4" /> {loadError}
            </span>
          ) : null}
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <NewsRefreshPanel />
      </section>

      <section className="mt-8">
        <div className="rounded-xl border border-white/[.09] bg-[#0d120f]">
          <div className="border-b border-white/10 p-4">
            <h2 className="text-lg font-semibold text-zinc-100">Recent refresh runs</h2>
          </div>
          {jobs.length === 0 ? (
            <p className="p-6 text-sm text-zinc-500">No refresh runs recorded yet.</p>
          ) : (
            <ul className="divide-y divide-white/[.06]">
              {jobs.map((job) => (
                <li key={job.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em] ${STATUS_STYLES[job.status] ?? 'border-zinc-400/35 bg-zinc-800/35 text-zinc-300'}`}
                      >
                        {job.status}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(job.started_at), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-300">{job.message ?? 'No message recorded.'}</p>
                  </div>
                  <span className="text-xs text-zinc-500">{job.items_processed} item(s)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-8 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
