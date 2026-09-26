import { BadgeCheck, Clock3, ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

type VerificationStatus = 'unverified' | 'pending' | 'verified' | string

const STATUS_STYLES: Record<string, { label: string; className: string; icon: typeof BadgeCheck }> = {
  verified: {
    label: 'Identity verified',
    className: 'gl-status gl-status--confirmed',
    icon: BadgeCheck,
  },
  pending: {
    label: 'Under review',
    className: 'gl-status gl-status--review',
    icon: Clock3,
  },
  unverified: {
    label: 'Not verified',
    className: 'gl-status gl-status--neutral',
    icon: ShieldQuestion,
  },
}

type TrustBadgeProps = {
  /** Legacy usage: a static scope statement (default site-wide badge). */
  text?: string
  /** New usage: pass a profiles.verification_status value to render a colored status badge instead. */
  status?: VerificationStatus
  className?: string
}

/**
 * TrustBadge is dual-purpose:
 * - With no `status` prop, renders the original static tagline badge used site-wide
 *   ("Evidence · Status · Source · Correction path") — preserves existing call sites.
 * - With a `status` prop (a profiles.verification_status value), renders a colored
 *   unverified/pending/verified badge for use on profile pages.
 */
export function TrustBadge({ text = 'Every published claim carries a source, a status, a date, and a correction path.', status, className }: TrustBadgeProps) {
  if (status !== undefined) {
    const normalized = typeof status === 'string' ? status.toLowerCase() : 'unverified'
    const style = STATUS_STYLES[normalized] ?? STATUS_STYLES.unverified
    const Icon = style.icon
    return (
      <span
        className={cn(style.className, className)}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {style.label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'gl-limitations inline-block',
        className,
      )}
    >
      {text}
    </div>
  )
}
