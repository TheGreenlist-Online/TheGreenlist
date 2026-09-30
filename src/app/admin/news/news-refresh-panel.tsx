'use client'

import { useState } from 'react'
import { Loader2, PlayCircle } from 'lucide-react'

type RefreshResult = {
 ok: boolean
 status?: string
 itemsProcessed?: number
 message?: string
 error?: string
}

export function NewsRefreshPanel() {
 const [running, setRunning] = useState(false)
 const [result, setResult] = useState<RefreshResult | null>(null)

 async function runRefresh() {
 setRunning(true)
 setResult(null)
 try {
 const res = await fetch('/api/admin/run-news-refresh', { method: 'POST' })
 const body = (await res.json().catch(() => ({}))) as RefreshResult
 if (!res.ok) {
 setResult({ ok: false, error: body.error || 'Refresh failed.' })
 } else {
 setResult(body)
 }
 } catch (error) {
 setResult({ ok: false, error: error instanceof Error ? error.message : 'Refresh failed.' })
 } finally {
 setRunning(false)
 }
 }

 return (
 <div className="gl-panel p-5">
 <h2 className="greenlist-card-title">Manual refresh</h2>
 <p className="mt-2 text-sm text-[var(--gl-text-secondary)]">
 The news feed refreshes automatically every two hours via Vercel Cron. Use this button to
 trigger a refresh immediately (for example, right after adding a new source).
 </p>

 <button
 type="button"
 onClick={runRefresh}
 disabled={running}
 className="greenlist-secondary-button mt-4 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
 {running ? 'Running refresh…' : 'Run news refresh now'}
 </button>

 {result ? (
 <div
 className={
 result.ok
 ? 'gl-notice gl-notice--confirmed mt-4'
 : 'gl-notice gl-notice--alert mt-4'
 }
 >
 {result.ok ? (
 <>
 <p className="font-semibold uppercase tracking-[0.08em]">{result.status}</p>
 <p className="mt-1">{result.message}</p>
 <p className="mt-1 text-xs text-[var(--gl-text-secondary)]">Items processed: {result.itemsProcessed ?? 0}</p>
 </>
 ) : (
 <p>{result.error}</p>
 )}
 </div>
 ) : null}
 </div>
 )
}
