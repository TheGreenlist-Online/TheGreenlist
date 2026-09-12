import type { SupabaseClient } from '@supabase/supabase-js'
import type { StatusTone } from '@/lib/statusTones'

/**
 * Everything the dashboard shows about the signed-in user.
 *
 * The dashboard used to be three rows of hardcoded links — it told you nothing
 * about your own account. These queries give it real content: what you filed,
 * what is waiting on a reviewer, and what changed since you last looked.
 *
 * Every query runs on the caller's session, so row-level security scopes it.
 * A user can read their own reports (`reporter_id = auth.uid()`), their own
 * education submissions, their own published threads, notifications and
 * tickets. Nothing here can widen to another account.
 *
 * Each read is wrapped so one failing table degrades that card instead of
 * breaking the page — the dashboard is the first thing seen after sign-in.
 */

export type ActivityItem = {
  id: string
  title: string
  href: string
  kind: 'Report' | 'Resource' | 'Discussion'
  status: string
  tone: StatusTone
  createdAt: string
}

export type NotificationItem = {
  id: string
  title: string
  body: string | null
  href: string | null
  createdAt: string
  isUnread: boolean
}

export type DashboardData = {
  counts: {
    reports: number
    reportsAwaitingReview: number
    submissions: number
    submissionsAwaitingReview: number
    discussions: number
    unreadNotifications: number
    openTickets: number
  }
  activity: ActivityItem[]
  notifications: NotificationItem[]
  /** Set when one or more reads failed, so the UI can say so honestly. */
  degraded: boolean
}

/** Report statuses that mean "a reviewer still has to look at this". */
const REPORT_PENDING = ['submitted', 'SUBMITTED', 'pending', 'PENDING', 'under_review', 'UNDER_REVIEW']
/** education_resources.status is constrained to DRAFT/PENDING_REVIEW/APPROVED/REJECTED/ARCHIVED. */
const RESOURCE_PENDING = ['DRAFT', 'PENDING_REVIEW']

const REPORT_TONES: Record<string, StatusTone> = {
  submitted: 'pending',
  pending: 'pending',
  under_review: 'progress',
  in_review: 'progress',
  published: 'success',
  verified: 'success',
  resolved: 'success',
  rejected: 'danger',
  dismissed: 'neutral',
}

const RESOURCE_TONES: Record<string, StatusTone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'pending',
  APPROVED: 'success',
  REJECTED: 'danger',
  ARCHIVED: 'neutral',
}

const THREAD_TONES: Record<string, StatusTone> = {
  published: 'success',
  pending: 'pending',
  draft: 'neutral',
  locked: 'neutral',
  removed: 'danger',
}

function tone(map: Record<string, StatusTone>, value: string | null): StatusTone {
  if (!value) return 'neutral'
  return map[value] ?? map[value.toLowerCase()] ?? 'neutral'
}

/**
 * Builds the canonical thread URL. The embedded `forums` relation arrives as an
 * object or a single-element array depending on how the join is inferred, so
 * both shapes are handled; without a forum slug we can only fall back to the
 * forum index.
 */
function forumThreadHref(row: { slug?: string | null; forums?: unknown }): string {
  const related = Array.isArray(row.forums) ? row.forums[0] : row.forums
  const forumSlug = (related as { slug?: string | null } | null | undefined)?.slug

  if (forumSlug && row.slug) return `/forums/${forumSlug}/${row.slug}`
  if (forumSlug) return `/forums/${forumSlug}`
  return '/forums'
}

/** Turns `PENDING_REVIEW` / `under_review` into `pending review`. */
export function humanizeStatus(value: string | null | undefined): string {
  if (!value) return 'unknown'
  return value.replace(/_/g, ' ').toLowerCase()
}

// Supabase's generated types aren't wired into this repo, so the client is
// loosely typed here rather than pretending to a schema type that doesn't exist.
type Client = SupabaseClient<any, 'public', any>

async function safe<T>(run: () => Promise<T>, fallback: T, failures: { count: number }): Promise<T> {
  try {
    return await run()
  } catch (error) {
    console.error('Dashboard query failed:', error)
    failures.count += 1
    return fallback
  }
}

