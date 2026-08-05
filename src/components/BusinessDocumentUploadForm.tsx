'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const DOCUMENTS_BUCKET = 'business-documents'
const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])

const DOC_TYPES: { value: string; label: string }[] = [
  { value: 'license', label: 'License' },
  { value: 'lab_result', label: 'Lab result' },
  { value: 'permit', label: 'Permit' },
  { value: 'other', label: 'Other' },
]

function sanitizeFileName(fileName: string) {
  const baseName = fileName.split(/[\\/]/).pop() ?? 'document'
  const cleaned = baseName
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120)
  return cleaned || 'document'
}

export function BusinessDocumentUploadForm({ businessId, slug }: { businessId: string; slug: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('license')
  const [file, setFile] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(false)

    if (!file) {
      setError('Select a file to upload.')
      return
    }
    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      setError('Only PDF, JPG, PNG, or WebP files are accepted.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('File is larger than 15 MB.')
      return
    }
    if (title.trim().length === 0) {
      setError('Document title is required.')
      return
    }

    setIsSubmitting(true)
    let storagePath = ''

    try {
      storagePath = `${businessId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`

      const { error: uploadError } = await supabase.storage
        .from(DOCUMENTS_BUCKET)
        .upload(storagePath, file, {
          cacheControl: '3600',
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      const response = await fetch(`/api/businesses/${slug}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          doc_type: docType,
          file_url: storagePath,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to submit the document for review.')
      }

      setTitle('')
      setFile(null)
      const fileInput = document.getElementById('business-document-file') as HTMLInputElement | null
      if (fileInput) fileInput.value = ''
      setSuccess(true)
      router.refresh()
    } catch (submissionError) {
      if (storagePath) {
        await supabase.storage.from(DOCUMENTS_BUCKET).remove([storagePath])
      }
      setError(submissionError instanceof Error ? submissionError.message : 'The document could not be uploaded.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="mt-4 space-y-4 rounded-lg border border-white/10 bg-black/20 p-4" onSubmit={handleSubmit}>
      <label className="block space-y-1.5 text-sm font-medium text-zinc-200" htmlFor="business-document-title">
        Document title
        <Input
          id="business-document-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="e.g. State cultivation license"
          maxLength={160}
          required
        />
      </label>

      <label className="block space-y-1.5 text-sm font-medium text-zinc-200" htmlFor="business-document-type">
        Document type
        <select
          id="business-document-type"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm text-zinc-100"
          value={docType}
          onChange={(event) => setDocType(event.target.value)}
        >
          {DOC_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1.5 text-sm font-medium text-zinc-200" htmlFor="business-document-file">
        File
        <Input
          id="business-document-file"
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
        <span className="block text-xs font-normal text-zinc-500">PDF, JPG, PNG, or WebP. Maximum 15 MB.</span>
      </label>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-950/35 p-3 text-sm text-emerald-100">
          Document submitted for admin review.
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Uploading…' : 'Submit for review'}
      </Button>
    </form>
  )
}
