import { redirect } from 'next/navigation'
import { OrnatePanel } from '@/components/OrnatePanel'
import { PageShell } from '@/components/PageShell'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ReportForm } from './report-form'

export const metadata = {
  title: 'Submit a Report - The Green List',
  description: 'Submit a transparency report with evidence and documentation',
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
      <OrnatePanel className="mb-12">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Submit a Report</p>
        <h1 className="greenlist-page-title max-w-4xl">
          Transparency Through Documented Accountability
        </h1>
        <p className="mt-4 max-w-3xl text-muted-foreground">
          Share your experience with evidence, context, and documentation to help the cannabis community
          understand and address accountability issues.
        </p>
      </OrnatePanel>

      <ReportForm businesses={businesses ?? []} />
    </PageShell>
  )
}
