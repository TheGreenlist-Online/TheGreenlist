'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Field, FormActions, Ledger, Notice, Select, Textarea } from '@/components/record'
import { recordStatus } from '@/lib/recordStatus'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { REPORT_TYPES } from '@/lib/report-types'

const EVIDENCE_BUCKET = 'evidence'
const MAX_FILE_SIZE = 15 * 1024 * 1024
const MAX_FILES = 5
const ALLOWED_FILE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
])

export type EvidenceReportOption = {
  id: string
  title: string
  status: string
  createdAt: string
}

type EvidenceUploadFormProps = {
  userId: string
  reports: EvidenceReportOption[]
  reportsLoadError: string | null
}

type UploadResult = {
  fileName: string
  storagePath: string
  fileType: string
  fileSize: number
}

function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? 'evidence'
  const cleaned = baseName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120)

  return cleaned || 'evidence'
}

function validateFiles(files: File[]) {
  if (files.length === 0) return 'Select at least one file.'
  if (files.length > MAX_FILES) return `Upload no more than ${MAX_FILES} files at a time.`

  for (const file of files) {
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return `${file.name} is not an accepted file type.`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `${file.name} is larger than 15 MB.`
    }
  }

  return null
}

export function EvidenceUploadForm({
  userId,
  reports,
  reportsLoadError,
}: EvidenceUploadFormProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [reportMode, setReportMode] = useState<'existing' | 'new'>(reports.length ? 'existing' : 'new')
  const [selectedReportId, setSelectedReportId] = useState(reports[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reportType, setReportType] = useState('mislabeling')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ reportId: string; fileCount: number } | null>(null)

  async function removeUploadedFiles(paths: string[]) {
    if (paths.length) {
      await supabase.storage.from(EVIDENCE_BUCKET).remove(paths)
    }
  }

  async function uploadFiles(reportId: string): Promise<UploadResult[]> {
    const uploaded: UploadResult[] = []

    for (const file of files) {
      const storagePath = `${userId}/${reportId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
      const { error: uploadError } = await supabase.storage
        .from(EVIDENCE_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        await removeUploadedFiles(uploaded.map((item) => item.storagePath))
        throw new Error(`Upload failed for ${file.name}: ${uploadError.message}`)
      }

      uploaded.push({
        fileName: file.name.slice(0, 255),
        storagePath,
        fileType: file.type,
        fileSize: file.size,
      })
    }

    return uploaded
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(null)

    const fileError = validateFiles(files)
    if (fileError) {
      setError(fileError)
      return
    }

    if (reportMode === 'existing' && !selectedReportId) {
      setError('Choose the report these files support.')
      return
    }

    if (reportMode === 'new' && (title.trim().length < 8 || description.trim().length < 20)) {
      setError('A new report needs a title of at least 8 characters and a description of at least 20 characters.')
      return
    }

    setIsSubmitting(true)

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user || user.id !== userId) {
        throw new Error('Your session expired. Sign in again before uploading evidence.')
      }

      let reportId = selectedReportId

      if (reportMode === 'new') {
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .insert({
            reporter_id: user.id,
            report_type: reportType,
            title: title.trim(),
            description: description.trim(),
            is_anonymous: isAnonymous,
            status: 'submitted',
            verification_status: 'unverified',
          })
          .select('id')
          .single<{ id: string }>()

        if (reportError || !report) {
          throw new Error(reportError?.message ?? 'The report could not be created.')
        }

        reportId = report.id
      }

      const uploaded = await uploadFiles(reportId)
      const evidenceRows = uploaded.map((file) => ({
        owner_id: user.id,
        report_id: reportId,
        storage_bucket: EVIDENCE_BUCKET,
        storage_path: file.storagePath,
        file_name: file.fileName,
        file_type: file.fileType,
        file_size: file.fileSize,
        metadata_stripped: false,
        visibility: 'private',
      }))

      const { error: evidenceError } = await supabase.from('evidence_files').insert(evidenceRows)

      if (evidenceError) {
        await removeUploadedFiles(uploaded.map((item) => item.storagePath))
        throw new Error(`The files were not attached to the report: ${evidenceError.message}`)
      }

      setFiles([])
      setTitle('')
      setDescription('')
      setSuccess({ reportId, fileCount: uploaded.length })
      const fileInput = document.getElementById('evidence-files') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Evidence could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">
      <form className="gl-panel" onSubmit={handleSubmit}>
        <div className="gl-panel__head">
          <h2>Evidence submission</h2>
          <span className="gl-meta">
            <span>Signed in</span>
            <span>Private storage</span>
          </span>
        </div>
        <div className="gl-panel__body">
          {reportsLoadError ? (
            <Notice tone="review" className="mb-5">
              {reportsLoadError}
            </Notice>
          ) : null}

          {reports.length ? (
            <fieldset className="gl-field">
              <legend className="gl-label">Attach to</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer gap-3 border border-[var(--gl-border)] p-4 text-sm">
                  <input type="radio" name="report-mode" checked={reportMode === 'existing'} onChange={() => setReportMode('existing')} />
                  <span>
                    <span className="block font-medium text-[var(--gl-text)]">Existing report</span>
                    <span className="text-[var(--gl-text-muted)]">Add documentation to a report you already filed.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer gap-3 border border-[var(--gl-border)] p-4 text-sm">
                  <input type="radio" name="report-mode" checked={reportMode === 'new'} onChange={() => setReportMode('new')} />
                  <span>
                    <span className="block font-medium text-[var(--gl-text)]">New report</span>
                    <span className="text-[var(--gl-text-muted)]">Open the report and attach documentation together.</span>
                  </span>
                </label>
              </div>
            </fieldset>
          ) : null}

          {reportMode === 'existing' ? (
            <Field label="Report" htmlFor="report-id">
              <Select id="report-id" value={selectedReportId} onChange={(event) => setSelectedReportId(event.target.value)} required>
                {reports.map((report) => (
                  <option key={report.id} value={report.id}>
                    {report.title} — {recordStatus(report.status).label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="mt-3 border border-[var(--gl-border)] p-4">
              <p className="gl-label mb-3">New report</p>
              <Field label="Report type" htmlFor="report-type">
                <Select id="report-type" value={reportType} onChange={(event) => setReportType(event.target.value)}>
                  {REPORT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Report title" htmlFor="report-title" required help="Identify the matter in one line. 8–160 characters.">
                <Input id="report-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={8} maxLength={160} required />
              </Field>
              <Field label="Account" htmlFor="report-description" required help="Facts, dates, location, and what the attached documentation shows. 20–5,000 characters.">
                <Textarea id="report-description" className="min-h-32" value={description} onChange={(event) => setDescription(event.target.value)} minLength={20} maxLength={5000} required />
              </Field>
              <label className="mt-3 flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
                <input type="checkbox" className="mt-1" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
                <span>
                  <span className="block font-medium text-[var(--gl-text)]">Request public anonymity</span>
                  <span>Authorised reviewers can still identify the submitting account for safety and due process.</span>
                </span>
              </label>
            </div>
          )}

          <Field label="Files" htmlFor="evidence-files" required help={`Up to ${MAX_FILES} JPG, PNG, WebP, GIF, PDF, or TXT files. Maximum 15 MB each.`}>
            <Input
              id="evidence-files"
              type="file"
              multiple
              required
              accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </Field>

          {files.length ? (
            <ul className="mt-3 grid gap-1 border border-[var(--gl-border)] p-3 text-sm" aria-label="Selected files">
              {files.map((file) => (
                <li key={`${file.name}-${file.lastModified}`} className="flex justify-between gap-4">
                  <span className="truncate text-[var(--gl-text)]">{file.name}</span>
                  <span className="shrink-0 text-[var(--gl-text-muted)]">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </li>
              ))}
            </ul>
          ) : null}

          <Notice tone="info" className="mt-5">
            Files are stored in a private bucket. Only you and authorised reviewers can access them. Do not upload passwords, payment-card details, or unrelated private information.
          </Notice>

          {error ? (
            <Notice tone="alert" className="mt-4">
              {error}
            </Notice>
          ) : null}

          {success ? (
            <Notice tone="confirmed" className="mt-4" role="status">
              <strong>
                {success.fileCount} {success.fileCount === 1 ? 'file' : 'files'} received.
              </strong>{' '}
              Report reference: {success.reportId}.{' '}
              <Link className="gl-link" href="/dashboard">
                Return to your desk
              </Link>
            </Notice>
          ) : null}

          <FormActions>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading…' : 'Submit for review'}
            </Button>
          </FormActions>
        </div>
      </form>

      <Ledger
        title="Handling"
        className="content-start"
        rows={[
          { label: 'Private by default', value: 'Files are not exposed through public URLs.' },
          { label: 'Human review', value: 'Documentation is reviewed before any public action.' },
          { label: 'Anonymity', value: 'Public attribution is separate from reviewer access.' },
          { label: 'Reference', value: 'Quote the report reference in any follow-up.' },
        ]}
      />
    </div>
  )
}
