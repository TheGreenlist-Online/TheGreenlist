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
    <div className="rounded-xl border border-white/[.09] bg-brand-panel">
      <div className="border-b border-white/10 p-4">
        <h2 className="text-lg font-semibold text-zinc-100">Pending documents</h2>
      </div>

      {error ? <div className="border-b border-red-400/20 bg-red-950/20 px-4 py-2 text-sm text-red-200">{error}</div> : null}

      {documents.length === 0 ? (
        <p className="p-6 text-sm text-zinc-500">No pending documents to review.</p>
      ) : (
        <ul className="divide-y divide-white/[.06]">
          {documents.map((doc) => (
            <li key={doc.id} className="p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2 py-0.5 font-semibold uppercase tracking-[0.1em] text-emerald-200">
                  {doc.doc_type.replace(/_/g, ' ')}
                </span>
                <span>{doc.business_profiles?.name ?? doc.business_id.slice(0, 8)}</span>
                <span>{formatDate(doc.created_at)}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-zinc-200">{doc.title}</p>
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-1 inline-block text-xs text-emerald-300 hover:underline"
              >
                View file
              </a>

              <textarea
                className="mt-3 h-20 w-full rounded-lg border border-white/10 bg-black/25 p-3 text-sm text-zinc-200 focus:border-emerald-300/50 focus:outline-none"
                placeholder="Optional review note…"
                value={notesDraft[doc.id] ?? ''}
                onChange={(event) => setNotesDraft((prev) => ({ ...prev, [doc.id]: event.target.value }))}
              />

              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={processingId === doc.id}
                  onClick={() => review(doc.id, 'approved')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300/35 bg-emerald-950/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-emerald-200 hover:bg-emerald-900/40 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={processingId === doc.id}
                  onClick={() => review(doc.id, 'rejected')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-400/35 bg-red-950/25 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-red-200 hover:bg-red-900/40 disabled:opacity-50"
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