async function countRows(
  supabase: Client,
  table: string,
  column: string,
  userId: string,
  statuses?: string[],
): Promise<number> {
  let query = supabase.from(table).select('id', { count: 'exact', head: true }).eq(column, userId)
  if (statuses) query = query.in('status', statuses)

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

export async function getDashboardData(supabase: Client, userId: string): Promise<DashboardData> {
  const failures = { count: 0 }

  const [
    reports,
    reportsAwaitingReview,
    submissions,
    submissionsAwaitingReview,
    discussions,
    unreadNotifications,
    openTickets,
    recentReports,
    recentResources,
    recentThreads,
    notificationRows,
  ] = await Promise.all([
    safe(() => countRows(supabase, 'reports', 'reporter_id', userId), 0, failures),
    safe(() => countRows(supabase, 'reports', 'reporter_id', userId, REPORT_PENDING), 0, failures),
    safe(() => countRows(supabase, 'education_resources', 'submitter_id', userId), 0, failures),
    safe(() => countRows(supabase, 'education_resources', 'submitter_id', userId, RESOURCE_PENDING), 0, failures),
    safe(() => countRows(supabase, 'forum_threads', 'author_id', userId), 0, failures),
    safe(
      async () => {
        const { count, error } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('profile_id', userId)
          .is('read_at', null)
        if (error) throw error
        return count ?? 0
      },
      0,
      failures,
    ),
    safe(() => countRows(supabase, 'support_tickets', 'profile_id', userId, ['open']), 0, failures),

    safe(
      async () => {
        const { data, error } = await supabase
          .from('reports')
          .select('id, title, status, created_at')
          .eq('reporter_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (error) throw error
        return data ?? []
      },
      [] as any[],
      failures,
    ),
    safe(
      async () => {
        const { data, error } = await supabase
          .from('education_resources')
          .select('id, title, status, created_at')
          .eq('submitter_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (error) throw error
        return data ?? []
      },
      [] as any[],
      failures,
    ),
    safe(
      async () => {
        const { data, error } = await supabase
          .from('forum_threads')
          // Threads live at /forums/<forum>/<thread>, so the parent forum slug
          // is joined in rather than guessed.
          .select('id, title, slug, status, created_at, forums(slug)')
          .eq('author_id', userId)
          .order('created_at', { ascending: false })
          .limit(5)
        if (error) throw error
        return data ?? []
      },
      [] as any[],
      failures,
    ),
    safe(
      async () => {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, title, body, link_url, created_at, read_at')
          .eq('profile_id', userId)
          .order('created_at', { ascending: false })
          .limit(6)
        if (error) throw error
        return data ?? []
      },
      [] as any[],
      failures,
    ),
  ])

  const activity: ActivityItem[] = [
    ...recentReports.map((row) => ({
      id: `report-${row.id}`,
      title: row.title ?? 'Untitled report',
      href: `/reports/${row.id}`,
      kind: 'Report' as const,
      status: humanizeStatus(row.status),
      tone: tone(REPORT_TONES, row.status),
      createdAt: row.created_at,
    })),
    ...recentResources.map((row) => ({
      id: `resource-${row.id}`,
      title: row.title ?? 'Untitled resource',
      href: `/education/${row.id}`,
      kind: 'Resource' as const,
      status: humanizeStatus(row.status),
      tone: tone(RESOURCE_TONES, row.status),
      createdAt: row.created_at,
    })),
    ...recentThreads.map((row) => ({
      id: `thread-${row.id}`,
      title: row.title ?? 'Untitled discussion',
      href: forumThreadHref(row),
      kind: 'Discussion' as const,
      status: humanizeStatus(row.status),
      tone: tone(THREAD_TONES, row.status),
      createdAt: row.created_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6)

  const notifications: NotificationItem[] = notificationRows.map((row) => ({
    id: row.id,
    title: row.title,
    body: row.body ?? null,
    href: row.link_url ?? null,
    createdAt: row.created_at,
    isUnread: !row.read_at,
  }))

  return {
    counts: {
      reports,
      reportsAwaitingReview,
      submissions,
      submissionsAwaitingReview,
      discussions,
      unreadNotifications,
      openTickets,
    },
    activity,
    notifications,
    degraded: failures.count > 0,
  }
}
