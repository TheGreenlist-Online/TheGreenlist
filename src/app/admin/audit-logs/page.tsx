import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireAdmin } from '@/lib/supabase/authz'
import { PageShell } from '@/components/PageShell'
import { OrnatePanel } from '@/components/OrnatePanel'
import { RoleBadge } from '@/components/RoleBadge'
import type { AuditLogRow } from '@/types/moderation'
import { AuditLogTable } from './audit-log-table'
import { ShieldAlert } from 'lucide-react'

export const metadata = {
  title: 'Audit Logs - Admin',
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
    <PageShell>
      <OrnatePanel>
        <p className="greenlist-eyebrow">Admin command center</p>
        <h1 className="greenlist-page-title">Audit logs</h1>
        <p className="greenlist-page-lede">
          Operational and moderation audit records — actor, action, target, and timestamp for every tracked
          admin action.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <RoleBadge role="ADMIN" />
          {error ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-red-300">
              <ShieldAlert className="h-4 w-4" /> Failed to load logs: {error.message}
            </span>
          ) : null}
        </div>
      </OrnatePanel>

      <section className="mt-8">
        <AuditLogTable initialItems={items} initialTotal={count ?? 0} pageSize={PAGE_SIZE} />
      </section>

      <section className="mt-8 text-center">
        <Link href="/admin" className="text-sm font-semibold text-emerald-300 hover:underline">
          Back to admin command center
        </Link>
      </section>
    </PageShell>
  )
}
