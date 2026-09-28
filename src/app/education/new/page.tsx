'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Field, FormActions, Input, Ledger, LimitationsPanel, Notice, Panel, Select, Textarea } from '@/components/record'
import { EDUCATION_CATEGORIES } from '@/lib/educationCategories'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useDraftAutosave } from '@/hooks/useDraftAutosave'

const categories = Object.entries(EDUCATION_CATEGORIES).map(([value, meta]) => ({ value, title: meta.label, description: meta.scope }))

const STANDARDS = [
  { label: 'Evidence-led', value: 'Use primary sources, public records, or published research. Firsthand experience must be identified as such.' },
  { label: 'Accessible', value: 'Explain technical terms and give practical context for a general reader.' },
  { label: 'Non-commercial', value: 'Resources are not advertising, product promotion, or a sales funnel. Promotional submissions are not published.' },
  { label: 'Dated and scoped', value: 'Include dates, jurisdictions, and source links wherever regulations or findings may change.' },
  { label: 'Reviewed before publication', value: 'New submissions are held as Pending review. Publication does not constitute legal or medical endorsement.' },
]

const EDUCATION_BUCKET = 'education-materials'
const MAX_FILES = 5
const MAX_FILE_SIZE = 15 * 1024 * 1024
const ALLOWED_FILE_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'])

function sanitizeFileName(fileName: string) {
  return (fileName.split(/[\\/]/).pop() ?? 'material')
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '')
    .slice(0, 120) || 'material'
}

