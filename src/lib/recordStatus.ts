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

  // Reports: persisted states come from REPORT_STATUSES below (spread in
  // after the table); these are aliases and legacy tokens only.
  received: { label: 'Received', tone: 'neutral' },
  needs_info: { label: 'Needs information', tone: 'review' },
  'needs-info': { label: 'Needs information', tone: 'review' },
  'under-review': { label: 'Under review', tone: 'review' },
  in_review: { label: 'Under review', tone: 'review' },
  escalated: { label: 'Escalated', tone: 'review' },
  business_response_requested: { label: 'Business response requested', tone: 'review' },
  substantiated: { label: 'Substantiated', tone: 'confirmed', meaning: 'Reviewed documentation supports the account.' },
  unsubstantiated: { label: 'Unsubstantiated', tone: 'neutral', meaning: 'Available documentation does not support the account.' },
  inconclusive: { label: 'Inconclusive', tone: 'neutral', meaning: 'Documentation reviewed; no conclusion could be drawn.' },
  closed: { label: 'Closed', tone: 'neutral' },
  dismissed: { label: 'Closed', tone: 'neutral' },

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

/**
 * The persisted report states, in the order /about/methodology documents
 * them. This is the single definition behind three things that used to drift:
 * the labels a reporter sees, the states /api/admin/reports will write, and
 * the list published on the methodology page. Mirrors `reports_status_check`
 * in supabase/migrations.
 *
 * `resolved` and `rejected` both publish as "Closed"; the distinction stays in
 * the private record and the reporter's notification.
 */
export const REPORT_STATUSES = [
  { value: 'submitted', label: 'Received', tone: 'neutral', meaning: 'The report exists in the private intake.' },
  { value: 'needs_more_info', label: 'Needs information', tone: 'review', meaning: 'Reviewers have asked for documentation or clarification.' },
  { value: 'under_review', label: 'Under review', tone: 'review', meaning: 'The report is being assessed against available evidence.' },
  { value: 'published', label: 'Published finding', tone: 'confirmed', meaning: 'A source-backed finding has been published. Only this state and “Corrected” produce public content.' },
  { value: 'corrected', label: 'Corrected', tone: 'confirmed', meaning: 'A published finding was amended; the change is logged.' },
  { value: 'resolved', label: 'Closed', tone: 'neutral', meaning: 'Review is complete and no further action will be taken.' },
  { value: 'rejected', label: 'Closed', tone: 'neutral', meaning: 'The report could not be substantiated or falls outside scope.' },
] as const satisfies readonly ({ value: string } & RecordStatus)[]

export type ReportStatus = (typeof REPORT_STATUSES)[number]['value']

/** Every status the admin route may write and the database will accept. */
export const REPORT_STATUS_VALUES: readonly ReportStatus[] = REPORT_STATUSES.map(({ value }) => value)

export function isReportStatus(value: unknown): value is ReportStatus {
  return typeof value === 'string' && (REPORT_STATUS_VALUES as readonly string[]).includes(value)
}

for (const { value, label, tone, meaning } of REPORT_STATUSES) {
  TABLE[value] = { label, tone, meaning }
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
