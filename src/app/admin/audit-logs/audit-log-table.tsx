'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import type { AuditLogRow } from '@/types/moderation'

export function AuditLogTable({
 initialItems,
 initialTotal,
 pageSize,
}: {
 initialItems: AuditLogRow[]
 initialTotal: number
 pageSize: number
}) {
 const [items, setItems] = useState<AuditLogRow[]>(initialItems)
 const [page, setPage] = useState(1)
 const [total, setTotal] = useState(initialTotal)
 const [expandedId, setExpandedId] = useState<string | null>(null)
 const [loading, setLoading] = useState(false)
 const [errorMessage, setErrorMessage] = useState<string | null>(null)

 const pages = Math.max(1, Math.ceil(total / pageSize))

 async function goToPage(nextPage: number) {
 if (nextPage < 1 || nextPage > pages) return
 setLoading(true)
 setErrorMessage(null)
 try {
 const res = await fetch(`/api/admin/audit-logs?page=${nextPage}&limit=${pageSize}`)
 if (!res.ok) {
 const body = await res.json().catch(() => ({}))
 throw new Error(body.error || 'Failed to load audit logs')
 }
 const json = await res.json()
 setItems(json.items as AuditLogRow[])
 setTotal(json.pagination.total as number)
 setPage(nextPage)
 setExpandedId(null)
 } catch (err) {
 setErrorMessage(err instanceof Error ? err.message : 'Failed to load audit logs')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="gl-panel">
 <div className="flex items-center justify-between gl-panel__head">
 <span className="text-xs text-[var(--gl-text-muted)]">{total} total log{total === 1 ? '' : 's'}</span>
 <div className="flex items-center gap-2">
 <button
 type="button"
 disabled={page <= 1 || loading}
 onClick={() => goToPage(page - 1)}
 className="greenlist-quiet-button disabled:cursor-not-allowed disabled:opacity-40"
 >
 Prev
 </button>
 <span className="text-xs text-[var(--gl-text-muted)]">
 Page {page} / {pages}
 </span>
 <button
 type="button"
 disabled={page >= pages || loading}
 onClick={() => goToPage(page + 1)}
 className="greenlist-quiet-button disabled:cursor-not-allowed disabled:opacity-40"
 >
 Next
 </button>
 {loading ? <Loader2 className="h-4 w-4 animate-spin text-[var(--gl-text-muted)]" /> : null}
 </div>
 </div>

 {errorMessage ? (
 <div className="gl-notice gl-notice--alert rounded-none border-x-0 border-t-0">{errorMessage}</div>
 ) : null}

 {items.length === 0 ? (
 <div className="p-6 text-sm text-[var(--gl-text-muted)]">No audit log entries yet.</div>
 ) : (
 <div className="divide-y divide-[var(--gl-border)]">
 <div className="hidden grid-cols-[1fr_1.2fr_1.2fr_1fr_auto] gap-3 px-4 py-2 gl-label mb-0 sm:grid">
 <span>Actor</span>
 <span>Action</span>
 <span>Target</span>
 <span>Timestamp</span>
 <span />
 </div>
 {items.map((log) => {
 const expanded = expandedId === log.id
 return (
 <div key={log.id}>
 <button
 type="button"
 onClick={() => setExpandedId(expanded ? null : log.id)}
 className="grid w-full grid-cols-1 items-center gap-2 px-4 py-3 text-left transition hover:bg-[var(--gl-surface-raised)] sm:grid-cols-[1fr_1.2fr_1.2fr_1fr_auto]"
 >
 <span className="font-mono text-xs text-[var(--gl-text-secondary)]">{log.actor_id ? log.actor_id.slice(0, 8) : 'system'}</span>
 <span className="text-sm font-medium text-[var(--gl-text)]">{log.action}</span>
 <span className="truncate text-sm text-[var(--gl-text-secondary)]">
 {log.target_type ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ''}` : '—'}
 </span>
 <span className="text-sm text-[var(--gl-text-muted)]">{format(new Date(log.created_at), 'MMM d, yyyy p')}</span>
 {expanded ? <ChevronUp className="h-4 w-4 text-[var(--gl-text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--gl-text-secondary)]" />}
 </button>
 {expanded ? (
 <div className="border-t border-[var(--gl-border)] bg-[var(--gl-ink)] px-4 py-4">
 <h4 className="gl-label mb-0">Metadata</h4>
 <pre className="mt-2 max-h-64 overflow-auto border border-[var(--gl-border)] bg-[var(--gl-ink)] p-3 font-mono text-xs text-[var(--gl-text-secondary)]">
 {log.metadata ? JSON.stringify(log.metadata, null, 2) : 'No metadata recorded.'}
 </pre>
 </div>
 ) : null}
 </div>
 )
 })}
 </div>
 )}
 </div>
 )
}
