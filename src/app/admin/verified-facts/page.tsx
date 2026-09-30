import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import { VerifiedFactsAdmin } from './verified-facts-admin'

export const metadata = {
  title: 'Confirmed facts - Review operations - The Green List',
}

export const revalidate = 0

export default async function AdminVerifiedFactsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/verified-facts')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data, error } = await principal.supabase
    .from('verified_facts')
    .select('*')
    .order('verified_at', { ascending: false })
    .limit(100)

  const facts = data ?? []

  return (
    <AdminPageFrame
      title="Confirmed facts"
      lede="Add or remove staff-confirmed facts shown on account and business records. Each fact carries a source and a review date. Subjects cannot add or edit entries."
      current="/admin/verified-facts"
      error={error ? `Facts could not be loaded: ${error.message}` : null}
      meta={<span>{facts.length} on record</span>}
    >
      <VerifiedFactsAdmin initialFacts={facts} />
    </AdminPageFrame>
  )
}
