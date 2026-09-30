import { redirect } from 'next/navigation'
import { requirePermission } from '@/lib/supabase/authz'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import { ClaimQueue, type PendingClaim } from './claim-queue'

export const metadata = {
  title: 'Business claims - Review operations - The Green List',
  description: 'Approve or deny business profile claims.',
}

export const dynamic = 'force-dynamic'

export default async function AdminClaimsPage() {
  const principal = await requirePermission('business.review')

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
    <AdminPageFrame
      title="Business claims"
      lede="Confirm that each claimant represents the business they filed for. Accepting labels the record Identity verified and lists it; declining keeps it unlisted. The claimant is notified either way."
      current="/admin/claims"
      error={loadError}
      meta={<span>{claims.length} awaiting review</span>}
    >
      {loadError ? null : <ClaimQueue initialClaims={claims} />}
    </AdminPageFrame>
  )
}
