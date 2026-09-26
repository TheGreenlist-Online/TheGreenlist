import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ClaimBusinessForm } from './claim-business-form'

export const metadata = {
  title: 'Claim Business Profile - The Green List',
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
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="mb-12 border-b border-[var(--gl-border)] pb-8">
          <p className="greenlist-eyebrow">Records</p>
          <h1 className="greenlist-page-title max-w-4xl">Claim a business record</h1>
          <p className="greenlist-page-lede">
            Claiming a record lets a business submit licence and documentation records, respond to published
            findings, and request corrections. Claims are reviewed against official sources before any change
            to the public record.
          </p>
        </section>

        <ClaimBusinessForm />

        <section className="mt-12 max-w-2xl mx-auto text-sm text-muted-foreground">
          <h2 className="greenlist-card-title mb-2">What a claimed record does and does not mean</h2>
          <p>
            A claimed record is labelled “business-reported” until licence and registration details are matched to an
            official source, at which point the identity is labelled as verified. Verification of identity is not a
            judgement of product quality, safety, or conduct, and cannot be purchased. Records are not a marketplace
            and do not facilitate sales, orders, or transactions.
          </p>
        </section>
      </main>
    </div>
  )
}
