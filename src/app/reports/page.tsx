import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { FileText, Plus } from 'lucide-react'

export const metadata = {
  title: 'Reports Bureau - The Green List',
  description: 'File and track structured accountability reports',
}

type ReportListRow = {
  id: string
  title: string
  status: string
  report_type: string
  location_state: string | null
  location_city: string | null
  created_at: string
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  under_review: 'border-cyan-300/35 bg-cyan-950/25 text-cyan-200',
  business_response_requested: 'border-orange-300/35 bg-orange-950/25 text-orange-200',
  substantiated: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
  unsubstantiated: 'border-zinc-400/35 bg-zinc-800/40 text-zinc-300',
  inconclusive: 'border-zinc-400/35 bg-zinc-800/40 text-zinc-300',
  resolved: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
}

function StatusPill({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] ${style}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

export default async function ReportsPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let reports: ReportListRow[] = []
  let loadError: string | null = null

  if (user) {
    const { data, error } = await supabase
      .from('reports')
      .select('id, title, status, report_type, location_state, location_city, created_at')
      .eq('reporter_id', user.id)
      .order('created_at', { ascending: false })
      .returns<ReportListRow[]>()

    if (error) {
      loadError = 'Your reports could not be loaded right now.'
    } else {
      reports = data ?? []
    }
  }

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Reports Bureau</p>
        <h1 className="greenlist-page-title">
          Structured accountability reports
        </h1>
        <p className="greenlist-page-lede">
          File a report documenting mislabeling, contamination, licensing issues, worker safety concerns,
          deceptive marketing, or other accountability matters. Reports enter a transparent review process.
        </p>
        <div className="mt-6">
          <Link
            href="/reports/new"
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-emerald-400 px-5 py-2.5 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-300"
          >
            <Plus className="h-4 w-4" />
            File a Report
          </Link>
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <p className="greenlist-eyebrow">Your reports</p>
        <h2 className="greenlist-section-title">My filed reports</h2>

        {!user ? (
          <OrnatePanel className="mt-5">
            <p className="text-zinc-300">Sign in to file a report or view the reports you have submitted.</p>
            <Link
              href="/auth/signin?callbackUrl=/reports"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-amber-300/35 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:border-emerald-300 hover:text-emerald-200"
            >
              Sign in to continue
            </Link>
          </OrnatePanel>
        ) : loadError ? (
          <OrnatePanel className="mt-5">
            <p role="alert" className="text-amber-200">{loadError}</p>
          </OrnatePanel>
        ) : reports.length === 0 ? (
          <OrnatePanel className="mt-5">
            <div className="flex items-start gap-3">
              <FileText className="mt-1 h-6 w-6 text-emerald-300" />
              <div>
                <p className="text-zinc-200 font-semibold">No reports filed yet.</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Once you file a report, it will appear here along with its review status.
                </p>
              </div>
            </div>
          </OrnatePanel>
        ) : (
          <div className="mt-5 grid gap-4">
            {reports.map((report) => (
              <Link key={report.id} href={`/reports/${report.id}`} className="block">
                <OrnatePanel className="transition hover:-translate-y-0.5 hover:border-emerald-300/35">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-zinc-100">{report.title}</h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {report.report_type.replace(/_/g, ' ')}
                        {report.location_city || report.location_state
                          ? ` · ${[report.location_city, report.location_state].filter(Boolean).join(', ')}`
                          : ''}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        Filed {new Date(report.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <StatusPill status={report.status} />
                  </div>
                </OrnatePanel>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  )
}
