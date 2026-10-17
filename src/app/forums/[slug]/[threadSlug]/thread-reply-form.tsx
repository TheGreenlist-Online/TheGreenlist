'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Field, FormActions, Notice, Textarea } from '@/components/record'

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
      <Notice tone="info">
        <Link className="gl-link" href={signInHref}>
          Sign in
        </Link>{' '}
        to reply. Replies are published under your display name unless you choose anonymity.
      </Notice>
    )
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Reply" htmlFor="reply-body" help="State what you know, and where it comes from. Claims about a business without a source may be held for review.">
        <Textarea id="reply-body" className="min-h-28" value={body} onChange={(event) => setBody(event.target.value)} required />
      </Field>
      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--gl-text-secondary)]">
        <input type="checkbox" checked={isAnonymous} onChange={(event) => setIsAnonymous(event.target.checked)} />
        Post anonymously (your account remains visible to reviewers)
      </label>

      {error ? (
        <Notice tone="alert" className="mt-4">
          {error}
        </Notice>
      ) : null}

      <FormActions>
        <button type="submit" disabled={submitting} className="greenlist-primary-button disabled:opacity-50">
          {submitting ? 'Posting…' : 'Post reply'}
        </button>
      </FormActions>
    </form>
  )
}
