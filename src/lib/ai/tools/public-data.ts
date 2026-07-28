import { z } from 'zod'
import type { PostgrestError } from '@supabase/supabase-js'
import { redact } from '../errors'
import type { AiTool } from './types'
import { unavailable } from './types'

/**
 * Tools that read *public* platform records.
 *
 * All queries run through the caller's session client, so Supabase RLS is the
 * enforcement boundary. The explicit filters below are a second, independent
 * layer: even if a policy were mistakenly widened, these tools still refuse to
 * return anonymous reports or unpublished rows.
 *
 * Column lists are always explicit — never `select('*')` — so a column added to
 * production later cannot silently start flowing into a model prompt.
 */

const SEARCH_LIMIT = 5
const MAX_QUERY_LENGTH = 120

/** Escape PostgREST `ilike` wildcards so user text cannot alter the pattern. */
function toSearchPattern(query: string): string {
  const escaped = query.slice(0, MAX_QUERY_LENGTH).replace(/[%_\\]/g, (match) => `\\${match}`)
  return `%${escaped}%`
}

/**
 * Quote a pattern for use inside `.or(...)`, where a bare comma would be read
 * as a filter separator — letting crafted search text append conditions on
 * columns we deliberately never select (`description`, reporter identity) and
 * use the result count as an oracle. Inside double quotes those characters are
 * literal; only `"` and `\` need escaping.
 */
function toOrFilterPattern(query: string): string {
  return `"${toSearchPattern(query).replace(/["\\]/g, (match) => `\\${match}`)}"`
}

function logUnavailable(tool: string, error: PostgrestError) {
  console.warn(`[ai:tool:${tool}] unavailable: ${redact(error.message)}`)
}

// ---------------------------------------------------------------------------

const searchQuerySchema = z.object({
  query: z.string().trim().min(2).max(MAX_QUERY_LENGTH).describe('Free-text search terms.'),
})

export const searchPublicBusinesses: AiTool<{ query: string }, unknown> = {
  name: 'searchPublicBusinesses',
  description:
    'Search public business profiles by name. Returns name, location, and verification status. ' +
    'Use when the user asks about a specific business or wants to browse the Business District.',
  inputSchema: searchQuerySchema,
  async execute({ principal }, input) {
    const { data, error } = await principal.supabase
      .from('business_profiles')
      .select('id, name, state, city, verification_status')
      .ilike('name', toSearchPattern(input.query))
      .limit(SEARCH_LIMIT)

    if (error) {
      logUnavailable('searchPublicBusinesses', error)
      return { result: unavailable('The business directory could not be searched right now.') }
    }

    const businesses = data ?? []
    return {
      result: {
        businesses: businesses.map((business) => ({
          id: business.id,
          name: business.name,
          state: business.state,
          city: business.city,
          verificationStatus: business.verification_status,
          standardHref: `/businesses/${business.id}`,
        })),
        note:
          businesses.length === 0
            ? 'No matching public business profiles. Do not speculate about businesses that were not returned.'
            : 'Verification status is a platform record. Never describe a business as verified unless this field says so.',
      },
      records: businesses.map((business) => ({
        recordType: 'business_profile',
        recordId: String(business.id),
      })),
    }
  },
}

export const getPublicBusinessProfile: AiTool<{ businessId: string }, unknown> = {
  name: 'getPublicBusinessProfile',
  description:
    'Fetch one public business profile by id: name, location, and verification status. ' +
    'Licence details are not tracked on this record and are never returned.',
  inputSchema: z.object({ businessId: z.uuid().describe('The business profile id.') }),
  async execute({ principal }, input) {
    const { data, error } = await principal.supabase
      .from('business_profiles')
      .select('id, name, state, city, verification_status, created_at')
      .eq('id', input.businessId)
      .maybeSingle()

    if (error) {
      logUnavailable('getPublicBusinessProfile', error)
      return { result: unavailable('That business profile could not be read right now.') }
    }

    if (!data) {
      return { result: { found: false, note: 'No public business profile with that id.' } }
    }

    return {
      result: {
        found: true,
        id: data.id,
        name: data.name,
        state: data.state,
        city: data.city,
        verificationStatus: data.verification_status,
        listedSince: data.created_at,
        standardHref: `/businesses/${data.id}`,
        note: 'Licence details are not yet tracked on the business profile. Never state or imply a licence number or licensing status.',
      },
      records: [{ recordType: 'business_profile', recordId: String(data.id) }],
    }
  },
}

// ---------------------------------------------------------------------------

/**
 * Reports are the most sensitive public-facing record. Anonymous reports are
 * excluded here in addition to the RLS policy, and reporter identity columns
 * are never selected at all — the model cannot leak a field it never receives.
 *
 * `description` is deliberately neither searched nor selected: it holds the
 * reporter's raw narrative, which may not have been reviewed. Only `title` and
 * the moderator-curated `public_summary` are exposed.
 */
