'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldAlert } from 'lucide-react'

export function NdaSignForm() {
 const router = useRouter()
 const [checked, setChecked] = useState(false)
 const [submitting, setSubmitting] = useState(false)
 const [error, setError] = useState<string | null>(null)

 async function handleSign() {
 setSubmitting(true)
 setError(null)
 try {
 const res = await fetch('/api/admin/nda', { method: 'POST' })
 if (!res.ok) {
 const body = await res.json().catch(() => ({}))
 throw new Error(body.error || 'Failed to record signature')
 }
 router.refresh()
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to record signature')
 } finally {
 setSubmitting(false)
 }
 }

 return (
 <div>
 <label className="flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
 <input
 type="checkbox"
 checked={checked}
 onChange={(e) => setChecked(e.target.checked)}
 className="mt-0.5 h-4 w-4 border-[var(--gl-border-strong)] bg-[var(--gl-ink)] accent-[var(--gl-accent)]"
 />
 I have read and agree to the confidentiality statement above.
 </label>

 {error ? (
 <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#f0a094]">
 <ShieldAlert className="h-4 w-4" /> {error}
 </p>
 ) : null}

 <button
 type="button"
 disabled={!checked || submitting}
 onClick={handleSign}
 className="greenlist-primary-button mt-4 disabled:cursor-not-allowed disabled:opacity-40"
 >
 {submitting ? 'Signing…' : 'I agree and sign'}
 </button>
 </div>
 )
}
