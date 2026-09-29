'use client'

import { useState } from 'react'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { StatusMessage } from '@/components/settings/SettingsControls'

/**
 * Data export and account closure.
 *
 * Closure opens a support ticket rather than deleting rows: reports and
 * evidence are accountability records that may belong to an open review, so a
 * human decides what is removed and what is retained or anonymised.
 */
export function DataSettings({ hasOpenRequest }: { hasOpenRequest: boolean }) {
  const [isRequesting, setIsRequesting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [requested, setRequested] = useState(hasOpenRequest)

  const submitRequest = async () => {
    setIsRequesting(true)
    setResult(null)

    try {
      const response = await fetch('/api/settings/deletion-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        setResult({ tone: 'error', text: body?.error ?? 'Could not file the request. Please try again.' })
        return
      }

      setRequested(true)
      setConfirming(false)
      setResult({
        tone: 'success',
        text:
          body?.status === 'already_open'
            ? 'You already have an open closure request. Support will follow up by email.'
            : 'Your closure request was filed. Support will follow up by email before anything is removed.',
      })
    } catch {
      setResult({ tone: 'error', text: 'Could not reach the server. Please try again.' })
    } finally {
      setIsRequesting(false)
    }
  }

  return (
    <SettingsSection
      id="data"
      title="Your data"
      description="Take a copy of everything on your account, or ask for the account to be closed."
    >
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/[.07] bg-white/[.02] p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Export my data</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Downloads your profile, reports, submissions, threads, tickets and notifications as a JSON file. Private
            evidence file contents aren&apos;t included.
          </p>
        </div>
        <a href="/api/settings/export" className="greenlist-quiet-button shrink-0" download>
          Download JSON
        </a>
      </div>

      <div className="rounded-lg border border-red-300/20 bg-red-950/[.15] p-4">
        <p className="text-sm font-semibold text-zinc-100">Close my account</p>
        <p className="mt-1 text-xs leading-5 text-zinc-500">
          Reports and evidence may be part of an open accountability review, so closure is handled by a person rather
          than a button. We&apos;ll confirm by email what can be deleted and what has to be retained or anonymised.
        </p>

        {requested && !confirming ? (
          <p className="mt-3 text-xs font-medium text-amber-200">
            A closure request is already open on your account. Support will be in touch by email.
          </p>
        ) : confirming ? (
          <div className="mt-4 space-y-3">
            <label htmlFor="closure-reason" className="block text-xs font-semibold text-zinc-300">
              Reason (optional)
            </label>
            <textarea
              id="closure-reason"
              rows={3}
              value={reason}
              maxLength={2000}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Anything the support team should know."
              className="w-full resize-y rounded-lg border border-white/[.12] bg-black/30 px-3 py-2.5 text-sm leading-6 text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20"
            />
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={submitRequest}
                disabled={isRequesting}
                className="rounded-lg border border-red-300/30 bg-red-950/30 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950/50 disabled:opacity-50"
              >
                {isRequesting ? 'Filing request…' : 'Confirm closure request'}
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="greenlist-quiet-button">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="mt-3 rounded-lg border border-red-300/30 bg-red-950/25 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950/40"
          >
            Request account closure
          </button>
        )}
      </div>

      {result ? <StatusMessage tone={result.tone}>{result.text}</StatusMessage> : null}
    </SettingsSection>
  )
}
