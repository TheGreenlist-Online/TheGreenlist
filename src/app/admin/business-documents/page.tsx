import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import { BusinessDocumentsAdmin } from './business-documents-admin'

export const metadata = {
  title: 'Business Documents - Admin',
}

export const revalidate = 0

type BusinessDocumentRow = {
  id: string
  business_id: string
  title: string
  doc_type: string
  file_url: string
  status: string
  review_note: string | null
  created_at: string
  business_profiles: { name: string | null; slug: string | null } | null
}

export default async function AdminBusinessDocumentsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/business-documents')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data, error } = await principal.supabase
    .from('business_documents')
    .select('*, business_profiles(name, slug)')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .returns<BusinessDocumentRow[]>()

  const rows = data ?? []

  const documents = await Promise.all(
    rows.map(async (row) => {
      const { data: signed } = await principal.supabase.storage
        .from('business-documents')
        .createSignedUrl(row.file_url, 60 * 60)
      return { ...row, file_url: signed?.signedUrl ?? row.file_url }
    }),
  )

  return (
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Admin command center</p>
        <h1 className="mt-3 text-4xl text-amber-100">Business legal documents</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Review licenses, lab results, and permits submitted by business owners before they become
          publicly visible on business pages.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <RoleBadge role="ADMIN" />
          {error ? <span className="text-sm text-red-300">Failed to load documents: {error.message}</span> : null}
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <BusinessDocumentsAdmin initialDocuments={documents} />
      </section>

      <section className="mt-8 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