export default function EducationNewPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [category, setCategory] = useState('SAFETY_GUIDE')
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [sources, setSources] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [restoredAt, setRestoredAt] = useState<Date | null>(null)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  type EducationDraft = {
    category: string
    title: string
    summary: string
    content: string
    sources: string
  }

  const { savedAt, isSaving, clearDraft, loadDraft } = useDraftAutosave<EducationDraft>(
    'education_resource',
    { category, title, summary, content, sources },
    { enabled: !checkingSession && Boolean(userId) }
  )

  useEffect(() => {
    if (checkingSession || !userId) return
    let mounted = true
    loadDraft().then((draft) => {
      if (!mounted || !draft) return
      if (draft.category) setCategory(draft.category)
      if (draft.title) setTitle(draft.title)
      if (draft.summary) setSummary(draft.summary)
      if (draft.content) setContent(draft.content)
      if (draft.sources) setSources(draft.sources)
      setRestoredAt(new Date())
      setShowRestoredBanner(true)
    })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkingSession, userId])

  useEffect(() => {
    let mounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setUserId(data.session?.user.id ?? null)
      setCheckingSession(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUserId(session?.user.id ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!userId) {
      setError('Sign in before submitting a resource.')
      return
    }

    if (files.length > MAX_FILES) {
      setError(`Upload no more than ${MAX_FILES} supporting files.`)
      return
    }
    const invalidFile = files.find((file) => !ALLOWED_FILE_TYPES.has(file.type) || file.size > MAX_FILE_SIZE)
    if (invalidFile) {
      setError(`${invalidFile.name} must be a PDF, JPG, PNG, WebP, or TXT file no larger than 15 MB.`)
      return
    }

    setSubmitting(true)
    const sourceUrls = sources.split('\n').map((item) => item.trim()).filter(Boolean)
    const { data: resource, error: insertError } = await supabase.from('education_resources').insert({
      submitter_id: userId,
      category,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      source_urls: sourceUrls,
      status: 'PENDING_REVIEW',
    }).select('id').single<{ id: string }>()

    if (insertError || !resource) {
      setSubmitting(false)
      setError(insertError?.message || 'Your submission could not be saved.')
      return
    }

    const uploadedPaths: string[] = []
    try {
      const attachments = []
      for (const file of files) {
        const storagePath = `${userId}/${resource.id}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`
        const { error: uploadError } = await supabase.storage.from(EDUCATION_BUCKET).upload(storagePath, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false,
        })
        if (uploadError) throw uploadError
        uploadedPaths.push(storagePath)
        attachments.push({
          resource_id: resource.id,
          uploader_id: userId,
          storage_bucket: EDUCATION_BUCKET,
          storage_path: storagePath,
          file_name: file.name.slice(0, 255),
          file_type: file.type,
          file_size: file.size,
        })
      }
      if (attachments.length) {
        const { error: attachmentError } = await supabase.from('education_attachments').insert(attachments)
        if (attachmentError) throw attachmentError
      }
    } catch (attachmentError) {
      if (uploadedPaths.length) await supabase.storage.from(EDUCATION_BUCKET).remove(uploadedPaths)
      setSubmitting(false)
      setError(attachmentError instanceof Error ? attachmentError.message : 'Supporting materials could not be uploaded.')
      return
    }

    setSubmitting(false)

    setTitle('')
    setSummary('')
    setContent('')
    setSources('')
    setFiles([])
    const fileInput = document.getElementById('education-materials') as HTMLInputElement | null
    if (fileInput) fileInput.value = ''
    await clearDraft()
    setMessage('Submission received. It is held as Pending review and will not be published until a reviewer has checked its sourcing.')
  }

  return (
    <PageShell>
      <PageIntro
        eyebrow="Learn"
        title="Submit a resource"
        lede="Submit an explainer, regulatory resource, worker-rights guide, or research summary. Every submission is held for review of accuracy and sourcing before it is published."
        meta={
          <>
            <span>Held for review</span>
            <span>Sources required</span>
          </>
        }
        actions={
          <Link href="/education" className="greenlist-quiet-button">
            Published resources
          </Link>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,.8fr)]">
        <form onSubmit={handleSubmit} className="gl-panel">
          <div className="gl-panel__head">
            <h2>Resource submission</h2>
            <span className="gl-meta">
              {isSaving ? <span>Saving draft…</span> : savedAt ? <span>Draft saved {formatDistanceToNow(savedAt, { addSuffix: true })}</span> : <span>Draft autosaves</span>}
            </span>
          </div>
          <div className="gl-panel__body">
            {!checkingSession && !userId ? (
              <Notice tone="review" className="mb-5">
                You are not signed in. The form stays visible so you can see what is required, but submission requires an account.{' '}
                <Link className="gl-link" href="/auth/signin?callbackUrl=/education/new">
                  Sign in
                </Link>
                .
              </Notice>
            ) : null}

            {showRestoredBanner && restoredAt ? (
              <Notice tone="info" className="mb-5">
                <span className="flex items-start justify-between gap-3">
                  <span>Unsaved draft restored from {formatDistanceToNow(restoredAt, { addSuffix: true })}.</span>
                  <button type="button" onClick={() => setShowRestoredBanner(false)} className="gl-link shrink-0 text-xs" aria-label="Dismiss">
                    Dismiss
                  </button>
                </span>
              </Notice>
            ) : null}

            <Field label="Category" htmlFor="education-category" help={categories.find((item) => item.value === category)?.description}>
              <Select id="education-category" value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.title}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Title" htmlFor="education-title" required help="Specific and factual. 8–160 characters.">
              <Input id="education-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={8} maxLength={160} required />
            </Field>

            <Field label="Summary" htmlFor="education-summary" required help="What the reader will learn. 20–500 characters.">
              <Textarea id="education-summary" className="min-h-24" value={summary} onChange={(event) => setSummary(event.target.value)} minLength={20} maxLength={500} required />
            </Field>

            <Field label="Full resource" htmlFor="education-content" required help="Separate documented facts, interpretation, and firsthand experience. 100–20,000 characters.">
              <Textarea id="education-content" className="min-h-64" value={content} onChange={(event) => setContent(event.target.value)} minLength={100} maxLength={20000} required />
            </Field>

            <Field label="Source links" htmlFor="education-sources" help="One URL per line. Primary sources preferred.">
              <Textarea id="education-sources" className="min-h-24" value={sources} onChange={(event) => setSources(event.target.value)} placeholder={'https://agency.gov/resource\nhttps://journal.org/study'} />
            </Field>

            <Field label="Supporting materials" htmlFor="education-materials" help="Optional. Up to 5 files, 15 MB each. PDF, JPG, PNG, WebP, or TXT.">
              <Input
                id="education-materials"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,application/pdf,image/jpeg,image/png,image/webp,text/plain"
                onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
              />
            </Field>

            {error ? (
              <Notice tone="alert" className="mt-5">
                {error}
              </Notice>
            ) : null}
            {message ? (
              <Notice tone="confirmed" className="mt-5">
                {message}
              </Notice>
            ) : null}

            <FormActions>
              <Button type="submit" disabled={submitting || checkingSession || !userId}>
                {submitting ? 'Submitting…' : userId ? 'Submit for review' : 'Sign in required'}
              </Button>
              <span className="text-xs text-[var(--gl-text-muted)]">Held as Pending review on receipt.</span>
            </FormActions>
          </div>
        </form>

        <div className="grid gap-6 content-start">
          <Ledger title="Publication standards" rows={STANDARDS} />
          <Panel title="Review process">
            <ol className="grid gap-2 text-sm leading-6 text-[var(--gl-text-secondary)]">
              <li>1. Submission received and held as Pending review.</li>
              <li>2. A reviewer checks each cited source and the claims it is said to support.</li>
              <li>3. Published with sources listed, or returned with a stated reason.</li>
            </ol>
          </Panel>
        </div>
      </div>

      <LimitationsPanel subject="resource" className="mt-8" />
    </PageShell>
  )
}