export const searchPublicReports: AiTool<{ query: string }, unknown> = {
  name: 'searchPublicReports',
  description:
    'Search publicly listed reports by title or public summary. Returns title, report type, and status only. ' +
    'Never returns anonymous reports, reporter identities, full descriptions, or evidence.',
  inputSchema: searchQuerySchema,
  async execute({ principal }, input) {
    const pattern = toOrFilterPattern(input.query)

    const { data, error } = await principal.supabase
      .from('reports')
      .select('id, title, report_type, status, verification_status, business_id, created_at')
      .eq('is_anonymous', false)
      .or(`title.ilike.${pattern},public_summary.ilike.${pattern}`)
      .order('created_at', { ascending: false })
      .limit(SEARCH_LIMIT)

    if (error) {
      logUnavailable('searchPublicReports', error)
      return { result: unavailable('The transparency archives could not be searched right now.') }
    }

    const reports = data ?? []
    return {
      result: {
        reports: reports.map((report) => ({
          id: report.id,
          title: report.title,
          reportType: report.report_type,
          status: report.status,
          verificationStatus: report.verification_status,
          businessId: report.business_id,
          standardHref: `/reports/${report.id}`,
        })),
        note:
          'A report is an allegation unless its status is "verified". Always state the status and never imply guilt.',
      },
      records: reports.map((report) => ({ recordType: 'report', recordId: String(report.id) })),
    }
  },
}

export const getPublicReport: AiTool<{ reportId: string }, unknown> = {
  name: 'getPublicReport',
  description:
    'Fetch one publicly listed report by id: title, report type, status, location and public summary. ' +
    'The full description, evidence files, reporter identity, and anonymous reports are never returned.',
  inputSchema: z.object({ reportId: z.uuid().describe('The report id.') }),
  async execute({ principal }, input) {
    const { data, error } = await principal.supabase
      .from('reports')
      .select(
        'id, title, report_type, status, verification_status, business_id, public_summary, location_state, location_city, created_at, updated_at',
      )
      .eq('id', input.reportId)
      .eq('is_anonymous', false)
      .maybeSingle()

    if (error) {
      logUnavailable('getPublicReport', error)
      return { result: unavailable('That report could not be read right now.') }
    }

    if (!data) {
      return {
        result: {
          found: false,
          note: 'No publicly listed report with that id. It may not exist, or it may be anonymous or restricted. Do not speculate about its contents.',
        },
      }
    }

    return {
      result: {
        found: true,
        id: data.id,
        title: data.title,
        reportType: data.report_type,
        status: data.status,
        verificationStatus: data.verification_status,
        businessId: data.business_id,
        publicSummary: data.public_summary,
        locationState: data.location_state,
        locationCity: data.location_city,
        submittedAt: data.created_at,
        lastUpdatedAt: data.updated_at,
        standardHref: `/reports/${data.id}`,
      },
      records: [{ recordType: 'report', recordId: String(data.id) }],
    }
  },
}

// ---------------------------------------------------------------------------

/**
 * Threads live in `forum_threads`; `forum_posts` holds their replies. Only
 * thread titles are searched, never reply bodies.
 *
 * `is_anonymous` on a thread describes its *authorship*, not its visibility —
 * an anonymous thread is still public. Excluding them here is a deliberate
 * extra-conservative choice: search results are surfaced by the assistant
 * without a human in the loop, so a thread whose author chose anonymity is
 * never amplified by AI. A reader can still find it through the forum itself.
 */
export const searchPublicForumThreads: AiTool<{ query: string }, unknown> = {
  name: 'searchPublicForumThreads',
  description:
    'Search published public forum threads by title. Returns titles and links, not thread bodies, replies or author identities.',
  inputSchema: searchQuerySchema,
  async execute({ principal }, input) {
    const { data, error } = await principal.supabase
      .from('forum_threads')
      .select('id, title, forum_id, created_at')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .eq('is_anonymous', false)
      .ilike('title', toSearchPattern(input.query))
      .order('created_at', { ascending: false })
      .limit(SEARCH_LIMIT)

    if (error) {
      logUnavailable('searchPublicForumThreads', error)
      return { result: unavailable('The forum could not be searched right now.') }
    }

    const threads = data ?? []
    return {
      result: {
        threads: threads.map((thread) => ({
          id: thread.id,
          title: thread.title,
          standardHref: `/forums/${thread.id}`,
        })),
        note: threads.length === 0 ? 'No matching published public threads.' : 'Author identities are not available.',
      },
      records: threads.map((thread) => ({ recordType: 'forum_thread', recordId: String(thread.id) })),
    }
  },
}

export const searchEducationResources: AiTool<{ query: string }, unknown> = {
  name: 'searchEducationResources',
  description:
    'Search the Education Library for published educational resources. Use for policy context, consumer safety, and general cannabis education questions.',
  inputSchema: searchQuerySchema,
  async execute({ principal }, input) {
    // Only APPROVED resources exist as far as the assistant is concerned.
    // The status CHECK also allows DRAFT, PENDING_REVIEW, REJECTED and
    // ARCHIVED, none of which have cleared editorial review.
    const { data, error } = await principal.supabase
      .from('education_resources')
      .select('id, title')
      .eq('status', 'APPROVED')
      .ilike('title', toSearchPattern(input.query))
      .limit(SEARCH_LIMIT)

    if (error) {
      logUnavailable('searchEducationResources', error)
      return {
        result: unavailable(
          'The Education Library could not be searched right now. Point the user at /education instead.',
        ),
      }
    }

    const resources = data ?? []
    return {
      result: {
        resources: resources.map((resource) => ({
          id: resource.id,
          title: resource.title,
          standardHref: '/education',
        })),
        note: 'Educational material is never medical or legal advice.',
      },
      records: resources.map((resource) => ({
        recordType: 'education_resource',
        recordId: String(resource.id),
      })),
    }
  },
}

export const PUBLIC_DATA_TOOLS = [
  searchPublicBusinesses,
  getPublicBusinessProfile,
  searchPublicReports,
  getPublicReport,
  searchPublicForumThreads,
  searchEducationResources,
] as const
