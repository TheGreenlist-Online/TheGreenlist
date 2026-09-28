import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { AdminPageFrame } from '@/components/AdminPageFrame'
import type { AuditLogRow } from '@/types/moderation'
import { AuditLogTable } from './audit-log-table'

export const metadata = {
  title: 'Audit logs - Review operations - The Green List',
}

const PAGE_SIZE = 25

export default async function AdminAuditLogsPage() {
  const principal = await requireAdmin()

  if (!principal.user) {
    redirect('/auth/signin?callbackUrl=/admin/audit-logs')
  }

  if (!principal.authorized) {
    redirect('/dashboard')
  }

  const { data, count, error } = await principal.supabase
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(0, PAGE_SIZE - 1)

  const items = (data ?? []) as AuditLogRow[]

  return (
    <AdminPageFrame
      title="Audit logs"
      lede="Operational and moderation audit records: actor, action, target, and timestamp for every tracked administrative action."
      current="/admin/audit-logs"
      error={error ? `Logs could not be loaded: ${error.message}` : null}
      meta={<span>{count ?? 0} entries</span>}
    >
      <AuditLogTable initialItems={items} initialTotal={count ?? 0} pageSize={PAGE_SIZE} />
    </AdminPageFrame>
  )
}
