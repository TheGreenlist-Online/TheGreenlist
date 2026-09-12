import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { ArrowLeft, MapPin, ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Report Detail - The Green List',
}

type ReportDetailRow = {
  id: string
  reporter_id: string | null
  business_id: string | null
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

const STATUS_STYLES: Record<string, string> = {
  submitted: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  under_review: 'border-cyan-300/35 bg-cyan-950/25 text-cyan-200',
  business_response_requested: 'border-orange-300/35 bg-orange-950/25 text-orange-200',
  substantiated: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
  unsubstantiated: 'border-zinc-400/35 bg-zinc-800/40 text-zinc-300',
  inconclusive: 'border-zinc-400/35 bg-zinc-800/40 text-zinc-300',
  resolved: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
}

// NOTE (phase 2 TODO): public visibility for resolved/substantiated reports (via
// public_summary, for non-owners / unauthenticated visitors) is not implemented yet.
// This page is gated to the owning reporter only for now.
export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
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
      'id, reporter_id, business_id, report_type, title, description, location_state, location_city, is_anonymous, status, verification_status, risk_level, confidence_score, public_summary, created_at, updated_at'
    )
    .eq('id', id)
    .maybeSingle<ReportDetailRow>()

  if (error || !report || report.reporter_id !== user.id) {
    notFound()
  }

  const statusStyle = STATUS_STYLES[report.status] ?? 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200'

  return (
    <PageShell>
      <Link href="/reports" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        Back to Reports Bureau
      </Link>

      <OrnatePanel className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="greenlist-eyebrow">
              {report.report_type.replace(/_/g, ' ')}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-100 md:text-4xl">{report.title}</h1>
          </div>
          <span className={`inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold uppercase tracking-[0.12em] ${statusStyle}`}>
            {report.status.replace(/_/g, ' ')}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
          {report.location_city || report.location_state ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {[report.location_city, report.location_state].filter(Boolean).join(', ')}
            </span>
          ) : null}
          <span>Filed {new Date(report.created_at).toLocaleDateString()}</span>
          <span>Verification: {report.verification_status.replace(/_/g, ' ')}</span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            Risk: {report.risk_level}
          </span>
          {report.is_anonymous ? <span>Public anonymity requested</span> : null}
        </div>

        <div className="mt-6 border-t border-white/10 pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Description</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7 text-zinc-300">{report.description}</p>
        </div>

        {report.public_summary ? (
          <div className="mt-6 border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Public summary</h2>
            <p className="mt-3 leading-7 text-zinc-300">{report.public_summary}</p>
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-amber-300/25 bg-amber-950/15 p-4 text-sm text-amber-100">
          Status updates from moderators and reviewers will be reflected here as your report moves through
          review. You do not need to resubmit — check back on this page for progress.
        </div>
      </OrnatePanel>
    </PageShell>
  )
}
