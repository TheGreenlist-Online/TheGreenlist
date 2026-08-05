import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ReportForm } from './report-form'

export const metadata = {
  title: 'Submit a Report - The Green List',
  description: 'Submit a transparency report with evidence and documentation',
}

// TODO (phase 2): once /api/businesses GET exists and is stable, replace the free-text
// "related business" field in report-form.tsx with an autocomplete/select bound to
// business_id, and pass business_id through to POST /api/reports.
export default async function ReportsNewPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/reports/new')
  }

  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Submit a Report</p>
            <h1 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
              Transparency Through Documented Accountability
            </h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Share your experience with evidence, context, and documentation to help the cannabis community
              understand and address accountability issues.
            </p>
          </div>
        </section>

        <ReportForm />
      </main>
    </div>
  )
}
