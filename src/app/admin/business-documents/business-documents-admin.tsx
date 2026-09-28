'use client'

import { useState } from 'react'
import { Check, X } from 'lucide-react'

type BusinessDocumentRow = {
 id: string
 business_id: string
 title: string
 doc_type: string
 file_url: string
 status: string
 review_note: string | null
 created_at: string
 business_profiles?: { name: string | null; slug: string | null } | null
}

function formatDate(dateString: string) {
 try {
 return new Date(dateString).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
 } catch {
 return dateString
 }
}

export function BusinessDocumentsAdmin({ initialDocuments }: { initialDocuments: BusinessDocumentRow[] }) {
 const [documents, setDocuments] = useState<BusinessDocumentRow[]>(initialDocuments)
 const [notesDraft, setNotesDraft] = useState<Record<string, string>>({})
 const [processingId, setProcessingId] = useState<string | null>(null)
 const [error, setError] = useState('')

 async function review(id: string, status: 'approved' | 'rejected') {
 setProcessingId(id)
 setError('')
 try {
 const res = await fetch('/api/admin/business-documents', {
 method: 'PATCH',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ id, status, review_note: notesDraft[id] ?? null }),
 })
 if (!res.ok) {
 const body = await res.json().catch(() => ({}))
 throw new Error(body.error || 'Failed to update document.')
 }
 setDocuments((prev) => prev.filter((doc) => doc.id !== id))
 } catch (reviewError) {
 setError(reviewError instanceof Error ? reviewError.message : 'Failed to update document.')
 } finally {
 setProcessingId(null)
 }
 }

 return (
 <div className="gl-panel">
 <div className="gl-panel__head">
 <h2 className="greenlist-card-title">Pending documents</h2>
 </div>

 {error ? <div className="gl-notice gl-notice--alert rounded-none border-x-0 border-t-0">{error}</div> : null}

 {documents.length === 0 ? (
 <p className="p-6 text-sm text-[var(--gl-text-muted)]">No pending documents to review.</p>
 ) : (
 <ul className="divide-y divide-[var(--gl-border)]">
 {documents.map((doc) => (
 <li key={doc.id} className="p-4">
 <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--gl-text-muted)]">
 <span className="gl-status gl-status--confirmed">
 {doc.doc_type.replace(/_/g, ' ')}
 </span>
 <span>{doc.business_profiles?.name ?? doc.business_id.slice(0, 8)}</span>
 <span>{formatDate(doc.created_at)}</span>
 </div>
 <p className="mt-1 text-sm font-medium text-[var(--gl-text)]">{doc.title}</p>
 <a
 href={doc.file_url}
 target="_blank"
 rel="noopener noreferrer nofollow"
 className="mt-1 inline-block text-xs gl-link"
 >
 View file
 </a>

 <textarea
 className="gl-textarea mt-3 h-20"
 placeholder="Optional review note…"
 value={notesDraft[doc.id] ?? ''}
 onChange={(event) => setNotesDraft((prev) => ({ ...prev, [doc.id]: event.target.value }))}
 />

 <div className="mt-2 flex gap-2">
 <button
 type="button"
 disabled={processingId === doc.id}
 onClick={() => review(doc.id, 'approved')}
 className="greenlist-secondary-button disabled:opacity-50"
 >
 <Check className="h-3.5 w-3.5" />
 Approve
 </button>
 <button
 type="button"
 disabled={processingId === doc.id}
 onClick={() => review(doc.id, 'rejected')}
 className="greenlist-quiet-button disabled:opacity-50"
 >
 <X className="h-3.5 w-3.5" />
 Reject
 </button>
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>
 )
}
