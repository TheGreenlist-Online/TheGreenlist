'use client'

import { FormEvent, useState } from 'react'
import { Trash2 } from 'lucide-react'

type VerifiedFactRow = {
 id: string
 subject_user_id: string | null
 subject_business_id: string | null
 fact_text: string
 category: string
 source_url: string | null
 verified_at: string
}

function formatDate(dateString: string) {
 try {
 return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
 } catch {
 return dateString
 }
}

export function VerifiedFactsAdmin({ initialFacts }: { initialFacts: VerifiedFactRow[] }) {
 const [facts, setFacts] = useState<VerifiedFactRow[]>(initialFacts)
 const [subjectType, setSubjectType] = useState<'user' | 'business'>('user')
 const [lookupValue, setLookupValue] = useState('')
 const [factText, setFactText] = useState('')
 const [category, setCategory] = useState('general')
 const [sourceUrl, setSourceUrl] = useState('')
 const [isSubmitting, setIsSubmitting] = useState(false)
 const [deletingId, setDeletingId] = useState<string | null>(null)
 const [error, setError] = useState('')
 const [success, setSuccess] = useState('')

 async function resolveSubjectId(): Promise<string | null> {
 const trimmed = lookupValue.trim()
 if (!trimmed) return null

 // If it already looks like a UUID, use it directly.
 const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
 if (uuidPattern.test(trimmed)) return trimmed

 if (subjectType === 'user') {
 const res = await fetch(`/api/profiles/${encodeURIComponent(trimmed)}`)
 if (!res.ok) return null
 const data = await res.json()
 return data?.id ?? null
 }

 const res = await fetch(`/api/businesses/${encodeURIComponent(trimmed)}`)
 if (!res.ok) return null
 const data = await res.json()
 return data?.id ?? null
 }

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault()
 setError('')
 setSuccess('')

 if (!factText.trim()) {
 setError('Fact text is required.')
 return
 }
 if (!lookupValue.trim()) {
 setError(subjectType === 'user' ? 'Enter a username or user ID.' : 'Enter a business ID (UUID).')
 return
 }

 setIsSubmitting(true)
 try {
 const subjectId = await resolveSubjectId()
 if (!subjectId) {
 throw new Error(
 subjectType === 'user'
 ? 'Could not resolve that username to a user. Try entering their user ID (UUID) instead.'
 : 'Could not resolve that business slug. Try entering the business ID (UUID) instead.',
 )
 }

 const payload: Record<string, unknown> = {
 fact_text: factText.trim(),
 category: category.trim() || 'general',
 source_url: sourceUrl.trim() || null,
 }
 if (subjectType === 'user') {
 payload.subject_user_id = subjectId
 } else {
 payload.subject_business_id = subjectId
 }

 const res = await fetch('/api/verified-facts', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 })

 if (!res.ok) {
 const body = await res.json().catch(() => ({}))
 throw new Error(body.error || 'Failed to create verified fact.')
 }

 const created = (await res.json()) as VerifiedFactRow
 setFacts((prev) => [created, ...prev])
 setFactText('')
 setSourceUrl('')
 setLookupValue('')
 setSuccess('Verified fact added.')
 } catch (submissionError) {
 setError(submissionError instanceof Error ? submissionError.message : 'Failed to create verified fact.')
 } finally {
 setIsSubmitting(false)
 }
 }

 async function handleDelete(id: string) {
 setDeletingId(id)
 setError('')
 try {
 const res = await fetch(`/api/verified-facts/${id}`, { method: 'DELETE' })
 if (!res.ok) {
 const body = await res.json().catch(() => ({}))
 throw new Error(body.error || 'Failed to delete fact.')
 }
 setFacts((prev) => prev.filter((fact) => fact.id !== id))
 } catch (deleteError) {
 setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete fact.')
 } finally {
 setDeletingId(null)
 }
 }

 return (
 <div className="space-y-8">
 <form onSubmit={handleSubmit} className="gl-panel p-6 space-y-4">
 <h2 className="greenlist-card-title">Add a verified fact</h2>

 <fieldset className="flex gap-4">
 <legend className="sr-only">Subject type</legend>
 <label className="flex items-center gap-2 text-sm text-[var(--gl-text-secondary)]">
 <input type="radio" checked={subjectType === 'user'} onChange={() => setSubjectType('user')} />
 User
 </label>
 <label className="flex items-center gap-2 text-sm text-[var(--gl-text-secondary)]">
 <input type="radio" checked={subjectType === 'business'} onChange={() => setSubjectType('business')} />
 Business
 </label>
 </fieldset>

 <label className="block space-y-1.5 text-sm font-medium text-[var(--gl-text)]">
 {subjectType === 'user' ? 'Username or user ID (UUID)' : 'Business slug or ID (UUID)'}
 <input
 className="h-11 w-full border border-[var(--gl-border)] bg-[var(--gl-ink)] px-3 text-sm text-[var(--gl-text)]"
 value={lookupValue}
 onChange={(event) => setLookupValue(event.target.value)}
 placeholder={subjectType === 'user' ? 'e.g. janedoe' : 'e.g. green-valley-farms'}
 required
 />
 </label>

 <label className="block space-y-1.5 text-sm font-medium text-[var(--gl-text)]">
 Fact text
 <textarea
 className="min-h-24 w-full border border-[var(--gl-border)] bg-[var(--gl-ink)] px-3 py-2 text-sm text-[var(--gl-text)]"
 value={factText}
 onChange={(event) => setFactText(event.target.value)}
 placeholder="e.g. Holds an active state cultivation license (#12345), verified against state records."
 required
 />
 </label>

 <div className="grid gap-4 sm:grid-cols-2">
 <label className="block space-y-1.5 text-sm font-medium text-[var(--gl-text)]">
 Category
 <input
 className="h-11 w-full border border-[var(--gl-border)] bg-[var(--gl-ink)] px-3 text-sm text-[var(--gl-text)]"
 value={category}
 onChange={(event) => setCategory(event.target.value)}
 placeholder="general"
 />
 </label>
 <label className="block space-y-1.5 text-sm font-medium text-[var(--gl-text)]">
 Source URL (optional)
 <input
 className="h-11 w-full border border-[var(--gl-border)] bg-[var(--gl-ink)] px-3 text-sm text-[var(--gl-text)]"
 value={sourceUrl}
 onChange={(event) => setSourceUrl(event.target.value)}
 placeholder="https://…"
 />
 </label>
 </div>

 {error ? (
 <p role="alert" className="gl-notice gl-notice--alert">
 {error}
 </p>
 ) : null}
 {success ? (
 <p role="status" className="gl-notice gl-notice--confirmed">
 {success}
 </p>
 ) : null}

 <button
 type="submit"
 disabled={isSubmitting}
 className="greenlist-primary-button disabled:opacity-50"
 >
 {isSubmitting ? 'Adding…' : 'Add verified fact'}
 </button>
 </form>

 <div className="gl-panel">
 <div className="gl-panel__head">
 <h2 className="greenlist-card-title">Recent verified facts</h2>
 </div>
 {facts.length === 0 ? (
 <p className="p-6 text-sm text-[var(--gl-text-muted)]">No verified facts yet.</p>
 ) : (
 <ul className="divide-y divide-[var(--gl-border)]">
 {facts.map((fact) => (
 <li key={fact.id} className="flex items-start justify-between gap-4 p-4">
 <div>
 <div className="flex items-center gap-2 text-xs text-[var(--gl-text-muted)]">
 <span className="gl-status gl-status--confirmed">
 {fact.category}
 </span>
 <span>{fact.subject_user_id ? `user:${fact.subject_user_id.slice(0, 8)}` : `business:${fact.subject_business_id?.slice(0, 8)}`}</span>
 <span>{formatDate(fact.verified_at)}</span>
 </div>
 <p className="mt-1 text-sm text-[var(--gl-text)]">{fact.fact_text}</p>
 {fact.source_url ? (
 <a href={fact.source_url} target="_blank" rel="noopener noreferrer nofollow" className="mt-1 inline-block text-xs gl-link">
 {fact.source_url}
 </a>
 ) : null}
 </div>
 <button
 type="button"
 onClick={() => handleDelete(fact.id)}
 disabled={deletingId === fact.id}
 className="greenlist-quiet-button disabled:opacity-50"
 >
 <Trash2 className="h-3.5 w-3.5" />
 Delete
 </button>
 </li>
 ))}
 </ul>
 )}
 </div>
 </div>
 )
}
