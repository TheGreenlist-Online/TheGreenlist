import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel } from '@/components/record'
import { PageShell } from '@/components/PageShell'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ReportForm } from './report-form'

export const metadata = {
  title: 'File a report - The Green List',
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
      <PageIntro
        eyebrow="Reports"
        title="File a report"
        lede="State what happened, when, where, and which business it concerns. Attach documentation where you have it. Reports are private on receipt and are reviewed against evidence before anything is published."
        meta={
          <>
            <span>Private on receipt</span>
            <span>Fixed review states</span>
          </>
        }
        actions={
          <Link href="/reports" className="greenlist-quiet-button">
            About reports
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">
        <ReportForm businesses={businesses ?? []} />
        <Ledger
          title="What happens next"
          className="content-start"
          rows={[
            { label: 'Received', value: 'Your report enters the private intake with a reference number.' },
            { label: 'Under review', value: 'Staff check the account against available documentation and may ask you for more.' },
            { label: 'Business response', value: 'Where a business is named, it may be asked to respond with documents.' },
            { label: 'Outcome', value: 'Substantiated, unsubstantiated, or inconclusive. Only source-backed findings are published.' },
            { label: 'Your identity', value: 'Never published. Reviewers can see the filing account for due process.' },
          ]}
        />
      </div>

      <LimitationsPanel subject="report" className="mt-8" />
    </PageShell>
  )
}
