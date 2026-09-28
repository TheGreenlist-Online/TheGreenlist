import { cn } from '@/lib/utils'
import { recordStatus, type RecordStatus } from '@/lib/recordStatus'
import type { ShellTone } from '@/lib/statusTones'

type StatusLabelProps = {
  /** Raw domain value, e.g. `verified`, `under_review`, `approved`. */
  value?: string | null
  /** Override the label and tone directly. */
  status?: RecordStatus
  /** Fallback when the value is unknown. */
  fallback?: RecordStatus
  /** Explicit label/tone without going through the table. */
  label?: string
  tone?: ShellTone
  className?: string
  title?: string
}

/**
 * The one status label. Rectangular, monospaced, text-first. Resolves domain
 * values through `recordStatus()` so every page uses the published vocabulary.
 */
export function StatusLabel({ value, status, fallback, label, tone, className, title }: StatusLabelProps) {
  const resolved = status ?? (label ? { label, tone: tone ?? 'neutral' } : recordStatus(value, fallback))
  return (
    <span className={cn('gl-status', `gl-status--${resolved.tone}`, className)} title={title ?? resolved.meaning}>
      {resolved.label}
    </span>
  )
}
