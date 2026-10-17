import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel, Notice, Panel, RecordList, RecordRow, Section, StatusLabel } from '@/components/record'
import { formatDate, humanize, recordId } from '@/lib/recordStatus'

export const metadata = {
  title: 'Reports - The Green List',
  description: 'Structured accountability reports and their review status.',
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

const REVIEW_STATES = [
  { label: 'Received', value: 'The report exists in the private intake. Nothing is public.' },
  { label: 'Under review', value: 'Staff are checking the account against available documentation.' },
  { label: 'Business response requested', value: 'The named business has been asked to respond with documents.' },
  { label: 'Substantiated / Unsubstantiated / Inconclusive', value: 'The documentary outcome. Only source-backed findings are published.' },
  { label: 'Closed', value: 'No further action. The record of the review is retained.' },
]

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
      loadError = 'Your reports could not be loaded. Try again shortly.'
    } else {
      reports = data ?? []
    }
  }

  return (
    <PageShell>
      <PageIntro
        title="Accountability reports"
        lede="A report documents mislabelling, contamination, licensing issues, worker-safety concerns, deceptive marketing, or another accountability matter. Reports are private on receipt, move through a fixed set of review states, and are published only as source-backed findings."
        meta={
          <>
            <span>Private intake</span>
            <span>Fixed review states</span>
          </>
        }
        actions={
          <Link href="/reports/new" className="greenlist-primary-button">
            File a report
          </Link>
        }
      />

      <Section title="Review states" aside="Applied identically to every report">
        <Ledger rows={REVIEW_STATES} />
      </Section>

      <Section title="Your filed reports" aside={user ? <span>Visible only to you</span> : <span>Requires sign-in</span>}>
        {!user ? (
          <Panel>
            <p className="text-sm leading-6 text-[var(--gl-text-secondary)]">Sign in to file a report or to see the review status of reports you have submitted.</p>
            <div className="mt-4">
              <Link href="/auth/signin?callbackUrl=/reports" className="greenlist-secondary-button">
                Sign in
              </Link>
            </div>
          </Panel>
        ) : loadError ? (
          <Notice tone="alert">{loadError}</Notice>
        ) : reports.length === 0 ? (
          <Panel>
            <p className="text-sm font-semibold text-[var(--gl-text)]">No reports filed.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--gl-text-secondary)]">Reports you file will be listed here with their current review state.</p>
          </Panel>
        ) : (
          <RecordList ariaLabel="Your reports">
            {reports.map((report) => (
              <RecordRow
                key={report.id}
                href={`/reports/${report.id}`}
                title={report.title}
                meta={
                  <>
                    <span>{recordId('RPT', report.id)}</span>
                    <span>{humanize(report.report_type)}</span>
                    <span>{[report.location_city, report.location_state].filter(Boolean).join(', ') || 'Location not stated'}</span>
                    <span>Filed {formatDate(report.created_at)}</span>
                  </>
                }
                aside={<StatusLabel value={report.status} />}
              />
            ))}
          </RecordList>
        )}
      </Section>

      <LimitationsPanel subject="report" />
    </PageShell>
  )
}
