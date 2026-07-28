import { AiError } from '@/lib/ai/errors'
import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { moderationReviewOutputSchema, moderationReviewRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Columns read from the existing `moderation_queue_items` table.
 *
 * KNOWN LIMITATION: this repository's migration history is behind production
 * (see docs/ASSESSMENT.md §4), so the real column names could not be verified
 * from source. The query below tries this list and falls back to a minimal
 * select if Postgres rejects it, rather than guessing wrong and 500-ing. A
 * maintainer with production schema access should reconcile this constant.
 */
const CONTENT_COLUMNS = 'id, status, content_type, content_id, content_excerpt, reason, created_at'
const FALLBACK_COLUMNS = 'id, status, created_at'

type QueueItem = {
  id: string
  status?: string | null
  content_type?: string | null
  content_id?: string | null
  content_excerpt?: string | null
  reason?: string | null
  created_at?: string | null
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
    let item: QueueItem | null = null

    const primary = await principal.supabase
      .from('moderation_queue_items')
      .select(CONTENT_COLUMNS)
      .eq('id', request.queueItemId)
      .maybeSingle()

    if (primary.error) {
      const fallback = await principal.supabase
        .from('moderation_queue_items')
        .select(FALLBACK_COLUMNS)
        .eq('id', request.queueItemId)
        .maybeSingle()

      if (fallback.error) {
        throw new AiError('upstream_error', 'The moderation queue could not be read right now.', {
          cause: fallback.error,
        })
      }
      item = fallback.data as QueueItem | null
    } else {
      item = primary.data as QueueItem | null
    }

    if (!item) {
      throw new AiError('forbidden', 'That moderation item is not available to you.')
    }

    const excerpt = item.content_excerpt?.trim()
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
        ...(item.content_id ? [{ recordType: item.content_type ?? 'content', recordId: String(item.content_id) }] : []),
      ],
    }
  },
})
