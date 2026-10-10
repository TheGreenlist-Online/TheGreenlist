import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { OnboardingState } from '@/lib/onboarding'

/**
 * Shown on the desk until the account is set up. Three rows, each either
 * done or linking to the step that finishes it. Disappears when complete.
 */
export function SetupChecklist({ state }: { state: OnboardingState }) {
  if (!state.available || state.completed) return null

  const rows = [
    { done: Boolean(state.participation), text: 'Say how you take part', step: 'participation' },
    { done: state.ageAttested && state.standardsAcknowledged, text: 'Confirm your age and accept the standards', step: 'standards' },
    { done: state.hasUsername, text: 'Choose your username', step: 'identity' },
  ]
  const doneCount = rows.filter((r) => r.done).length

  return (
    <section className="gl-panel" aria-labelledby="setup-checklist-title">
      <div className="gl-panel__head">
        <h2 id="setup-checklist-title">Finish setting up</h2>
        <span className="gl-meta">
          <span>
            {doneCount} of {rows.length} done
          </span>
        </span>
      </div>
      <div className="gl-panel__body">
        <ul className="gl-checklist">
          {rows.map((row) => (
            <li key={row.step} className={cn(row.done && 'is-done')}>
              <span className="gl-checklist__mark" aria-hidden="true" />
              <span className="gl-checklist__text text-[var(--gl-text)]">
                {row.text}
                <span className="sr-only">{row.done ? ' (done)' : ''}</span>
              </span>
              {row.done ? (
                <span className="gl-meta">
                  <span>Done</span>
                </span>
              ) : (
                <Link href="/onboarding" className="gl-link text-xs">
                  Continue
                </Link>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs leading-5 text-[var(--gl-text-muted)]">
          Posting in discussions and using the assistant open once the first two rows are done. Reading the record never requires any of this.
        </p>
      </div>
    </section>
  )
}
