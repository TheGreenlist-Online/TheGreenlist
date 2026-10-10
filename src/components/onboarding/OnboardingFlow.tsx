'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PARTICIPATION_OPTIONS, onboardingDestination, type Participation } from '@/lib/onboarding'
import { StatusMessage, TextField } from '@/components/settings/SettingsControls'

type Initial = {
  participation: Participation | null
  ageAttested: boolean
  standardsAcknowledged: boolean
  username: string
  displayName: string
}

const STEPS = [
  { id: 'participation', label: 'How you take part' },
  { id: 'standards', label: 'Standards and age' },
  { id: 'identity', label: 'Your name on the record' },
] as const

type StepId = (typeof STEPS)[number]['id']

/**
 * The three-step flow. Each step saves on "Continue" so leaving halfway loses
 * nothing; the server stamps completion when all declarations are present.
 *
 * No animation between steps, no progress bar that fills: a numbered list
 * with the current step marked is enough and respects reduced motion by
 * default.
 */
export function OnboardingFlow({ initial }: { initial: Initial }) {
  const router = useRouter()

  const firstOpen: StepId = !initial.participation
    ? 'participation'
    : !initial.ageAttested || !initial.standardsAcknowledged
      ? 'standards'
      : 'identity'

  const [step, setStep] = useState<StepId>(firstOpen)
  const [participation, setParticipation] = useState<Participation | null>(initial.participation)
  const [attestAge, setAttestAge] = useState(initial.ageAttested)
  const [acknowledge, setAcknowledge] = useState(initial.standardsAcknowledged)
  const [username, setUsername] = useState(initial.username)
  const [displayName, setDisplayName] = useState(initial.displayName)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null)

  const stepIndex = STEPS.findIndex((s) => s.id === step)
  const chosen = useMemo(() => PARTICIPATION_OPTIONS.find((o) => o.value === participation) ?? null, [participation])

  async function saveDeclarations(payload: Record<string, unknown>) {
    const response = await fetch('/api/onboarding/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null)
      throw new Error(body?.error ?? 'Could not save. Please try again.')
    }
    return response.json()
  }

  async function onContinueParticipation() {
    if (!participation) {
      setError('Choose the option that best describes you to continue.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveDeclarations({ participation })
      setStep('standards')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function onContinueStandards() {
    if (!attestAge || !acknowledge) {
      setError('Both confirmations are required to take part. You can still read the public record without them.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      await saveDeclarations({ attestAge: true, acknowledgeStandards: true })
      setStep('identity')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save.')
    } finally {
      setBusy(false)
    }
  }

  async function onFinish() {
    if (!username.trim()) {
      setFieldError({ field: 'username', message: 'A username is required. It is your permanent handle on the record.' })
      return
    }
    setBusy(true)
    setError(null)
    setFieldError(null)
    try {
      const patch: Record<string, string> = {}
      if (username.trim() !== initial.username) patch.username = username.trim()
      if (displayName.trim() !== initial.displayName) patch.display_name = displayName.trim()

      if (Object.keys(patch).length > 0) {
        const response = await fetch('/api/profiles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        })
        if (!response.ok) {
          const body = await response.json().catch(() => null)
          const message = body?.error ?? 'Could not save your name.'
          if (body?.field) setFieldError({ field: body.field, message })
          throw new Error(message)
        }
      }

      // Re-run completion so the stamp is set now that every step is present.
      await saveDeclarations({})
      router.push(onboardingDestination(participation))
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not finish.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <ol className="gl-steps" aria-label="Setup steps">
        {STEPS.map((s, i) => {
          const state = i < stepIndex ? 'done' : i === stepIndex ? 'current' : 'todo'
          return (
            <li key={s.id} className={cn('gl-steps__item', `is-${state}`)} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="gl-steps__num" aria-hidden="true">
                {i + 1}
              </span>
              <span className="gl-steps__label">
                {s.label}
                <span className="sr-only">{state === 'done' ? ' (done)' : state === 'current' ? ' (current step)' : ''}</span>
              </span>
            </li>
          )
        })}
      </ol>

      <div>
        <p className="gl-meta mb-3">
          <span>
            Step {stepIndex + 1} of {STEPS.length}
          </span>
        </p>

        {step === 'participation' ? (
          <section aria-labelledby="step-participation">
            <h2 id="step-participation" className="text-xl font-semibold text-[var(--gl-text)]">
              How do you take part?
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--gl-text-secondary)]">
              This is a declaration, not a role. It sets what you see first and how your posts are labelled. A reviewer, not this form, decides anything that is marked verified.
            </p>

            <div role="radiogroup" aria-label="How you take part" className="mt-5 grid gap-3">
              {PARTICIPATION_OPTIONS.map((option) => {
                const selected = participation === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setParticipation(option.value)
                      setError(null)
                    }}
                    className={cn('gl-choice', selected && 'is-selected')}
                  >
                    <span className="gl-choice__mark" aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[var(--gl-text)]">{option.title}</span>
                      <span className="mt-1 block text-sm leading-6 text-[var(--gl-text-secondary)]">{option.body}</span>
                    </span>
                  </button>
                )
              })}
            </div>

            {chosen ? (
              <p className="gl-notice gl-notice--info mt-4" role="status">
                <strong>What happens next.</strong> {chosen.afterwards}
              </p>
            ) : null}

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <div className="gl-form-actions">
              <button type="button" onClick={onContinueParticipation} disabled={busy} className="greenlist-primary-button">
                {busy ? 'Saving…' : 'Continue'}
              </button>
              <Link href="/dashboard" className="greenlist-quiet-button">
                Finish later
              </Link>
            </div>
          </section>
        ) : null}

        {step === 'standards' ? (
          <section aria-labelledby="step-standards">
            <h2 id="step-standards" className="text-xl font-semibold text-[var(--gl-text)]">
              Standards and age
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--gl-text-secondary)]">
              The Green List sells nothing and carries no marketing. These two confirmations are required because the subject matter is age-restricted and because the forum works only if everyone accepts the same rules.
            </p>

            <div className="mt-5 grid gap-3">
              <label className={cn('gl-choice', attestAge && 'is-selected')}>
                <input
                  type="checkbox"
                  checked={attestAge}
                  onChange={(e) => {
                    setAttestAge(e.target.checked)
                    setError(null)
                  }}
                  className="gl-choice__input"
                />
                <span className="gl-choice__mark gl-choice__mark--box" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--gl-text)]">I am of legal age to discuss cannabis where I live.</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--gl-text-secondary)]">
                    We record that you confirmed this and when. We do not store your date of birth.
                  </span>
                </span>
              </label>

              <label className={cn('gl-choice', acknowledge && 'is-selected')}>
                <input
                  type="checkbox"
                  checked={acknowledge}
                  onChange={(e) => {
                    setAcknowledge(e.target.checked)
                    setError(null)
                  }}
                  className="gl-choice__input"
                />
                <span className="gl-choice__mark gl-choice__mark--box" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[var(--gl-text)]">I have read the standards and will follow them.</span>
                  <span className="mt-1 block text-sm leading-6 text-[var(--gl-text-secondary)]">
                    No sales, no offers, no promotion of any product or business. Claims are labelled as claims until a reviewer verifies them. Automated systems flag; people decide.{' '}
                    <Link href="/legal/terms" className="gl-link">
                      Read the standards
                    </Link>
                    .
                  </span>
                </span>
              </label>
            </div>

            {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <div className="gl-form-actions">
              <button type="button" onClick={onContinueStandards} disabled={busy} className="greenlist-primary-button">
                {busy ? 'Saving…' : 'Continue'}
              </button>
              <button type="button" onClick={() => setStep('participation')} className="greenlist-quiet-button" disabled={busy}>
                Back
              </button>
            </div>
          </section>
        ) : null}

        {step === 'identity' ? (
          <section aria-labelledby="step-identity">
            <h2 id="step-identity" className="text-xl font-semibold text-[var(--gl-text)]">
              Your name on the record
            </h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-[var(--gl-text-secondary)]">
              Your username is permanent and appears on discussions and submissions. Reports you file anonymously never show it.
            </p>

            <div className="mt-5 grid gap-4">
              <TextField
                id="username"
                label="Username"
                prefix="@"
                value={username}
                onChange={(v) => {
                  setUsername(v)
                  if (fieldError?.field === 'username') setFieldError(null)
                }}
                maxLength={30}
                error={fieldError?.field === 'username' ? fieldError.message : undefined}
                hint="Lowercase letters, numbers and underscores."
              />
              <TextField
                id="display_name"
                label="Display name"
                value={displayName}
                onChange={setDisplayName}
                maxLength={80}
                placeholder={participation === 'business' ? 'Your name, not the business name' : 'The name shown on your posts'}
                hint={
                  participation === 'business'
                    ? 'Optional. The business is named through its claimed record, not through your profile.'
                    : 'Optional. Shown instead of your username where there is room.'
                }
              />
            </div>

            {error && !fieldError ? <StatusMessage tone="error">{error}</StatusMessage> : null}

            <div className="gl-form-actions">
              <button type="button" onClick={onFinish} disabled={busy} className="greenlist-primary-button">
                {busy ? 'Finishing…' : participation === 'business' ? 'Finish and claim a record' : 'Finish'}
              </button>
              <button type="button" onClick={() => setStep('standards')} className="greenlist-quiet-button" disabled={busy}>
                Back
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  )
}
