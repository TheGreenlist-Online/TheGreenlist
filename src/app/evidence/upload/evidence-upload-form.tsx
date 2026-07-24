'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

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
  const [reportType, setReportType] = useState('consumer_concern')
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
    <div className="mx-auto max-w-3xl">
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>Evidence Upload Center</CardTitle>
          <CardDescription>
            Signed in securely. Attach files to one of your reports or create a new report with this evidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            {reportsLoadError ? (
              <p role="alert" className="rounded-lg border border-amber-400/40 bg-amber-950/30 p-3 text-sm text-amber-100">
                {reportsLoadError}
              </p>
            ) : null}

            {reports.length ? (
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-foreground">Report destination</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-primary/30 p-4">
                    <input
                      type="radio"
                      name="report-mode"
                      checked={reportMode === 'existing'}
                      onChange={() => setReportMode('existing')}
                    />
                    <span>
                      <span className="block font-semibold">Existing report</span>
                      <span className="text-xs text-muted-foreground">Add evidence to a report you already filed.</span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-primary/30 p-4">
                    <input
                      type="radio"
                      name="report-mode"
                      checked={reportMode === 'new'}
                      onChange={() => setReportMode('new')}
                    />
                    <span>
                      <span className="block font-semibold">New report</span>
                      <span className="text-xs text-muted-foreground">Create the report and attach evidence together.</span>
                    </span>
                  </label>
                </div>
              </fieldset>
            ) : null}

            {reportMode === 'existing' ? (
              <label className="block space-y-2 text-sm font-medium" htmlFor="report-id">
                Choose a report
                <select
                  id="report-id"
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={selectedReportId}
                  onChange={(event) => setSelectedReportId(event.target.value)}
                  required
                >
                  {reports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.title} — {report.status.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="space-y-4 rounded-lg border border-primary/25 p-4">
                <h2 className="font-semibold">New report context</h2>
                <label className="block space-y-2 text-sm font-medium" htmlFor="report-type">
                  Report type
                  <select
                    id="report-type"
                    className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={reportType}
                    onChange={(event) => setReportType(event.target.value)}
                  >
                    <option value="consumer_concern">Consumer concern</option>
                    <option value="product_safety">Product safety</option>
                    <option value="business_conduct">Business conduct</option>
                    <option value="compliance_concern">Compliance concern</option>
                    <option value="platform_issue">Platform issue</option>
                    <option value="other">Other accountability matter</option>
                  </select>
                </label>
                <label className="block space-y-2 text-sm font-medium" htmlFor="report-title">
                  Report title
                  <Input
                    id="report-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    minLength={8}
                    maxLength={160}
                    required
                    placeholder="Briefly identify the concern"
                  />
                </label>
                <label className="block space-y-2 text-sm font-medium" htmlFor="report-description">
                  What happened?
                  <textarea
                    id="report-description"
                    className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    minLength={20}
                    maxLength={5000}
                    required
                    placeholder="Describe the facts, dates, location, and why the attached evidence matters."
                  />
                </label>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={isAnonymous}
                    onChange={(event) => setIsAnonymous(event.target.checked)}
                  />
                  <span>
                    <span className="block font-medium">Request public anonymity</span>
                    <span className="text-muted-foreground">
                      Authorized reviewers can still identify the submitting account for safety and due process.
                    </span>
                  </span>
                </label>
              </div>
            )}

            <label className="block space-y-2 text-sm font-medium" htmlFor="evidence-files">
              Evidence files
              <Input
                id="evidence-files"
                type="file"
                multiple
                required
                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.txt,image/jpeg,image/png,image/webp,image/gif,application/pdf,text/plain"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
              <span className="block text-xs font-normal text-muted-foreground">
                Up to {MAX_FILES} JPG, PNG, WebP, GIF, PDF, or TXT files. Maximum 15 MB each.
              </span>
            </label>

            {files.length ? (
              <ul className="space-y-2 rounded-lg border border-primary/20 p-3 text-sm" aria-label="Selected files">
                {files.map((file) => (
                  <li key={`${file.name}-${file.lastModified}`} className="flex justify-between gap-4">
                    <span className="truncate">{file.name}</span>
                    <span className="shrink-0 text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="rounded-lg border border-primary/20 bg-black/15 p-4 text-sm text-muted-foreground">
              Evidence is stored in a private bucket. Only you and authorized platform reviewers can access it.
              Do not upload passwords, payment-card details, or unrelated private information.
            </div>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            {success ? (
              <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-950/35 p-4 text-sm text-emerald-100">
                <p className="font-semibold">
                  {success.fileCount} {success.fileCount === 1 ? 'file was' : 'files were'} uploaded securely.
                </p>
                <p className="mt-1">Report reference: {success.reportId}</p>
                <Link className="mt-3 inline-block font-semibold text-accent hover:underline" href="/dashboard">
                  Return to dashboard
                </Link>
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Uploading securely…' : 'Submit Evidence for Review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          ['Private by default', 'Files are not exposed through public URLs.'],
          ['Human review', 'Evidence is reviewed before any public action.'],
          ['Anonymity controls', 'Public attribution stays separate from reviewer access.'],
        ].map(([titleText, body]) => (
          <Card key={titleText} className="border-primary/30">
            <CardHeader>
              <CardTitle className="text-base">{titleText}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
