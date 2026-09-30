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
 <li className="border border-[var(--gl-border)] bg-[var(--gl-ink)] p-4">
 <div className="flex flex-wrap items-center gap-2">
 <span className="gl-status gl-status--confirmed">
 <FileText className="h-3 w-3" />
 {formatDocType(doc.doc_type)}
 </span>
 {showStatus ? <StatusBadge status={statusToTone(doc.status)} /> : null}
 </div>
 <p className="mt-2 text-sm font-medium text-[var(--gl-text)]">{doc.title}</p>
 {doc.status === 'approved' ? (
 <a
 href={doc.file_url}
 target="_blank"
 rel="noopener noreferrer nofollow"
 className="mt-2 inline-block text-xs font-semibold gl-link"
 >
 View document →
 </a>
 ) : null}
 {doc.review_note ? (
 <p className="mt-2 text-xs text-[var(--gl-text-muted)]">Reviewer note: {doc.review_note}</p>
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
 <p className="mt-1 text-xs text-[var(--gl-text-muted)]">Licenses, lab results, and permits verified by Green List admins.</p>

 {approvedDocs.length === 0 ? (
 <p className="mt-4 text-sm text-[var(--gl-text-muted)]">No approved documents yet.</p>
 ) : (
 <ul className="mt-4 space-y-3">
 {approvedDocs.map((doc) => (
 <DocumentRow key={doc.id} doc={doc} showStatus={false} />
 ))}
 </ul>
 )}

 {isOwner ? (
 <div className="mt-6 border-t border-[var(--gl-border)] pt-6">
 <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--gl-status-review)]">Owner-only: your submissions</p>
 {pendingOrRejected.length === 0 ? (
 <p className="mt-3 text-sm text-[var(--gl-text-muted)]">You have no pending or rejected documents.</p>
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
 className="greenlist-secondary-button mt-4"
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
