import { BadgeCheck, Clock3, ShieldQuestion } from 'lucide-react'
import { cn } from '@/lib/utils'

type VerificationStatus = 'unverified' | 'pending' | 'verified' | string

const STATUS_STYLES: Record<string, { label: string; className: string; icon: typeof BadgeCheck }> = {
  verified: {
    label: 'Verified',
    className: 'border-emerald-300/40 bg-emerald-300/10 text-emerald-200',
    icon: BadgeCheck,
  },
  pending: {
    label: 'Pending Review',
    className: 'border-amber-300/40 bg-amber-300/10 text-amber-200',
    icon: Clock3,
  },
  unverified: {
    label: 'Unverified',
    className: 'border-zinc-500/30 bg-zinc-500/10 text-zinc-300',
    icon: ShieldQuestion,
  },
}

type TrustBadgeProps = {
  /** Legacy usage: a static marketing tagline string (default site-wide badge). */
  text?: string
  /** New usage: pass a profiles.verification_status value to render a colored status badge instead. */
  status?: VerificationStatus
  className?: string
}

/**
 * TrustBadge is dual-purpose:
 * - With no `status` prop, renders the original static tagline badge used site-wide
 *   ("Built for Truth. Driven by Community.") — preserves existing call sites.
 * - With a `status` prop (a profiles.verification_status value), renders a colored
 *   unverified/pending/verified badge for use on profile pages.
 */
export function TrustBadge({ text = 'Built for Truth. Driven by Community.', status, className }: TrustBadgeProps) {
  if (status !== undefined) {
    const normalized = typeof status === 'string' ? status.toLowerCase() : 'unverified'
    const style = STATUS_STYLES[normalized] ?? STATUS_STYLES.unverified
    const Icon = style.icon
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]',
          style.className,
          className,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {style.label}
      </span>
    )
  }

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border border-amber-300/35 bg-[#121a15]/85 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200',
        className,
      )}
    >
      {text}
    </div>
  )
}
