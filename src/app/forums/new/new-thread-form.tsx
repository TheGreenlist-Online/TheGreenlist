'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Field, FormActions, Input, Notice, Panel, Select, Textarea } from '@/components/record'
import { useDraftAutosave } from '@/hooks/useDraftAutosave'

type ForumOption = {
  id: string
  slug: string
  name: string
  category: string | null
}

type NewThreadFormProps = {
  forums: ForumOption[]
  defaultForumSlug?: string
}

export function NewThreadForm({ forums, defaultForumSlug }: NewThreadFormProps) {
  const router = useRouter()
  const defaultForum = forums.find((f) => f.slug === defaultForumSlug) ?? forums[0]
  const [forumId, setForumId] = useState(defaultForum?.id ?? '')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ forumSlug: string; threadSlug: string } | null>(null)
  const [restoredAt, setRestoredAt] = useState<Date | null>(null)
  const [showRestoredBanner, setShowRestoredBanner] = useState(false)

  type ThreadDraft = {
    forumId: string
    title: string
    body: string
    isAnonymous: boolean
  }

  const { savedAt, isSaving, clearDraft, loadDraft } = useDraftAutosave<ThreadDraft>('forum_thread', {
    forumId,
    title,
    body,
    isAnonymous,
  })

  useEffect(() => {
    let mounted = true
    loadDraft().then((draft) => {
      if (!mounted || !draft) return
      if (draft.forumId) setForumId(draft.forumId)
      if (draft.title) setTitle(draft.title)
      if (draft.body) setBody(draft.body)
      if (draft.isAnonymous) setIsAnonymous(draft.isAnonymous)
      setRestoredAt(new Date())
      setShowRestoredBanner(true)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess(null)

    if (!forumId) {
      setError('Choose a topic area for this discussion.')
      return
    }
    if (title.trim().length < 4) {
      setError('Title must be at least 4 characters.')
      return
    }
    if (body.trim().length < 10) {
      setError('Body must be at least 10 characters.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          forumId,
          title: title.trim(),
          content: body.trim(),
          isAnonymous,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'The discussion could not be opened.')
      }

      const forum = forums.find((f) => f.id === forumId)
      setTitle('')
      setBody('')
      setIsAnonymous(false)
      await clearDraft()
      if (forum && payload?.slug) {
        setSuccess({ forumSlug: forum.slug, threadSlug: payload.slug })
      } else if (forum) {
        router.push(`/forums/${forum.slug}`)
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The discussion could not be opened.')
    } finally {
      setSubmitting(false)
    }
  }

  if (forums.length === 0) {
    return (
      <Panel title="No desks available">
        <p className="text-sm text-[var(--gl-text-secondary)]">There are no active discussion desks to post in.</p>
      </Panel>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="gl-panel">
      <div className="gl-panel__head">
        <h2>New discussion</h2>
        <span className="gl-meta">
          {isSaving ? <span>Saving draft…</span> : savedAt ? <span>Draft saved {formatDistanceToNow(savedAt, { addSuffix: true })}</span> : <span>Draft autosaves</span>}
        </span>
      </div>
      <div className="gl-panel__body">
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

        <Field label="Desk" htmlFor="forum-select">
          <Select id="forum-select" value={forumId} onChange={(event) => setForumId(event.target.value)} required>
            {forums.map((forum) => (
              <option key={forum.id} value={forum.id}>
                {forum.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Title" htmlFor="thread-title" required help="State the question or documentation request. 4–200 characters.">
          <Input id="thread-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={4} maxLength={200} required />
        </Field>

        <Field label="Body" htmlFor="thread-body" required help="Give the context and any sources you have. Name documents, not people.">
          <Textarea id="thread-body" className="min-h-40" value={body} onChange={(event) => setBody(event.target.value)} minLength={10} required />
        </Field>

        <label className="mt-3 flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
          <input type="checkbox" className="mt-1" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
          <span>
            <span className="block font-medium text-[var(--gl-text)]">Post anonymously</span>
            <span>Your display name is hidden from readers. Your account remains visible to reviewers.</span>
          </span>
        </label>

        {error ? (
          <Notice tone="alert" className="mt-5">
            {error}
          </Notice>
        ) : null}

        {success ? (
          <Notice tone="confirmed" className="mt-5" role="status">
            <strong>Discussion opened.</strong>{' '}
            <a className="gl-link" href={`/forums/${success.forumSlug}/${success.threadSlug}`}>
              View discussion
            </a>
          </Notice>
        ) : null}

        <FormActions>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Open discussion'}
          </Button>
        </FormActions>
      </div>
    </form>
  )
}
