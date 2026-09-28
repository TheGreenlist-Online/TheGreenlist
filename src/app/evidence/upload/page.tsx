import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
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

export default async function EvidenceUploadPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/evidence/upload')
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
        eyebrow="Evidence"
        title="Submit evidence"
        lede="Photographs, receipts, product labels, screenshots, PDFs, or written documentation. Files are stored privately, linked to your report or correction request, and reviewed by authorised staff only."
        meta={
          <>
            <span>Private on receipt</span>
            <span>Linked to a report</span>
          </>
        }
        actions={
          <Link href="/evidence" className="greenlist-quiet-button">
            How intake works
          </Link>
        }
      />

      <div className="mt-8">
        <EvidenceUploadForm
          userId={user.id}
          reports={reportOptions}
          reportsLoadError={error ? 'Your existing reports could not be loaded. You can still create a new report below.' : null}
        />
      </div>

      <LimitationsPanel subject="report" className="mt-8" />
    </PageShell>
  )
}
