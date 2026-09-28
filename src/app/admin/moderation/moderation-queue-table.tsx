'use client'

import { useMemo, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ModerationQueueRow } from '@/types/moderation'
import { statusToneClass, type StatusTone } from '@/lib/statusTones'

const STATUS_FILTERS: { label: string; value: string | null }[] = [
 { label: 'All', value: null },
 { label: 'Pending', value: 'pending' },
 { label: 'In review', value: 'in_review' },
 { label: 'Resolved', value: 'resolved' },
]

const RISK_STYLES: Record<string, string> = {
 low: statusToneClass.neutral,
 medium: statusToneClass.pending,
 high: statusToneClass.danger,
 critical: statusToneClass.critical,
}

const STATUS_STYLES: Record<string, string> = {
 pending: statusToneClass.pending,
 in_review: statusToneClass.progress,
 resolved: statusToneClass.success,
}

function Badge({ label, styleMap }: { label: string; styleMap: Record<string, string> }) {
 const style = styleMap[label] ?? 'gl-status gl-status--neutral'
 return <span className={cn(style)}>{label.replace(/_/g, ' ')}</span>
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
 <div className="gl-panel">
 <div className="flex flex-wrap items-center gap-2 gl-panel__head">
 {STATUS_FILTERS.map((filter) => (
 <button
 key={filter.label}
 type="button"
 onClick={() => setStatusFilter(filter.value)}
 className={cn(
 statusFilter === filter.value ? 'greenlist-secondary-button' : 'greenlist-quiet-button'
 )}
 >
 {filter.label}
 </button>
 ))}
 <span className="ml-auto text-xs text-[var(--gl-text-muted)]">{filteredItems.length} item{filteredItems.length === 1 ? '' : 's'}</span>
 </div>

 {errorMessage ? (
 <div className="gl-notice gl-notice--alert rounded-none border-x-0 border-t-0">{errorMessage}</div>
 ) : null}

 {filteredItems.length === 0 ? (
 <div className="p-6 text-sm text-[var(--gl-text-muted)]">No moderation items match this filter.</div>
 ) : (
 <div className="divide-y divide-[var(--gl-border)]">
 {filteredItems.map((item) => {
 const expanded = expandedId === item.id
 return (
 <div key={item.id}>
 <button
 type="button"
 onClick={() => setExpandedId(expanded ? null : item.id)}
 className="grid w-full grid-cols-1 items-center gap-3 px-4 py-3 text-left transition hover:bg-[var(--gl-surface-raised)] sm:grid-cols-[1.2fr_0.7fr_0.7fr_1fr_1fr_auto]"
 >
 <span className="font-medium text-[var(--gl-text)]">
 {item.item_type.replace(/_/g, ' ')}
 <span className="ml-2 font-mono text-xs text-[var(--gl-text-muted)]">{item.item_id.slice(0, 8)}</span>
 </span>
 <Badge label={item.risk_level} styleMap={RISK_STYLES} />
 <Badge label={item.status} styleMap={STATUS_STYLES} />
 <span className="truncate text-sm text-[var(--gl-text-secondary)]">
 {item.assigned_to ? `Assigned: ${item.assigned_to.slice(0, 8)}` : 'Unassigned'}
 </span>
 <span className="text-sm text-[var(--gl-text-muted)]">
 {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
 </span>
 {expanded ? <ChevronUp className="h-4 w-4 text-[var(--gl-text-secondary)]" /> : <ChevronDown className="h-4 w-4 text-[var(--gl-text-secondary)]" />}
 </button>

 {expanded ? (
 <div className="border-t border-[var(--gl-border)] bg-[var(--gl-ink)] px-4 py-4">
 <div className="grid gap-4 md:grid-cols-2">
 <div>
 <h4 className="gl-label mb-0">AI notes</h4>
 <p className="mt-2 whitespace-pre-wrap border border-[var(--gl-border)] bg-[var(--gl-ink)] p-3 text-sm text-[var(--gl-text-secondary)]">
 {item.ai_notes || 'No AI notes recorded for this item.'}
 </p>
 </div>

 <div>
 <h4 className="gl-label mb-0">Admin notes</h4>
 <textarea
 className="gl-textarea mt-2 h-24"
 placeholder="Add internal notes about this item…"
 value={notesDraft[item.id] ?? item.admin_notes ?? ''}
 onChange={(e) => setNotesDraft((prev) => ({ ...prev, [item.id]: e.target.value }))}
 />
 <button
 type="button"
 disabled={savingId === item.id}
 onClick={() => updateItem(item.id, { admin_notes: notesDraft[item.id] ?? item.admin_notes ?? '' })}
 className="greenlist-quiet-button mt-2 disabled:opacity-40"
 >
 {savingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
 Save notes
 </button>
 </div>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--gl-border)] pt-4">
 <span className="gl-label mb-0">Change status:</span>
 <button
 type="button"
 disabled={savingId === item.id || item.status === 'in_review'}
 onClick={() => updateItem(item.id, { status: 'in_review' })}
 className="greenlist-quiet-button disabled:cursor-not-allowed disabled:opacity-40"
 >
 Mark in review
 </button>
 <button
 type="button"
 disabled={savingId === item.id || item.status === 'resolved'}
 onClick={() => updateItem(item.id, { status: 'resolved' })}
 className="greenlist-secondary-button disabled:cursor-not-allowed disabled:opacity-40"
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
