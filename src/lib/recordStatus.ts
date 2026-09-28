import type { ShellTone } from '@/lib/statusTones'

/**
 * Domain value -> public status label.
 *
 * One mapping for the whole site so "verified" on a business record, a
 * document, a profile, and a report all resolve to the same words and tone.
 * Labels follow the vocabulary published at /about/methodology. Nothing here
 * says "approved", "safe", "trusted", or "certified".
 */
export type RecordStatus = { label: string; tone: ShellTone; meaning?: string }

const TABLE: Record<string, RecordStatus> = {
  // Verification (businesses, profiles, facts)
  verified: { label: 'Identity verified', tone: 'confirmed', meaning: 'Licence and registration details matched an official source on the date checked.' },
  pending: { label: 'Under review', tone: 'review', meaning: 'Being assessed. No public conclusion is implied.' },
  unverified: { label: 'Not verified', tone: 'neutral', meaning: 'Not matched to an official source.' },
  'business-reported': { label: 'Business-reported', tone: 'neutral', meaning: 'Submitted by the business; not independently confirmed.' },

  // Reports
  submitted: { label: 'Received', tone: 'neutral', meaning: 'The report exists in the private intake.' },
  received: { label: 'Received', tone: 'neutral' },
  needs_info: { label: 'Needs information', tone: 'review' },
  'needs-info': { label: 'Needs information', tone: 'review' },
  under_review: { label: 'Under review', tone: 'review' },
  'under-review': { label: 'Under review', tone: 'review' },
  in_review: { label: 'Under review', tone: 'review' },
  escalated: { label: 'Escalated', tone: 'review' },
  business_response_requested: { label: 'Business response requested', tone: 'review' },
  substantiated: { label: 'Substantiated', tone: 'confirmed', meaning: 'Reviewed documentation supports the account.' },
  unsubstantiated: { label: 'Unsubstantiated', tone: 'neutral', meaning: 'Available documentation does not support the account.' },
  inconclusive: { label: 'Inconclusive', tone: 'neutral', meaning: 'Documentation reviewed; no conclusion could be drawn.' },
  published: { label: 'Published finding', tone: 'confirmed', meaning: 'A source-backed finding has been published.' },
  resolved: { label: 'Closed', tone: 'neutral' },
  closed: { label: 'Closed', tone: 'neutral' },
  dismissed: { label: 'Closed', tone: 'neutral' },
  rejected: { label: 'Not accepted', tone: 'neutral' },
  corrected: { label: 'Corrected', tone: 'confirmed' },

  // Documents / resources / moderation
  approved: { label: 'Reviewed', tone: 'confirmed', meaning: 'Reviewed and accepted for the record.' },
  draft: { label: 'Draft', tone: 'neutral' },
  flagged: { label: 'Flagged', tone: 'review' },
  hidden: { label: 'Withheld', tone: 'alert' },
  removed: { label: 'Removed', tone: 'alert' },
  active: { label: 'Active', tone: 'confirmed' },
  inactive: { label: 'Inactive', tone: 'neutral' },
  locked: { label: 'Locked', tone: 'neutral' },
  pinned: { label: 'Pinned', tone: 'neutral' },
  anonymous: { label: 'Anonymous', tone: 'neutral' },
  open: { label: 'Open', tone: 'review' },
  running: { label: 'Running', tone: 'review' },
  success: { label: 'Completed', tone: 'confirmed' },
  partial: { label: 'Partial', tone: 'review' },
  error: { label: 'Failed', tone: 'alert' },
  failed: { label: 'Failed', tone: 'alert' },
  pending_review: { label: 'Pending review', tone: 'review' },
  low: { label: 'Low risk', tone: 'neutral' },
  medium: { label: 'Medium risk', tone: 'review' },
  high: { label: 'High risk', tone: 'alert' },
  critical: { label: 'Critical', tone: 'alert' },
  none: { label: 'None', tone: 'neutral' },
}

export function recordStatus(value: string | null | undefined, fallback?: RecordStatus): RecordStatus {
  if (!value) return fallback ?? { label: 'Not stated', tone: 'neutral' }
  const key = value.toLowerCase().trim()
  return TABLE[key] ?? fallback ?? { label: key.replace(/[_-]+/g, ' '), tone: 'neutral' }
}

/** Title-cases an enum-ish value for display: `worker_safety` -> `Worker safety`. */
export function humanize(value: string | null | undefined, fallback = 'Not stated'): string {
  if (!value) return fallback
  const words = value.replace(/[_-]+/g, ' ').trim().toLowerCase()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** Long date used in metadata rows. */
export function formatDate(value: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }): string {
  if (!value) return 'Not stated'
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return 'Not stated'
  return d.toLocaleDateString('en-US', opts)
}

/** Short public record identifier from a UUID: `GL-BUS-1A2B3C4D`. */
export function recordId(prefix: string, id: string | number | null | undefined): string {
  if (id === null || id === undefined) return `GL-${prefix}-PENDING`
  const raw = String(id).replace(/-/g, '')
  return `GL-${prefix}-${raw.slice(0, 8).toUpperCase()}`
}
