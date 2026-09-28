import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame, ADMIN_SECTIONS } from '@/components/AdminPageFrame'
import { RecordList, RecordRow } from '@/components/record'

const SECTION_SCOPE: Record<string, string> = {
  '/admin/review': 'Pending reports, evidence, and escalations awaiting a documentary decision.',
  '/admin/claims': 'Confirm that a claimant represents the business, then accept or decline.',
  '/admin/business-documents': 'Licences, laboratory results, and permits submitted for the record.',
  '/admin/submissions': 'Incoming public submissions and their intake quality.',
  '/admin/moderation': 'Flags, safety issues, and due-process actions.',
  '/admin/verified-facts': 'Staff-confirmed facts on profiles and business records.',
  '/admin/news': 'Aggregation job status and outlet coverage on file.',
  '/admin/sources': 'Source classes, retrieval dates, and verification metadata.',
  '/admin/audit-logs': 'Operational and moderation events: actor, action, target, timestamp.',
  '/admin/nda': 'Confidentiality agreement required before reviewing sensitive content.',
}

export async function AdminSectionPage({ title, description, current = '/admin' }: { title: string; description: string; current?: string }) {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  return (
    <AdminPageFrame title={title} lede={description} current={current}>
      <RecordList ariaLabel="Review operations sections">
        {ADMIN_SECTIONS.filter((section) => section.href !== '/admin').map((section) => (
          <RecordRow key={section.href} href={section.href} title={section.label} body={SECTION_SCOPE[section.href]} />
        ))}
      </RecordList>
    </AdminPageFrame>
  )
}
