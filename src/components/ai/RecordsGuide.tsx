'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Loader2, Search, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Notice } from '@/components/record/Notice'
import type { RecordsGuideOutput } from '@/lib/ai/schemas'

type Turn = { role: 'user' | 'assistant'; content: string }
type GuideAnswer = RecordsGuideOutput & { requestId: string }

const SUGGESTIONS = [
  'How do I find a public report?',
  'What does verified mean?',
  'Where can I read the platform rules?',
  'Can a business pay to remove a report?',
]

export function RecordsGuide() {
  const pathname = usePathname()
  const [available, setAvailable] = useState<boolean | null>(null)
  const [question, setQuestion] = useState('')
  const [history, setHistory] = useState<Turn[]>([])
  const [answer, setAnswer] = useState<GuideAnswer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const answerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true

    fetch('/api/ai/records-guide')
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((data: { enabled?: boolean }) => {
        if (active) setAvailable(Boolean(data.enabled))
      })
      .catch(() => {
        if (active) setAvailable(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (answer && answerRef.current) answerRef.current.focus({ preventScroll: true })
  }, [answer])

  async function ask(message: string) {
    const trimmed = message.trim()
    if (trimmed.length < 3 || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/records-guide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed, currentPath: pathname, history: history.slice(-4) }),
      })
      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error?.message ?? 'The records guide could not answer that right now.')
        setAnswer(null)
        return
      }

      const output = payload.data as RecordsGuideOutput
      setAnswer({ ...output, requestId: payload.requestId })
      setHistory((previous) => [
        ...previous.slice(-3),
        { role: 'user', content: trimmed },
        { role: 'assistant', content: output.message },
      ])
      setQuestion('')
    } catch {
      setError('The records guide is unreachable. Please check your connection and try again.')
      setAnswer(null)
    } finally {
      setIsLoading(false)
    }
  }

  if (available !== true) return null

  return (
    <section className="gl-section" aria-labelledby="records-guide-heading">
      <div className="gl-panel">
        <div className="gl-panel__head">
          <h2 id="records-guide-heading">Records Guide</h2>
          <span className="gl-meta">AI assistance · public records only</span>
        </div>
        <div className="gl-panel__body">
          <p className="text-sm leading-6 text-[var(--gl-text-secondary)]">
            Find public records, understand review statuses, and navigate the platform. The guide cannot access private
            evidence or identify anonymous reporters.
          </p>

          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault()
              void ask(question)
            }}
          >
            <label htmlFor="records-guide-question" className="sr-only">
              Ask the records guide a question
            </label>
            <Input
              id="records-guide-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask about a business record, report, or platform rule"
              maxLength={2_000}
              disabled={isLoading}
              aria-describedby="records-guide-disclaimer"
            />
            <Button type="submit" disabled={isLoading || question.trim().length < 3}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4" aria-hidden="true" />
                  Checking
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" aria-hidden="true" />
                  Ask
                </>
              )}
            </Button>
          </form>

          <ul className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion}>
                <Button type="button" variant="outline" size="sm" onClick={() => void ask(suggestion)} disabled={isLoading}>
                  {suggestion}
                </Button>
              </li>
            ))}
          </ul>

          <p id="records-guide-disclaimer" className="gl-meta mt-3">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            AI-generated guidance. Verify important statements against the linked records.
          </p>

          <div aria-live="polite" aria-atomic="true">
            {error ? (
              <p className="gl-limitations mt-4" role="alert">
                <AlertTriangle className="mr-2 inline h-4 w-4" aria-hidden="true" />
                {error}
              </p>
            ) : null}
            {answer ? (
              <div ref={answerRef} tabIndex={-1} className="mt-5 border-t border-[var(--gl-border)] pt-4">
                <RecordsGuideAnswer answer={answer} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

/** Keep the safety notice alongside the answer in every rendered result. */
export function RecordsGuideAnswer({ answer }: { answer: RecordsGuideOutput }) {
  return (
    <>
      <p className="text-sm leading-6">{answer.message}</p>
      {answer.safetyNotice ? (
        <Notice title="Safety notice" tone="review" role="note" className="mt-3">
          {answer.safetyNotice}
        </Notice>
      ) : null}
      {answer.destinations.length > 0 ? (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Suggested records pages">
          {answer.destinations.map((destination) => (
            <li key={`${destination.standardHref}:${destination.title}`}>
              <Link className="greenlist-secondary-button" href={destination.standardHref}>
                <Search className="h-4 w-4" aria-hidden="true" />
                {destination.title}
              </Link>
              <p className="mt-1 text-xs text-[var(--gl-text-muted)]">{destination.reason}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {answer.sources.length > 0 ? (
        <p className="gl-meta mt-3">
          Sources: {answer.sources.map((source) => source.label).join('; ')}
        </p>
      ) : null}
    </>
  )
}
