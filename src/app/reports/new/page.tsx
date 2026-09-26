import { redirect } from 'next/navigation'
import { OrnatePanel } from '@/components/OrnatePanel'
import { PageShell } from '@/components/PageShell'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ReportForm } from './report-form'

export const metadata = {
  title: 'Submit a Report - The Green List',
  description: 'File a structured accountability report with supporting documentation.',
}

export default async function ReportsNewPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/reports/new')
  }

  const { data: businesses } = await supabase
    .from('business_profiles')
    .select('id, name')
    .eq('is_active', true)
    .order('name')
    .limit(250)

  return (
    <PageShell>
      <section className="mb-12 border-b border-[var(--gl-border)] pb-8">
        <p className="greenlist-eyebrow">Reports</p>
        <h1 className="greenlist-page-title max-w-4xl">File a report</h1>
        <p className="greenlist-page-lede">
          State what happened, when, where, and which business it concerns. Attach documentation where you have
          it. Reports are private on receipt and are reviewed against evidence before anything is published.
        </p>
      </section>

      <ReportForm businesses={businesses ?? []} />
    </PageShell>
  )
}
