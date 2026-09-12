import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { ClaimBusinessForm } from './claim-business-form'

export const metadata = {
  title: 'Claim Business Profile - The Green List',
  description: 'Verify and manage your business profile on The Green List',
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
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-12">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Business Profile</p>
            <h1 className="greenlist-page-title max-w-4xl">Claim Your Business Profile</h1>
            <p className="mt-4 max-w-3xl text-muted-foreground">
              Verify your cannabis business on The Green List to manage your profile, respond to community
              discussions, and demonstrate transparency and accountability.
            </p>
          </div>
        </section>

        <ClaimBusinessForm />

        <section className="mt-12 max-w-2xl mx-auto text-sm text-muted-foreground">
          <h2 className="font-semibold text-accent mb-2">Not a Marketplace</h2>
          <p>
            The Green List business profiles are for transparency and accountability only. We do not facilitate
            sales, orders, or transactions. New profiles start as unverified — our team reviews license and
            registration details before granting verified status.
          </p>
        </section>
      </main>
    </div>
  )
}
