import { AiError } from '@/lib/ai/errors'
import type { AiPrincipal } from '@/lib/ai/permissions'
import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { moderationReviewOutputSchema, moderationReviewRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Upper bound on the reviewable text handed to the model. */
const MAX_EXCERPT_LENGTH = 4_000

/**
 * `moderation_queue_items` holds no text of its own — it points at the record
 * that was reported. Every item carries `report_id`, and `content_type` /
 * `content_id` identify the specific record when it is not the report itself.
 */
const QUEUE_ITEM_COLUMNS =
  'id, queue_status, content_type, content_id, reason, report_id, created_at, reports(id, title, description, public_summary)'

type QueueReport = {
  id: string
  title?: string | null
  description?: string | null
  public_summary?: string | null
}

type QueueItem = {
  id: string
  queue_status?: string | null
  content_type?: string | null
  content_id?: string | null
  reason?: string | null
  report_id?: string | null
  created_at?: string | null
  // PostgREST returns an embedded to-one relation as an object, but returns an
  // array when it cannot prove the relationship is to-one.
  reports?: QueueReport | QueueReport[] | null
}

function joinedReport(item: QueueItem): QueueReport | null {
  const joined = item.reports
  if (!joined) return null
  return Array.isArray(joined) ? joined[0] ?? null : joined
}

/**
 * Prefer the moderator-curated `public_summary`. `description` is the
 * reporter's raw narrative and may contain unreviewed sensitive detail, so it
 * is only used when there is no summary, and only truncated.
 */
function reportExcerpt(report: QueueReport | null): string | null {
  if (!report) return null
  const summary = report.public_summary?.trim()
  if (summary) return summary
  const description = report.description?.trim()
  return description ? description.slice(0, MAX_EXCERPT_LENGTH) : null
}

/**
 * Resolve a directly-reported forum record. `content_type` values other than
 * these fall back to the report the queue item is attached to rather than
 * guessing at a table.
 */
async function forumExcerpt(principal: AiPrincipal, item: QueueItem): Promise<string | null> {
  const table =
    item.content_type === 'forum_thread' ? 'forum_threads' : item.content_type === 'forum_post' ? 'forum_posts' : null

  if (!table || !item.content_id) return null

  const { data, error } = await principal.supabase
    .from(table)
    .select('id, body')
    .eq('id', item.content_id)
    .maybeSingle()

  if (error) {
    console.warn(`[ai:moderation-review] could not read ${table} for queue item ${item.id}`)
    return null
  }

  const body = (data as { body?: string | null } | null)?.body?.trim()
  return body ? body.slice(0, MAX_EXCERPT_LENGTH) : null
}

export const GET = createAiStatusRoute('moderation-review')

/**
 * Produces a moderation *recommendation* for a human reviewer.
 *
 * This route never writes a moderation decision. The recommendation is
 * returned to the reviewer's UI and recorded in `ai_audit_logs` with
 * `human_review_required = true`; applying an outcome remains a separate,
 * human-authored action against the existing moderation pipeline.
 */
export const POST = createAiRoute({
  feature: 'moderation-review',
  requestSchema: moderationReviewRequestSchema,
  outputSchema: moderationReviewOutputSchema,
  outputSchemaName: 'moderation_recommendation',
  inputClassification: 'moderation_context',
  outputClassification: 'moderation_recommendation',
  humanReviewRequired: true,
  async buildInput(request, principal) {
    // Read as the moderator. RLS on moderation_queue_items decides access; a
    // user without moderation rights gets nothing back even if they reach here.
    const { data, error } = await principal.supabase
      .from('moderation_queue_items')
      .select(QUEUE_ITEM_COLUMNS)
      .eq('id', request.queueItemId)
      .maybeSingle()

    if (error) {
      throw new AiError('upstream_error', 'The moderation queue could not be read right now.', { cause: error })
    }

    const item = data as QueueItem | null

    if (!item) {
      throw new AiError('forbidden', 'That moderation item is not available to you.')
    }

    const report = joinedReport(item)
    const excerpt = (await forumExcerpt(principal, item)) ?? reportExcerpt(report)

    if (!excerpt) {
      throw new AiError(
        'upstream_error',
        'This queue item has no reviewable text available to the assistant. Review it manually.',
      )
    }

    const instructions = [
      'Recommend an outcome for the human moderator reviewing this queue item.',
      item.content_type ? `Content type: ${item.content_type}.` : '',
      item.reason ? `It was flagged for: ${item.reason}.` : '',
      report?.title ? `The associated report is titled: ${report.title}.` : '',
      request.reviewerNote ? `The reviewer added this note: ${request.reviewerNote}` : '',
      'Give concrete reasons. You are advising, not deciding.',
    ]
      .filter(Boolean)
      .join(' ')

    return {
      input: [
        { role: 'developer', content: instructions },
        { role: 'user', content: asUntrustedContent(`moderation queue item ${item.id}`, excerpt) },
      ],
      records: [
        { recordType: 'moderation_queue_item', recordId: String(item.id) },
        ...(report ? [{ recordType: 'report', recordId: String(report.id) }] : []),
        ...(item.content_id ? [{ recordType: item.content_type ?? 'content', recordId: String(item.content_id) }] : []),
      ],
    }
  },
})
