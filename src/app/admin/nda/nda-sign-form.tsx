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
      <label className="flex items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-white/20 bg-black/30 text-emerald-400 focus:ring-emerald-400"
        />
        I have read and agree to the confidentiality statement above.
      </label>

      {error ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-red-300">
          <ShieldAlert className="h-4 w-4" /> {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!checked || submitting}
        onClick={handleSign}
        className="mt-4 inline-flex items-center rounded-lg border border-emerald-300/35 bg-emerald-300/10 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-emerald-200 transition hover:bg-emerald-300/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Signing…' : 'I agree and sign'}
      </button>
    </div>
  )
}
