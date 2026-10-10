import Link from 'next/link'
import { isUnlimited, remaining, resetLabel, type DeskLimits } from '@/lib/entitlements-desk'

/**
 * What the account can still do this month. Plain numbers with their reset
 * date; no plan names, no upgrade prompt. When the account is gated the panel
 * says why and where to fix it.
 */
export function ParticipationLimits({ limits }: { limits: DeskLimits }) {
  if (!limits.available) return null

  if (limits.gate) {
    return (
      <section className="gl-panel" aria-labelledby="limits-title">
        <div className="gl-panel__head">
          <h2 id="limits-title">Taking part</h2>
        </div>
        <div className="gl-panel__body">
          {limits.gate === 'age_attestation_required' ? (
            <p className="text-sm leading-6 text-[var(--gl-text-secondary)]">
              Discussions and the assistant open once you have confirmed your age and accepted the standards.{' '}
              <Link href="/onboarding" className="gl-link">
                Finish setting up
              </Link>
              .
            </p>
          ) : (
            <p className="text-sm leading-6 text-[var(--gl-text-secondary)]">
              Posting is paused on this account. The reason and any end date are listed in{' '}
              <Link href="/settings" className="gl-link">
                account settings
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    )
  }

  const rows: Array<{ label: string; value: string; note: string }> = []

  if (limits.threads) {
    rows.push({
      label: 'New discussions',
      value: isUnlimited(limits.threads) ? 'No limit' : `${remaining(limits.threads)} of ${limits.threads.max}`,
      note: isUnlimited(limits.threads) ? 'Reviewer accounts are not capped.' : `Left this month · resets ${resetLabel(limits.threads.resetsAt)}. Replies are not limited.`,
    })
  }
  if (limits.aiMonth) {
    const dayNote = limits.aiDay && !isUnlimited(limits.aiDay) ? ` · ${remaining(limits.aiDay)} left today` : ''
    rows.push({
      label: 'Assistant questions',
      value: `${remaining(limits.aiMonth)} of ${limits.aiMonth.max}`,
      note: `Left this month · resets ${resetLabel(limits.aiMonth.resetsAt)}${dayNote}`,
    })
  }

  if (rows.length === 0) return null

  return (
    <section className="gl-panel" aria-labelledby="limits-title">
      <div className="gl-panel__head">
        <h2 id="limits-title">Taking part</h2>
        <span className="gl-meta">
          <span>Free participation</span>
        </span>
      </div>
      <div className="gl-panel__body grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="gl-stat">
            <p className="gl-label mb-0">{row.label}</p>
            <p className="gl-stat__value mt-2 tabular-nums">{row.value}</p>
            <p className="gl-stat__note">{row.note}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
