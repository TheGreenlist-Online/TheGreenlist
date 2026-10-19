'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AlertTriangle, Compass, Info, Loader2, Send, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TownGuideOutput } from '@/lib/ai/schemas'

/**
 * The Green List Town Guide.
 *
 * Renders nothing at all when the AI service is unconfigured, so a deployment
 * without OPENAI_API_KEY simply does not show the feature. Every answer is
 * explicitly labelled AI-generated and carries a link to report bad output.
 */

type Turn = { role: 'user' | 'assistant'; content: string }

type GuideAnswer = TownGuideOutput & { requestId: string }

const SUGGESTIONS = [
  'How do I file a report?',
  'What does "verified" actually mean here?',
  'Where can I read the platform rules?',
  'Can a business pay to remove a bad report?',
]

export function TownGuidePanel() {
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

    fetch('/api/ai/town-guide', { method: 'GET' })
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
    if (answer && answerRef.current) {
      answerRef.current.focus({ preventScroll: true })
    }
  }, [answer])

  async function ask(message: string) {
    const trimmed = message.trim()
    if (trimmed.length < 3 || isLoading) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/town-guide', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed, currentPath: pathname, history: history.slice(-4) }),
      })

      const payload = await response.json()

      if (!response.ok) {
        setError(payload?.error?.message ?? 'The guide could not answer that right now.')
        setAnswer(null)
        return
      }

      setAnswer({ ...(payload.data as TownGuideOutput), requestId: payload.requestId })
      setHistory((previous) => [
        ...previous.slice(-3),
        { role: 'user', content: trimmed },
        { role: 'assistant', content: (payload.data as TownGuideOutput).message },
      ])
      setQuestion('')
    } catch {
      setError('The guide is unreachable. Please check your connection and try again.')
      setAnswer(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Unconfigured or still checking: render nothing rather than a broken panel.
  if (available !== true) return null

  return (
    <section
      aria-labelledby="town-guide-heading"
      className="relative z-10 mx-auto mt-12 max-w-4xl rounded-2xl border border-emerald-300/25 bg-black/55 p-5 sm:p-7"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/25 bg-emerald-950/50 text-emerald-300">
          <Compass className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="town-guide-heading" className="text-2xl text-amber-100">
            Ask the Town Guide
          </h2>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            Find your way around the town and the standard site. The guide reads only public records and the
            platform rulebook.
          </p>
        </div>
      </div>

      <form
        className="mt-5 flex flex-col gap-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          void ask(question)
        }}
      >
        <label htmlFor="town-guide-question" className="sr-only">
          Ask the Green List Town Guide a question
        </label>
        <Input
          id="town-guide-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Where do I report an unsafe product?"
          maxLength={2000}
          disabled={isLoading}
          aria-describedby="town-guide-disclaimer"
        />
        <Button type="submit" disabled={isLoading || question.trim().length < 3}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Asking
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
            <button
              type="button"
              onClick={() => void ask(suggestion)}
              disabled={isLoading}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-emerald-300/40 hover:text-emerald-200 disabled:opacity-50"
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>

      <p id="town-guide-disclaimer" className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
        AI-generated guidance. Verify anything important against the linked records.
      </p>

      <div aria-live="polite" aria-atomic="true">
        {error ? (
          <p className="mt-5 flex items-start gap-2 rounded-xl border border-amber-300/30 bg-amber-950/25 p-4 text-sm text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        ) : null}

        {answer ? (
          <div
            ref={answerRef}
            tabIndex={-1}
            className="mt-5 rounded-xl border border-emerald-300/20 bg-emerald-950/20 p-4 sm:p-5"
          >
            <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-200">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              AI-generated
            </p>

            <p className="mt-3 whitespace-pre-line text-sm leading-6 text-zinc-100">{answer.message}</p>

            {answer.safetyNotice ? (
              <p className="mt-4 flex items-start gap-2 rounded-lg border border-amber-300/25 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {answer.safetyNotice}
              </p>
            ) : null}

            {answer.destinations.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                  Where to go
                </h3>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {answer.destinations.map((destination) => (
                    <li
                      key={`${destination.title}-${destination.standardHref}`}
                      className="rounded-lg border border-white/10 bg-black/40 p-3"
                    >
                      <p className="text-sm font-semibold text-amber-100">{destination.title}</p>
                      <p className="mt-1 text-xs leading-5 text-zinc-300">{destination.reason}</p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
                        <Link href={destination.standardHref} className="text-emerald-300 hover:underline">
                          Standard view →
                        </Link>
                        {destination.townHref ? (
                          <Link href={destination.townHref} className="text-amber-200 hover:underline">
                            Town view →
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {answer.sources.length > 0 ? (
              <div className="mt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">Sources</h3>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {answer.sources.map((source) => (
                    <li
                      key={`${source.recordType}-${source.recordId}`}
                      className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300"
                    >
                      <span className="text-zinc-500">{source.recordType}</span> · {source.label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="mt-5 border-t border-white/10 pt-3 text-[11px] text-zinc-400">
              Wrong or misleading answer?{' '}
              <Link
                href={`/contact?topic=ai-feedback&reference=${encodeURIComponent(answer.requestId)}`}
                className="text-emerald-300 hover:underline"
              >
                Report it for human review
              </Link>
              . Reference {answer.requestId.slice(0, 8)}.
            </p>
          </div>
        ) : null}
      </div>
    </section>
  )
}
