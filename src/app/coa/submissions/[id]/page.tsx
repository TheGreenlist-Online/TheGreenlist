import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Notice } from '@/components/record/Notice'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { COA_UUID } from '@/lib/coa/intake'

export const metadata = { title: 'Private COA receipt — The Green List', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function CoaReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  if (process.env.COA_INTAKE_ENABLED !== 'true') notFound()
  const { id } = await params
  if (!COA_UUID.test(id)) notFound()
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.is_anonymous) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/coa/submissions/${id}`)}`)
  const { data: row, error } = await supabase.from('coa_reports').select('id,intake_status,product_name_reported,batch_identifier_reported,created_at,received_at').eq('id', id).eq('owner_id', user.id).maybeSingle()
  if (error) throw new Error('COA receipt unavailable. Try again later.')
  if (!row) notFound()
  const received = row.intake_status === 'submitted'
  return <PageShell>
    <PageIntro eyebrow="Private COA receipt" title={received ? 'PDF received privately' : 'Upload not confirmed'} lede={received ? 'Your original PDF is retained unchanged. No results have been extracted, human-reviewed, authenticated, or published.' : 'This reservation is not a confirmed submission. No review has begun. If the upload was interrupted, start a new submission.'} />
    <div className="gl-panel gl-panel__body mt-6 space-y-4">
      <p className="break-all">Reference: {id}</p>
      <p>Created: {new Date(row.created_at).toISOString()}</p>
      {row.received_at ? <p>Received: {new Date(row.received_at).toISOString()}</p> : null}
      <p className="break-words">Your product description: {row.product_name_reported ?? 'Not provided'}</p>
      <p className="break-words">Your batch / package identifier: {row.batch_identifier_reported ?? 'Not provided'}</p>
      <Notice tone="review">Source authenticity: Unverified. Source authenticity has not been independently verified. Attribution to a named laboratory or business has not been confirmed.</Notice>
      <p>Extraction: Not started. Human review: Not reviewed. Publication: Private.</p>
      <p>Your account identity and original file are not public. Only you can retrieve this receipt through the site; staff access requires authorized operational handling. Original files may retain personal information and metadata. Contact support with this reference for a correction or removal request.</p>
      {received ? <a className="greenlist-secondary-button" href={`/api/coa/${id}/source`}>Download your original PDF</a> : null}
      <div><Link className="gl-link" href="/coa/submit">Your submissions and new intake</Link> · <Link className="gl-link" href="/contact">Contact support</Link></div>
    </div>
  </PageShell>
}
