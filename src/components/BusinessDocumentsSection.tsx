'use client'

import { useState } from 'react'
import { FileText, Upload } from 'lucide-react'
import { OrnatePanel } from '@/components/OrnatePanel'
import { StatusBadge } from '@/components/StatusBadge'
import { BusinessDocumentUploadForm } from '@/components/BusinessDocumentUploadForm'

export type BusinessDocument = {
  id: string
  title: string
  doc_type: string
  file_url: string
  status: string
  review_note: string | null
  created_at: string
}

function formatDocType(docType: string) {
  return docType.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function statusToTone(status: string): 'pending' | 'verified' | 'unverified' {
  if (status === 'approved') return 'verified'
  if (status === 'pending_review') return 'pending'
  return 'unverified'
}

function DocumentRow({ doc, showStatus }: { doc: BusinessDocument; showStatus: boolean }) {
  return (
    <li className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-200">
          <FileText className="h-3 w-3" />
          {formatDocType(doc.doc_type)}
        </span>
        {showStatus ? <StatusBadge status={statusToTone(doc.status)} /> : null}
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-200">{doc.title}</p>
      {doc.status === 'approved' ? (
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-2 inline-block text-xs font-semibold text-emerald-300 hover:underline"
        >
          View document →
        </a>
      ) : null}
      {doc.review_note ? (
        <p className="mt-2 text-xs text-zinc-500">Reviewer note: {doc.review_note}</p>
      ) : null}
    </li>
  )
}

export function BusinessDocumentsSection({
  businessId,
  slug,
  approvedDocs,
  ownDocs,
  isOwner,
}: {
  businessId: string
  slug: string
  approvedDocs: BusinessDocument[]
  ownDocs: BusinessDocument[]
  isOwner: boolean
}) {
  const [showUploadForm, setShowUploadForm] = useState(false)
  const pendingOrRejected = ownDocs.filter((doc) => doc.status !== 'approved')

  return (
    <OrnatePanel>
      <p className="greenlist-eyebrow">Legal &amp; compliance documents</p>
      <p className="mt-1 text-xs text-zinc-500">Licenses, lab results, and permits verified by Green List admins.</p>

      {approvedDocs.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No approved documents yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {approvedDocs.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} showStatus={false} />
          ))}
        </ul>
      )}

      {isOwner ? (
        <div className="mt-6 border-t border-white/10 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200">Owner-only: your submissions</p>
          {pendingOrRejected.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">You have no pending or rejected documents.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {pendingOrRejected.map((doc) => (
                <DocumentRow key={doc.id} doc={doc} showStatus />
              ))}
            </ul>
          )}

          <button
            type="button"
            onClick={() => setShowUploadForm((prev) => !prev)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-200 hover:border-emerald-300/60"
          >
            <Upload className="h-4 w-4" />
            {showUploadForm ? 'Cancel' : 'Upload Document'}
          </button>

          {showUploadForm ? <BusinessDocumentUploadForm businessId={businessId} slug={slug} /> : null}
        </div>
      ) : null}
    </OrnatePanel>
  )
}
