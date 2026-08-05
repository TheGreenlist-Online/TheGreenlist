'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
      setError('Choose a forum for this thread.')
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
        throw new Error(payload?.error || 'The thread could not be created.')
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
      setError(submissionError instanceof Error ? submissionError.message : 'The thread could not be created.')
    } finally {
      setSubmitting(false)
    }
  }

  if (forums.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl border-primary/40">
        <CardHeader>
          <CardTitle>No forums available</CardTitle>
          <CardDescription>There are no active forums to post in yet. Check back soon.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-primary/40">
        <CardHeader>
          <CardTitle>New Thread</CardTitle>
          <CardDescription>Choose a forum, give your thread a clear title, and share the details.</CardDescription>
        </CardHeader>
        <CardContent>
          {showRestoredBanner && restoredAt ? (
            <div className="mb-6 flex items-start justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 p-3 text-sm text-accent-foreground">
              <span>Restored your unsaved draft from {formatDistanceToNow(restoredAt, { addSuffix: true })}.</span>
              <button
                type="button"
                onClick={() => setShowRestoredBanner(false)}
                className="shrink-0 text-xs font-medium text-muted-foreground hover:text-foreground"
                aria-label="Dismiss"
              >
                Dismiss
              </button>
            </div>
          ) : null}
          <form className="space-y-6" onSubmit={handleSubmit}>
            <label className="block space-y-2 text-sm font-medium" htmlFor="forum-select">
              Forum
              <select
                id="forum-select"
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={forumId}
                onChange={(event) => setForumId(event.target.value)}
                required
              >
                {forums.map((forum) => (
                  <option key={forum.id} value={forum.id}>
                    {forum.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="thread-title">
              Title
              <Input
                id="thread-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                minLength={4}
                maxLength={200}
                required
                placeholder="Give your thread a clear, specific title"
              />
            </label>

            <label className="block space-y-2 text-sm font-medium" htmlFor="thread-body">
              Body
              <textarea
                id="thread-body"
                className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                minLength={10}
                required
                placeholder="Share the details, context, and any relevant facts."
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
                <span className="block font-medium">Post anonymously</span>
                <span className="text-muted-foreground">Your display name will be hidden from other members.</span>
              </span>
            </label>

            {error ? (
              <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
                {error}
              </p>
            ) : null}

            {success ? (
              <div role="status" className="rounded-lg border border-emerald-400/40 bg-emerald-950/35 p-4 text-sm text-emerald-100">
                <p className="font-semibold">Thread created.</p>
                <a
                  className="mt-2 inline-block font-semibold text-accent hover:underline"
                  href={`/forums/${success.forumSlug}/${success.threadSlug}`}
                >
                  View your thread
                </a>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {isSaving ? 'Saving…' : savedAt ? `Draft saved ${formatDistanceToNow(savedAt, { addSuffix: true })}` : ''}
              </span>
            </div>

            <Button className="w-full" type="submit" disabled={submitting}>
              {submitting ? 'Posting…' : 'Create Thread'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
