/**
 * The one status colour system for the whole app.
 *
 * Four separate maps had each invented their own palette, so the same meaning
 * wore a different colour depending on the page: "under review" was sky blue in
 * StatusBadge and cyan on the reports pages, and "resolved" was violet in one
 * place and green in two others. Blue, cyan, violet and orange are all off the
 * brand palette. Pages now map their domain value to a tone and the tone owns
 * the colour.
 */
export type StatusTone = 'pending' | 'progress' | 'success' | 'neutral' | 'danger' | 'critical'

export const statusToneClass: Record<StatusTone, string> = {
  /** Waiting to be picked up. Brand gold. */
  pending: 'border-amber-300/35 bg-amber-950/25 text-amber-200',
  /** Actively being worked. Brand lime — bright, but not a verdict. */
  progress: 'border-lime-300/35 bg-lime-950/30 text-lime-200',
  /** Verified, substantiated, resolved, succeeded. Brand green. */
  success: 'border-emerald-300/35 bg-emerald-950/25 text-emerald-200',
  /** No verdict: unverified, inconclusive, low risk. */
  neutral: 'border-zinc-400/35 bg-zinc-800/35 text-zinc-300',
  /** Needs attention. */
  danger: 'border-red-300/30 bg-red-950/25 text-red-200',
  /** Needs attention now — the strong end of the same red. */
  critical: 'border-red-400/55 bg-red-950/45 text-red-100',
}

export const statusBadgeBase =
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]'

/** Resolves a tone class, falling back to neutral for unknown values. */
export function toneClass(tone: StatusTone | undefined): string {
  return statusToneClass[tone ?? 'neutral']
}
