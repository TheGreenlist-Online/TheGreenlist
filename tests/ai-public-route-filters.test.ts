import { describe, expect, it } from 'vitest'
import type { AiPrincipal } from '@/lib/ai/permissions'
import { buildBusinessTransparencyInput } from '@/app/api/ai/business-transparency/route'
import { buildForumSummaryInput } from '@/app/api/ai/forum-summary/route'

type RecordedQuery = { table: string; columns: string; filters: string[] }

function fakePrincipal(rowsByTable: Record<string, Array<Record<string, unknown>>>) {
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
        in(column: string, values: readonly unknown[]) {
          query.filters.push(`in:${column}=${JSON.stringify(values)}`)
          return builder
        },
        order() {
          return builder
        },
        limit() {
          return Promise.resolve({ data: rowsByTable[table] ?? [], error: null })
        },
        maybeSingle() {
          return Promise.resolve({ data: rowsByTable[table]?.[0] ?? null, error: null })
        },
      }

      return builder
    },
  }

  return {
    principal: {
      supabase: client,
      user: null,
      role: null,
      isPlatformOwner: false,
      tier: 'free_resident',
      dailyAllowance: 10,
      isAuthenticated: false,
    } as unknown as AiPrincipal,
    queries,
  }
}

describe('business transparency public record filters', () => {
  it('requires an active business and includes only eligible non-anonymous reports', async () => {
    const { principal, queries } = fakePrincipal({
      business_profiles: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          owner_id: 'private-owner-id',
          name: 'Verdant Co',
          is_active: true,
        },
      ],
      reports: [
        {
          id: '00000000-0000-4000-8000-000000000002',
          title: 'Public finding',
          status: 'corrected',
          description: 'private raw narrative',
          reporter_id: 'anonymous-reporter-id',
          evidence_file_id: 'private-evidence-id',
        },
      ],
    })

    const result = await buildBusinessTransparencyInput(
      { businessId: '00000000-0000-4000-8000-000000000001' },
      principal,
    )

    expect(queries[0].filters).toContain('eq:is_active=true')
    expect(queries[1].filters).toContain('in:status=["published","corrected"]')
    expect(queries[1].filters).toContain('eq:is_anonymous=false')
    expect(queries[1].columns).not.toMatch(/description|reporter_id|evidence/i)
    expect(JSON.stringify(result.input)).not.toMatch(/private-owner-id|private raw narrative|anonymous-reporter-id|private-evidence-id/)
  })
})

describe('forum summary public discussion filters', () => {
  it('requires a published public thread in an active forum and omits author/evidence fields', async () => {
    const { principal, queries } = fakePrincipal({
      forum_threads: [
        {
          id: '00000000-0000-4000-8000-000000000003',
          slug: 'public-thread',
          title: 'Public discussion',
          body: 'A public opening post',
          forums: { slug: 'evidence-desk', is_active: true },
          author_id: 'anonymous-thread-author',
        },
      ],
      forum_posts: [
        {
          id: '00000000-0000-4000-8000-000000000004',
          body: 'A public reply',
          author_id: 'anonymous-reply-author',
          evidence_file_id: 'private-evidence-id',
        },
      ],
    })

    const result = await buildForumSummaryInput(
      { threadId: '00000000-0000-4000-8000-000000000003' },
      principal,
    )

    expect(queries[0].columns).toContain('forums!inner(slug, is_active)')
    expect(queries[0].filters).toContain('eq:status=published')
    expect(queries[0].filters).toContain('eq:visibility=public')
    expect(queries[0].filters).toContain('eq:is_anonymous=false')
    expect(queries[0].filters).toContain('eq:forums.is_active=true')
    expect(queries[0].columns).not.toMatch(/author|evidence/i)
    expect(queries[1].columns).not.toMatch(/author|evidence/i)
    expect(JSON.stringify(result.input)).not.toMatch(/anonymous-thread-author|anonymous-reply-author|private-evidence-id/)
  })
})
