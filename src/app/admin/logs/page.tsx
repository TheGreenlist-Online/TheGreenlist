import { redirect } from 'next/navigation'

// This route pre-dated the real audit-log implementation and is kept as an alias
// so existing links (e.g. the dashboard's "Audit Logs" card) keep working.
// The real implementation lives at /admin/audit-logs.
export default function AdminLogsRedirectPage() {
  redirect('/admin/audit-logs')
}
