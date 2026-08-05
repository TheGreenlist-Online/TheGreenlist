'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type ThreadReplyFormProps = {
  threadId: string
  isSignedIn: boolean
  signInHref: string
}

export function ThreadReplyForm({ threadId, isSignedIn, signInHref }: ThreadReplyFormProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (body.trim().length < 2) {
      setError('Write a reply before submitting.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/forum-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thread_id: threadId,
          body: body.trim(),
          is_anonymous: isAnonymous,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || 'The reply could not be posted.')
      }

      setBody('')
      setIsAnonymous(false)
      router.refresh()
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The reply could not be posted.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border border-amber-300/30 bg-amber-950/20 p-4 text-sm text-amber-100">
        <Link className="font-semibold text-lime-300 underline" href={signInHref}>
          Sign in
        </Link>{' '}
        to reply to this thread.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="block text-sm font-semibold text-zinc-200" htmlFor="reply-body">
        Add a reply
        <textarea
          id="reply-body"
          className="mt-2 min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Share your response…"
          required
        />
      </label>
      <label className="flex items-center gap-2 text-sm text-zinc-400">
        <input
          type="checkbox"
          checked={isAnonymous}
          onChange={(event) => setIsAnonymous(event.target.checked)}
        />
        Post anonymously
      </label>

      {error ? (
        <p role="alert" className="rounded-lg border border-red-400/40 bg-red-950/35 p-3 text-sm text-red-100">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-emerald-950 shadow-sm transition hover:bg-emerald-300 disabled:opacity-50"
      >
        {submitting ? 'Posting…' : 'Post reply'}
      </button>
    </form>
  )
}
