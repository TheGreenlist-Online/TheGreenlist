import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { EvidenceUploadForm, type EvidenceReportOption } from './evidence-upload-form'

export const metadata = {
  title: 'Upload Evidence - The Green List',
  description: 'Upload photos, receipts, and documentation to support your report',
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
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Upload Evidence</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Document Your Report with Supporting Evidence
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Submit photos, receipts, product labels, screenshots, PDFs, or written documentation.
              Files remain private and enter the platform&apos;s protected review process.
            </p>
          </div>
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
