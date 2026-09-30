'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, ExternalLink, Loader2, X } from 'lucide-react'
import { EmptyStatePanel } from '@/components/EmptyStatePanel'
import { statusBadgeBase, toneClass } from '@/lib/statusTones'
import { cn } from '@/lib/utils'

export type PendingClaim = {
  id: string
  name: string
  slug: string
  business_type: string | null
  description: string | null
  website_url: string | null
  state: string | null
  city: string | null
  created_at: string
}

type Outcome = { kind: 'approved' | 'denied' | 'error'; message: string }

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function locationOf(claim: PendingClaim) {
  return [claim.city, claim.state].filter(Boolean).join(', ')
}

export function ClaimQueue({ initialClaims }: { initialClaims: PendingClaim[] }) {
  const router = useRouter()
  const [claims, setClaims] = useState(initialClaims)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [outcomes, setOutcomes] = useState<Record<string, Outcome>>({})

  async function decide(claim: PendingClaim, decision: 'approve' | 'deny') {
    setPendingId(claim.id)
    setOutcomes((prev) => {
      const next = { ...prev }
      delete next[claim.id]
      return next
    })

    try {
      const response = await fetch('/api/admin/claims', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: claim.id, decision, note: notes[claim.id] ?? '' }),
      })

      const body = (await response.json().catch(() => ({}))) as {
        error?: string
        alreadyDecided?: boolean
      }

      if (!response.ok) {
        // Someone else already handled it — drop it from the queue rather than
        // leaving a row that can never succeed.
        if (body.alreadyDecided) {
          setClaims((prev) => prev.filter((item) => item.id !== claim.id))
          router.refresh()
          return
        }

        setOutcomes((prev) => ({
          ...prev,
          [claim.id]: { kind: 'error', message: body.error ?? 'Could not record that decision.' },
        }))
        return
      }

      setClaims((prev) => prev.filter((item) => item.id !== claim.id))
      setOutcomes((prev) => ({
        ...prev,
        [claim.id]: {
          kind: decision === 'approve' ? 'approved' : 'denied',
          message:
            decision === 'approve'
              ? `${claim.name} is now verified. The owner has been notified.`
              : `The claim on ${claim.name} was denied. The owner has been notified.`,
        },
      }))
      router.refresh()
    } catch {
      setOutcomes((prev) => ({
        ...prev,
        [claim.id]: { kind: 'error', message: 'Network error. Nothing was changed.' },
      }))
    } finally {
      setPendingId(null)
    }
  }

  const resolved = Object.entries(outcomes).filter(([, outcome]) => outcome.kind !== 'error')

  return (
    <div className="space-y-4">
      {resolved.map(([id, outcome]) => (
        <p
          key={id}
          className={cn(
            'rounded-lg border px-4 py-3 text-sm',
            outcome.kind === 'approved'
              ? 'border-emerald-400/30 bg-emerald-950/20 text-emerald-200'
              : 'border-amber-300/30 bg-amber-950/20 text-amber-100',
          )}
          role="status"
        >
          {outcome.message}
        </p>
      ))}

      {claims.length === 0 ? (
        <EmptyStatePanel
          title="No claims waiting"
          description="When a business owner files a claim it appears here for verification. Approving one marks the profile verified and notifies the owner."
        />
      ) : (
        <ul className="space-y-4">
          {claims.map((claim) => {
            const isPending = pendingId === claim.id
            const error = outcomes[claim.id]?.kind === 'error' ? outcomes[claim.id] : null
            const location = locationOf(claim)

            return (
              <li
                key={claim.id}
                className="rounded-xl border border-white/[.08] bg-white/[.02] p-5 md:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="greenlist-card-title">{claim.name}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-400">
                      <span className={`${statusBadgeBase} ${toneClass('pending')}`}>unverified</span>
                      {claim.business_type ? <span>{claim.business_type}</span> : null}
                      {location ? <span>{location}</span> : null}
                      <span>Filed {formatDate(claim.created_at)}</span>
                    </div>
                  </div>

                  {claim.website_url ? (
                    <a
                      href={claim.website_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-emerald-300 hover:underline"
                    >
                      Open website
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : null}
                </div>

                {claim.description ? (
                  <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-300">
                    {claim.description}
                  </p>
                ) : (
                  <p className="mt-4 text-sm italic text-zinc-500">No description provided.</p>
                )}

                <label
                  htmlFor={`note-${claim.id}`}
                  className="mt-5 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500"
                >
                  Reviewer note
                </label>
                <p className="mt-1 text-xs text-zinc-500">
                  Recorded in the audit log. Not shown to the owner.
                </p>
                <input
                  id={`note-${claim.id}`}
                  type="text"
                  value={notes[claim.id] ?? ''}
                  onChange={(event) =>
                    setNotes((prev) => ({ ...prev, [claim.id]: event.target.value }))
                  }
                  placeholder="e.g. licence CL-2291 confirmed on state registry"
                  className="mt-2 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-400/50 focus:outline-none"
                />

                {error ? (
                  <p className="mt-3 text-sm text-red-300" role="alert">
                    {error.message}
                  </p>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => decide(claim, 'approve')}
                    disabled={isPending}
                    className="greenlist-primary-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve claim
                  </button>
                  <button
                    type="button"
                    onClick={() => decide(claim, 'deny')}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-400/35 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400/60 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                    Deny
                  </button>
                  <Link
                    href={`/businesses/${claim.slug}`}
                    className="text-sm text-zinc-400 transition hover:text-emerald-300"
                  >
                    View profile
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
