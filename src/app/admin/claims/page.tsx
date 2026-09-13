import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { RoleBadge } from '@/components/RoleBadge'
import { ClaimQueue, type PendingClaim } from './claim-queue'

export const metadata = {
  title: 'Business Claims - Admin',
  description: 'Approve or deny business profile claims.',
}

export const dynamic = 'force-dynamic'

export default async function AdminClaimsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/claims')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  let claims: PendingClaim[] = []
  let loadError: string | null = null

  try {
    const admin = createSupabaseAdminClient()
    const { data, error } = await admin
      .from('business_profiles')
      .select(
        'id, name, slug, business_type, description, website_url, state, city, created_at',
      )
      .eq('is_claimed', true)
      .eq('verification_status', 'unverified')
      .order('created_at', { ascending: true })
      .limit(100)

    if (error) throw error
    claims = (data ?? []) as PendingClaim[]
  } catch (error) {
    console.error('Failed to load claim queue:', error)
    loadError = 'The claim queue could not be loaded right now.'
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Admin command center"
        title="Business claims"
        lede="Confirm that each person actually represents the business they filed for. Approving marks the profile verified and publishes it; denying keeps it unlisted. Either way the owner is notified."
        actions={
          <>
            <RoleBadge role="ADMIN" />
            <span className="text-sm text-zinc-400">
              {claims.length} awaiting review
            </span>
          </>
        }
      />

      <section className="mt-8">
        {loadError ? (
          <p className="rounded-lg border border-red-400/30 bg-red-950/20 px-4 py-3 text-sm text-red-200">
            {loadError}
          </p>
        ) : (
          <ClaimQueue initialClaims={claims} />
        )}
      </section>

      <section className="mt-10 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
