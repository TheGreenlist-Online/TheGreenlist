import { describe, expect, it } from 'vitest'
import type { AiPrincipal } from '@/lib/ai/permissions'
import {
  PUBLIC_DATA_TOOLS,
  getPublicBusinessProfile,
  getPublicReport,
  searchEducationResources,
  searchPublicBusinesses,
  searchPublicForumThreads,
  searchPublicReports,
} from '@/lib/ai/tools/public-data'

/**
 * These tools were written against a guessed schema and every one of them was
 * wrong. The assertions below pin the verified column names and, more
 * importantly, the filters that keep unreviewed or unpublished text away from
 * the model — a silent revert of any of them would not fail a typecheck.
 */

type RecordedQuery = { table: string; columns: string; filters: string[] }

function fakeSupabase(rows: Array<Record<string, unknown>> = []) {
  const queries: RecordedQuery[] = []

  const client = {
    from(table: string) {
      const query: RecordedQuery = { table, columns: '', filters: [] }
      queries.push(query)

      const builder = {
        select(columns: string) {
          query.columns = columns
          return builder
        },
        eq(column: string, value: unknown) {
          query.filters.push(`eq:${column}=${String(value)}`)
          return builder
        },
        or(expression: string) {
          query.filters.push(`or:${expression}`)
          return builder
        },
        ilike(column: string, pattern: string) {
          query.filters.push(`ilike:${column}=${pattern}`)
          return builder
        },
        order() {
          return builder
        },
        limit() {
          return Promise.resolve({ data: rows, error: null })
        },
        maybeSingle() {
          return Promise.resolve({ data: rows[0] ?? null, error: null })
        },
      }

      return builder
    },
  }

  const principal = { supabase: client } as unknown as AiPrincipal
  return { principal, queries }
}

const A_UUID = '00000000-0000-4000-8000-000000000000'

describe('business tools', () => {
  it('reads name, state and city — the columns that actually exist', async () => {
    const { principal, queries } = fakeSupabase([{ id: A_UUID, name: 'Verdant Co' }])
    await searchPublicBusinesses.execute({ principal }, { query: 'verdant' })

    expect(queries[0].table).toBe('business_profiles')
    expect(queries[0].columns).toBe('id, name, state, city, verification_status')
    expect(queries[0].filters).toContain(`ilike:name=%verdant%`)
  })

  it('never selects a licence column, because none exists', async () => {
    const { principal, queries } = fakeSupabase([{ id: A_UUID, name: 'Verdant Co' }])
    await getPublicBusinessProfile.execute({ principal }, { businessId: A_UUID })

    expect(queries[0].columns).not.toMatch(/licen/i)
    expect(queries[0].columns).not.toContain('business_name')
  })
})

describe('report tools', () => {
  it('uses report_type and never selects the raw description', async () => {
    const { principal, queries } = fakeSupabase()
    await searchPublicReports.execute({ principal }, { query: 'mould' })

    expect(queries[0].table).toBe('reports')
    expect(queries[0].columns).toContain('report_type')
    expect(queries[0].columns).not.toContain('category')
    expect(queries[0].columns).not.toContain('description')
    expect(queries[0].filters).toContain('eq:is_anonymous=false')
  })

  it('searches only the title and the curated public summary', async () => {
    const { principal, queries } = fakeSupabase()
    await searchPublicReports.execute({ principal }, { query: 'mould' })

    const orFilter = queries[0].filters.find((filter) => filter.startsWith('or:')) ?? ''
    expect(orFilter).toContain('title.ilike')
    expect(orFilter).toContain('public_summary.ilike')
    expect(orFilter).not.toContain('description')
  })

  it('quotes search text so a comma cannot append a filter on a hidden column', async () => {
    const { principal, queries } = fakeSupabase()
    await searchPublicReports.execute({ principal }, { query: 'a,description.ilike.%secret%' })

    const orFilter = queries[0].filters.find((filter) => filter.startsWith('or:')) ?? ''
    // The injected text survives only inside a quoted value — PostgREST reads
    // it as part of the pattern rather than as a second condition. The literal
    // backslashes are the ilike wildcard escaping, re-escaped for the quotes.
    const quoted = '"%a,description.ilike.\\\\%secret\\\\%%"'
    expect(orFilter).toBe(`or:title.ilike.${quoted},public_summary.ilike.${quoted}`)
  })

  it('returns location as state and city, never a single location column', async () => {
    const { principal, queries } = fakeSupabase([{ id: A_UUID, title: 'A report' }])
    await getPublicReport.execute({ principal }, { reportId: A_UUID })

    expect(queries[0].columns).toContain('location_state')
    expect(queries[0].columns).toContain('location_city')
    expect(queries[0].columns).not.toContain('business_name')
    expect(queries[0].columns).not.toContain('description')
  })
})

describe('forum and education tools', () => {
  it('searches forum_threads, not forum_posts, and only published public threads', async () => {
    const { principal, queries } = fakeSupabase()
    await searchPublicForumThreads.execute({ principal }, { query: 'delivery' })

    expect(queries[0].table).toBe('forum_threads')
    expect(queries[0].filters).toContain('eq:status=published')
    expect(queries[0].filters).toContain('eq:visibility=public')
    expect(queries[0].filters).toContain('eq:is_anonymous=false')
    expect(queries[0].filters.join()).not.toContain('approved')
  })

  it('surfaces only APPROVED education resources', async () => {
    const { principal, queries } = fakeSupabase()
    await searchEducationResources.execute({ principal }, { query: 'safety' })

    expect(queries[0].filters).toContain('eq:status=APPROVED')
  })
})

describe('every public tool', () => {
  it('selects explicit columns and never a wildcard', async () => {
    const { principal, queries } = fakeSupabase([{ id: A_UUID, name: 'x', title: 'y' }])

    for (const tool of PUBLIC_DATA_TOOLS) {
      await tool.execute({ principal }, { query: 'anything', businessId: A_UUID, reportId: A_UUID })
    }

    expect(queries).toHaveLength(PUBLIC_DATA_TOOLS.length)
    for (const query of queries) {
      expect(query.columns).not.toContain('*')
      expect(query.columns).not.toContain('reporter_id')
      expect(query.columns).not.toContain('admin_notes')
      expect(query.columns).not.toContain('evidence')
    }
  })
})
