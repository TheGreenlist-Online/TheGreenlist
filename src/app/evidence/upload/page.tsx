import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EvidenceUploadForm, type EvidenceReportOption } from './evidence-upload-form'

export const metadata = {
  title: 'Upload Evidence - The Green List',
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="mb-12 border-b border-[var(--gl-border)] pb-8">
          <p className="greenlist-eyebrow">Evidence</p>
          <h1 className="greenlist-page-title max-w-4xl">Submit evidence</h1>
          <p className="greenlist-page-lede">
            Photographs, receipts, product labels, screenshots, PDFs, or written documentation. Files are stored
            privately, linked to your report or correction request, and reviewed by authorised staff only.
          </p>
        </section>

        <EvidenceUploadForm
          userId={user.id}
          reports={reportOptions}
          reportsLoadError={error ? 'Your existing reports could not be loaded. You can still create a new report below.' : null}
        />
      </main>
    </div>
  )
}
