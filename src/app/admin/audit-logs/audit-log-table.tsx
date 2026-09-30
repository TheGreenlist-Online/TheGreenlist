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
    <div className="rounded-xl border border-white/[.09] bg-brand-panel shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <span className="text-xs text-zinc-500">{total} total log{total === 1 ? '' : 's'}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => goToPage(page - 1)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Prev
          </button>
          <span className="text-xs text-zinc-500">
            Page {page} / {pages}
          </span>
          <button
            type="button"
            disabled={page >= pages || loading}
            onClick={() => goToPage(page + 1)}
            className="rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-300 transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
          </button>
          {loading ? <Loader2 className="h-4 w-4 animate-spin text-zinc-500" /> : null}
        </div>
      </div>

      {errorMessage ? (
        <div className="border-b border-red-400/20 bg-red-950/20 px-4 py-2 text-sm text-red-200">{errorMessage}</div>
      ) : null}

      {items.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500">No audit log entries yet.</div>
      ) : (
        <div className="divide-y divide-white/[.06]">
          <div className="hidden grid-cols-[1fr_1.2fr_1.2fr_1fr_auto] gap-3 px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-500 sm:grid">
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
                  className="grid w-full grid-cols-1 items-center gap-2 px-4 py-3 text-left transition hover:bg-white/[.03] sm:grid-cols-[1fr_1.2fr_1.2fr_1fr_auto]"
                >
                  <span className="font-mono text-xs text-zinc-400">{log.actor_id ? log.actor_id.slice(0, 8) : 'system'}</span>
                  <span className="text-sm font-medium text-zinc-200">{log.action}</span>
                  <span className="truncate text-sm text-zinc-400">
                    {log.target_type ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}` : ''}` : '—'}
                  </span>
                  <span className="text-sm text-zinc-500">{format(new Date(log.created_at), 'MMM d, yyyy p')}</span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>
                {expanded ? (
                  <div className="border-t border-white/[.06] bg-black/20 px-4 py-4">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Metadata</h4>
                    <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-white/10 bg-black/25 p-3 text-xs text-zinc-300">
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
