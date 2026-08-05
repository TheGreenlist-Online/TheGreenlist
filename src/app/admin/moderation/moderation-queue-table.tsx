'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModerationQueueRow } from '@/types/moderation'

const STATUS_FILTERS: { label: string; value: string | null }[] = [
  { label: 'All', value: null },
  { label: 'Pending', value: 'pending' },
  { label: 'In review', value: 'in_review' },
  { label: 'Resolved', value: 'resolved' },
]

const RISK_STYLES: Record<string, string> = {
  low: 'border-zinc-400/35 bg-zinc-800/35 text-zinc-300',
  medium: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  high: 'border-orange-300/35 bg-orange-950/25 text-orange-200',
  critical: 'border-red-400/35 bg-red-950/25 text-red-200',
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  in_review: 'border-sky-300/35 bg-sky-950/25 text-sky-200',
  resolved: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
}

function Badge({ label, styleMap }: { label: string; styleMap: Record<string, string> }) {
  const style = styleMap[label] ?? 'border-zinc-400/35 bg-zinc-800/35 text-zinc-300'
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.1em]', style)}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

export function ModerationQueueTable({ initialItems }: { initialItems: ModerationQueueRow[] }) {
  const [items, setItems] = useState<ModerationQueueRow[]>(initialItems)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const filteredItems = useMemo(() => {
    if (!statusFilter) return items
    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])

  async function updateItem(id: string, patch: { status?: string; admin_notes?: string }) {
    setSavingId(id)
    setErrorMessage(null)
    try {
      const res = await fetch('/api/admin/moderation-queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...patch }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to update item')
      }
      const updated = (await res.json()) as ModerationQueueRow
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update item')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-white/[.09] bg-[#0d120f] shadow-[0_14px_35px_rgba(0,0,0,0.16)]">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 p-4">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition',
              statusFilter === filter.value
                ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-200'
                : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
            )}
          >
            {filter.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-zinc-500">{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}</span>
      </div>

      {errorMessage ? (
        <div className="border-b border-red-400/20 bg-red-950/20 px-4 py-2 text-sm text-red-200">{errorMessage}</div>
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500">No moderation items match this filter.</div>
      ) : (
        <div className="divide-y divide-white/[.06]">
          {filteredItems.map((item) => {
            const expanded = expandedId === item.id
            return (
              <div key={item.id}>
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="grid w-full grid-cols-1 items-center gap-3 px-4 py-3 text-left transition hover:bg-white/[.03] sm:grid-cols-[1.2fr_0.7fr_0.7fr_1fr_1fr_auto]"
                >
                  <span className="font-medium text-zinc-200">
                    {item.item_type.replace(/_/g, ' ')}
                    <span className="ml-2 font-mono text-xs text-zinc-500">{item.item_id.slice(0, 8)}</span>
                  </span>
                  <Badge label={item.risk_level} styleMap={RISK_STYLES} />
                  <Badge label={item.status} styleMap={STATUS_STYLES} />
                  <span className="truncate text-sm text-zinc-400">
                    {item.assigned_to ? `Assigned: ${item.assigned_to.slice(0, 8)}` : 'Unassigned'}
                  </span>
                  <span className="text-sm text-zinc-500">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                  {expanded ? <ChevronUp className="h-4 w-4 text-zinc-400" /> : <ChevronDown className="h-4 w-4 text-zinc-400" />}
                </button>

                {expanded ? (
                  <div className="border-t border-white/[.06] bg-black/20 px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">AI notes</h4>
                        <p className="mt-2 whitespace-pre-wrap rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-300">
                          {item.ai_notes || 'No AI notes recorded for this item.'}
                        </p>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">Admin notes</h4>
                        <textarea
                          className="mt-2 h-24 w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-200 focus:border-emerald-300/50 focus:outline-none"
                          placeholder="Add internal notes about this item…"
                          value={notesDraft[item.id] ?? item.admin_notes ?? ''}
                          onChange={(e) => setNotesDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        <button
                          type="button"
                          disabled={savingId === item.id}
                          onClick={() => updateItem(item.id, { admin_notes: notesDraft[item.id] ?? item.admin_notes ?? '' })}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-zinc-200 transition hover:border-white/30 disabled:opacity-40"
                        >
                          {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                          Save notes
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[.06] pt-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">Change status:</span>
                      <button
                        type="button"
                        disabled={savingId === item.id || item.status === 'in_review'}
                        onClick={() => updateItem(item.id, { status: 'in_review' })}
                        className="rounded-full border border-sky-300/35 bg-sky-950/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-sky-200 transition hover:bg-sky-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mark in review
                      </button>
                      <button
                        type="button"
                        disabled={savingId === item.id || item.status === 'resolved'}
                        onClick={() => updateItem(item.id, { status: 'resolved' })}
                        className="rounded-full border border-emerald-300/35 bg-emerald-950/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200 transition hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Mark resolved
                      </button>
                    </div>
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
