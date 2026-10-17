import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ClaimBusinessForm } from './claim-business-form'
import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel } from '@/components/record'

export const metadata = {
  title: 'Claim a business record - The Green List',
  description: 'Claim your business record to submit documentation and respond on the record.',
}

export default async function BusinessesClaimPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/signin?callbackUrl=/businesses/claim')
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Records"
        title="Claim a business record"
        lede="Claiming a record lets a business submit licence and documentation records, respond to published findings, and request corrections. Claims are reviewed against official sources before any change to the public record."
        meta={
          <>
            <span>Reviewed against official sources</span>
            <span>Cannot be purchased</span>
          </>
        }
        actions={
          <Link href="/businesses" className="greenlist-quiet-button">
            All records
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">
        <ClaimBusinessForm />
        <Ledger
          title="What a claimed record means"
          className="content-start"
          rows={[
            { label: 'Business-reported', value: 'The label applied on receipt. Details were supplied by the business and have not been independently confirmed.' },
            { label: 'Identity verified', value: 'Applied only after licence and registration details are matched to an official source on a stated date.' },
            { label: 'Not an endorsement', value: 'Verification of identity is not a judgement of product quality, safety, or conduct.' },
            { label: 'Not a marketplace', value: 'Records do not facilitate sales, orders, or transactions.' },
            { label: 'Right of reply', value: 'A claimed record can respond to published findings on the record.' },
          ]}
        />
      </div>

      <LimitationsPanel subject="business" className="mt-8" />
    </PageShell>
  )
}
