import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { Ledger, LimitationsPanel, Notice, Panel, RecordHeader, RecordTimeline } from '@/components/record'
import { formatDate, humanize, recordId, recordStatus } from '@/lib/recordStatus'

export const metadata = {
  title: 'Report - The Green List',
}

type ReportDetailRow = {
  id: string
  reporter_id: string | null
  business_id: string | null
  business_name_reported: string | null
  report_type: string
  title: string
  description: string
  location_state: string | null
  location_city: string | null
  is_anonymous: boolean
  status: string
  verification_status: string
  risk_level: string
  confidence_score: number
  public_summary: string | null
  created_at: string
  updated_at: string
}

// NOTE (phase 2 TODO): public visibility for substantiated reports (via
// public_summary, for non-owners / unauthenticated visitors) is not implemented yet.
// This page is gated to the owning reporter only for now.
export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/auth/signin?callbackUrl=/reports/${id}`)
  }

  const { data: report, error } = await supabase
    .from('reports')
    .select(
      'id, reporter_id, business_id, business_name_reported, report_type, title, description, location_state, location_city, is_anonymous, status, verification_status, risk_level, confidence_score, public_summary, created_at, updated_at',
    )
    .eq('id', id)
    .maybeSingle<ReportDetailRow>()

  if (error || !report || report.reporter_id !== user.id) {
    notFound()
  }

  const location = [report.location_city, report.location_state].filter(Boolean).join(', ')
  const status = recordStatus(report.status)

  return (
    <PageShell width="record">
      <RecordHeader
        eyebrow="Reports"
        kind="Accountability report"
        recordId={recordId('RPT', report.id)}
        jurisdiction={report.location_state ?? undefined}
        title={report.title}
        lede="This page is visible only to the account that filed the report. Review status is updated here; no resubmission is needed."
        status={status}
        meta={[
          { label: 'Filed', value: formatDate(report.created_at) },
          { label: 'Last updated', value: formatDate(report.updated_at) },
        ]}
        actions={
          <Link href="/reports" className="greenlist-quiet-button">
            All your reports
          </Link>
        }
      />

      <Ledger
        title="Report details"
        aside="As submitted"
        className="mt-8"
        rows={[
          { label: 'Report type', value: humanize(report.report_type) },
          { label: 'Business named', value: report.business_name_reported ?? 'Not named' },
          { label: 'Location', value: location || 'Not stated' },
          { label: 'Public anonymity', value: report.is_anonymous ? 'Requested' : 'Not requested', note: 'Anonymity applies to any published finding. Reviewers can see the filing account.' },
          { label: 'Review state', value: status.label, note: status.meaning },
          { label: 'Documentary status', value: humanize(report.verification_status) },
          { label: 'Risk classification', value: humanize(report.risk_level), note: 'Internal triage category set by reviewers. Not a public finding.' },
        ]}
      />

      <Panel title="Account as filed" className="mt-6">
        <p className="gl-article">{report.description}</p>
      </Panel>

      <Panel title="Public summary" aside={report.public_summary ? 'Published' : 'None published'} className="mt-6">
        {report.public_summary ? (
          <p className="text-sm leading-7 text-[var(--gl-text-secondary)]">{report.public_summary}</p>
        ) : (
          <p className="text-sm leading-6 text-[var(--gl-text-muted)]">
            No public summary exists for this report. A summary is published only when the review reaches a source-backed finding.
          </p>
        )}
      </Panel>

      <Panel title="Record history" className="mt-6">
        <RecordTimeline
          events={[
            { at: report.created_at, what: <><strong>Report received.</strong> Entered private intake.</> },
            ...(report.updated_at !== report.created_at
              ? [{ at: report.updated_at, what: <><strong>Record updated.</strong> Current state: {status.label}.</> }]
              : []),
          ]}
        />
      </Panel>

      <Notice tone="info" className="mt-6">
        Reviewer actions are recorded on this page as the report moves through review. You will not be asked to resubmit. To add
        documents, use <Link href="/evidence/upload" className="gl-link">evidence intake</Link> and reference {recordId('RPT', report.id)}.
      </Notice>

      <LimitationsPanel subject="report" className="mt-8" />
    </PageShell>
  )
}
