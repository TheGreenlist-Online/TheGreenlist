import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Notice } from '@/components/record/Notice'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { CoaIntakeForm } from './coa-intake-form'

export const metadata = { title: 'Private COA submission — The Green List' }
export const dynamic = 'force-dynamic'

export default async function CoaSubmitPage() {
  if (process.env.COA_INTAKE_ENABLED !== 'true') redirect('/coa')
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect('/auth/signin?callbackUrl=%2Fcoa%2Fsubmit')
  const { data, error } = await supabase.from('coa_reports').select('id,intake_status,created_at').eq('owner_id', user.id).order('created_at', { ascending: false }).limit(50)
  return <PageShell>
    <PageIntro eyebrow="Private intake" title="Contribute a COA" lede="Submit the original laboratory certificate. Your document and account identity remain private. A receipt means the file was received; it does not mean its contents or authenticity were reviewed." />
    <div className="mt-6"><CoaIntakeForm /></div>
    <section className="gl-panel gl-panel__body mt-6" aria-labelledby="coa-submissions">
      <h2 id="coa-submissions" className="greenlist-card-title">Your submissions</h2>
      {error ? <Notice tone="review">Submissions could not be loaded. Intake may not be configured yet. Try again later.</Notice> : !data?.length ? <p>No submissions yet.</p> : <ul className="mt-4 space-y-3">{data.map(row => <li key={row.id} className="break-words"><Link className="gl-link" href={`/coa/submissions/${row.id}`}>{row.id}</Link> — {row.intake_status === 'submitted' ? 'Received privately' : row.intake_status === 'upload_failed' ? 'Upload not confirmed' : 'Upload pending'} · {new Date(row.created_at).toISOString().slice(0, 10)}</li>)}</ul>}
    </section>
  </PageShell>
}
