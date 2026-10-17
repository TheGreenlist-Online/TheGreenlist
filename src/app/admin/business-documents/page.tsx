import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import { BusinessDocumentsAdmin } from './business-documents-admin'

export const metadata = {
  title: 'Business documents - Review operations - The Green List',
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
      if (row.file_url.includes('..')) {
        throw new Error('Invalid file path')
      }
      const { data: signed } = await principal.supabase.storage
        .from('business-documents')
        .createSignedUrl(row.file_url, 60 * 60)
      return { ...row, file_url: signed?.signedUrl ?? row.file_url }
    }),
  )

  return (
    <AdminPageFrame
      title="Business documents"
      lede="Licences, laboratory results, and permits submitted by record holders. Nothing appears on a public record until it has been reviewed here."
      current="/admin/business-documents"
      error={error ? `Documents could not be loaded: ${error.message}` : null}
      meta={<span>{documents.length} pending</span>}
    >
      <BusinessDocumentsAdmin initialDocuments={documents} />
    </AdminPageFrame>
  )
}
