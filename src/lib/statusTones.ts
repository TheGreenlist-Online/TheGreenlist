/**
 * The one status colour system for the whole app.
 *
 * Pages map their domain value to a tone; the tone owns the presentation.
 * Tones resolve to the shell's `.gl-status` classes so a status looks the
 * same in a badge, a table cell, a ledger row, or a notice. Colour supports
 * the text label and never replaces it.
 */
export type StatusTone = 'pending' | 'progress' | 'success' | 'neutral' | 'danger' | 'critical'

/** Shell tone names used by `.gl-status--*` and `.gl-notice--*`. */
export type ShellTone = 'confirmed' | 'review' | 'alert' | 'neutral'

export const toneToShell: Record<StatusTone, ShellTone> = {
  pending: 'review',
  progress: 'review',
  success: 'confirmed',
  neutral: 'neutral',
  danger: 'alert',
  critical: 'alert',
}

export const statusToneClass: Record<StatusTone, string> = {
  pending: 'gl-status gl-status--review',
  progress: 'gl-status gl-status--review',
  success: 'gl-status gl-status--confirmed',
  neutral: 'gl-status gl-status--neutral',
  danger: 'gl-status gl-status--alert',
  critical: 'gl-status gl-status--alert',
}

/** Kept for call sites that compose the badge themselves. Empty on purpose: `.gl-status` carries the shape. */
export const statusBadgeBase = ''

/** Resolves a tone class, falling back to neutral for unknown values. */
export function toneClass(tone: StatusTone | undefined): string {
  return statusToneClass[tone ?? 'neutral']
}
