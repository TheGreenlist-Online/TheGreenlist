import { ReactNode } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type LimitationsPanelProps = {
  /** Which record type the standard text should describe. */
  subject?: 'business' | 'report' | 'resource' | 'discussion' | 'news' | 'profile' | 'generic'
  /** Replaces the standard text entirely. */
  children?: ReactNode
  className?: string
}

const STANDARD: Record<NonNullable<LimitationsPanelProps['subject']>, ReactNode> = {
  business:
    'The Green List does not certify this business, its products, or their safety. Verification of identity states only that licence details matched an official source on the date checked.',
  report:
    'A report is an account submitted for review. Until a finding is published, nothing in it has been established by The Green List, and it should not be read as a conclusion about any business or person.',
  resource:
    'Educational resources explain how systems work. They are not legal or medical advice and do not evaluate any specific product or business.',
  discussion:
    'Discussion posts are the views of their authors, not findings of The Green List. Nothing said here changes a record’s status; documentary review does.',
  news:
    'Aggregated coverage is published by the named outlet and linked to the original. It is not a Green List finding.',
  profile:
    'A profile shows an account’s public activity. Role and verification labels describe platform permissions and identity checks, not endorsement.',
  generic:
    'The Green List documents available evidence and its limits. It does not certify products as safe or approve businesses.',
}

/**
 * Makes unknowns and scope visible. Every record page ends with one of these
 * so a reader always knows what the page does not establish.
 */
export function LimitationsPanel({ subject = 'generic', children, className }: LimitationsPanelProps) {
  return (
    <aside className={cn('gl-limitations', className)} aria-label="What this page does not establish">
      <strong>What this does not establish.</strong> {children ?? STANDARD[subject]}{' '}
      <Link href="/about/methodology" className="gl-link">
        Methodology
      </Link>
      {' · '}
      <Link href="/about/corrections" className="gl-link">
        Request a correction
      </Link>
    </aside>
  )
}
