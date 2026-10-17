import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import { DataTable, Panel, Section, StatusLabel } from '@/components/record'
import { formatDate, humanize } from '@/lib/recordStatus'
import { NewsRefreshPanel } from './news-refresh-panel'

export const metadata = {
  title: 'News feed - Review operations - The Green List',
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
    <AdminPageFrame
      title="News feed"
      lede="The aggregation job pulls items from public RSS feeds every two hours, summarises them, and publishes them to News with a link to the original outlet. Aggregated items are not Green List findings."
      current="/admin/news"
      error={loadError}
      meta={<span>{jobs.length} recent runs</span>}
    >
      <NewsRefreshPanel />

      <Section title="Recent refresh runs" aside={<span>Most recent first</span>}>
        {jobs.length === 0 ? (
          <Panel>
            <p className="text-sm text-[var(--gl-text-muted)]">No refresh runs recorded.</p>
          </Panel>
        ) : (
          <DataTable
            caption="Recent news refresh runs"
            rows={jobs}
            rowKey={(job) => job.id}
            columns={[
              { key: 'status', header: 'Status', render: (job) => <StatusLabel value={job.status} fallback={{ label: humanize(job.status), tone: 'neutral' }} /> },
              { key: 'started', header: 'Started', render: (job) => formatDate(job.started_at, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) },
              { key: 'items', header: 'Items', render: (job) => job.items_processed },
              { key: 'message', header: 'Message', render: (job) => job.message ?? 'No message recorded.' },
            ]}
          />
        )}
      </Section>
    </AdminPageFrame>
  )
}
