import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CORRECTION_REQUEST_TYPE, isReportType, type ReportType } from '@/lib/report-types'
import { EvidenceUploadForm, type EvidenceReportOption } from './evidence-upload-form'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { LimitationsPanel } from '@/components/record'
import Link from 'next/link'

export const metadata = {
  title: 'Submit evidence - The Green List',
  description: 'Submit documentation supporting a report or a correction request.',
}

type EvidenceReportRow = {
  id: string
  title: string
  status: string
  created_at: string
}

type EvidenceUploadPageProps = {
  searchParams: Promise<{ type?: string | string[] }>
}

/**
 * `?type=` preselects the report type. /about/corrections links here with
 * `type=correction_request`. Anything not in the registry is ignored rather
 * than echoed back, so the query string cannot inject an arbitrary token.
 */
function resolveInitialReportType(raw: string | string[] | undefined): ReportType | null {
  const candidate = Array.isArray(raw) ? raw[0] : raw
  return isReportType(candidate) ? candidate : null
}

export default async function EvidenceUploadPage({ searchParams }: EvidenceUploadPageProps) {
  const { type } = await searchParams
  const initialReportType = resolveInitialReportType(type)
  const isCorrection = initialReportType === CORRECTION_REQUEST_TYPE

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const callbackUrl = initialReportType
      ? `/evidence/upload?type=${encodeURIComponent(initialReportType)}`
      : '/evidence/upload'
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`)
  }

  const { data: reports, error } = await supabase
    .from('reports')
    .select('id, title, status, created_at')
    .eq('reporter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)
    .returns<EvidenceReportRow[]>()

  const reportOptions: EvidenceReportOption[] = (reports ?? []).map((report) => ({
    id: report.id,
    title: report.title,
    status: report.status,
    createdAt: report.created_at,
  }))

  return (
    <PageShell>
      <PageIntro
        eyebrow={isCorrection ? 'Corrections' : 'Evidence'}
        title={isCorrection ? 'Request a correction' : 'Submit evidence'}
        lede={
          isCorrection
            ? 'Identify the record and the statement in dispute, say what it should read, and attach primary documentation. Requests are private until a decision is made and are reviewed by authorised staff only.'
            : 'Photographs, receipts, product labels, screenshots, PDFs, or written documentation. Files are stored privately, linked to your report or correction request, and reviewed by authorised staff only.'
        }
        meta={
          <>
            <span>Private on receipt</span>
            <span>{isCorrection ? 'Filed as a correction request' : 'Linked to a report'}</span>
          </>
        }
        actions={
          <Link href={isCorrection ? '/about/corrections' : '/evidence'} className="greenlist-quiet-button">
            {isCorrection ? 'How corrections work' : 'How intake works'}
          </Link>
        }
      />

      <div className="mt-8">
        <EvidenceUploadForm
          userId={user.id}
          reports={reportOptions}
          initialReportType={initialReportType}
          reportsLoadError={error ? 'Your existing reports could not be loaded. You can still create a new report below.' : null}
        />
      </div>

      <LimitationsPanel subject="report" className="mt-8" />
    </PageShell>
  )
}
