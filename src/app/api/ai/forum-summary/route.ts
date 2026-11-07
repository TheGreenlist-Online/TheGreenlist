import type { z } from 'zod'
import { AiError } from '@/lib/ai/errors'
import type { AiPrincipal } from '@/lib/ai/permissions'
import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { forumSummaryOutputSchema, forumSummaryRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Replies pulled into the summary. Bounded to keep the prompt small. */
const MAX_REPLIES = 40
const MAX_REPLY_LENGTH = 1_200
type ForumSummaryRequest = z.infer<typeof forumSummaryRequestSchema>

export const GET = createAiStatusRoute('forum-summary')

export async function buildForumSummaryInput(request: ForumSummaryRequest, principal: AiPrincipal) {
  // Read through the caller's session client. Inactive forums, unpublished or
  // private threads, and threads authored anonymously are never sent upstream.
  const { data: thread, error: threadError } = await principal.supabase
    .from('forum_threads')
    .select('id, slug, title, body, status, created_at, forums!inner(slug, is_active)')
    .eq('id', request.threadId)
    .eq('status', 'published')
    .eq('visibility', 'public')
    .eq('is_anonymous', false)
    .eq('forums.is_active', true)
    .maybeSingle()

  if (threadError) {
    throw new AiError('upstream_error', 'The forum could not be read right now.', { cause: threadError })
  }

  if (!thread) {
    throw new AiError('forbidden', 'That discussion is not available to you.')
  }

  const { data: posts, error: postsError } = await principal.supabase
    .from('forum_posts')
    .select('id, body, created_at')
    .eq('thread_id', request.threadId)
    .eq('status', 'published')
    .order('created_at', { ascending: true })
    .limit(MAX_REPLIES)

  if (postsError) {
    throw new AiError('upstream_error', 'The discussion replies could not be read right now.', {
      cause: postsError,
    })
  }

  const replies = posts ?? []
  // Author IDs are not selected; reply ordering is preserved without identities.
  const transcript = [
    `Thread title: ${thread.title}`,
    `Opening post: ${String(thread.body ?? '').slice(0, MAX_REPLY_LENGTH)}`,
    ...replies.map((reply, index) => `Reply ${index + 1}: ${String(reply.body ?? '').slice(0, MAX_REPLY_LENGTH)}`),
  ].join('\n\n')

  const relatedForum = thread.forums
  const forum = Array.isArray(relatedForum) ? relatedForum[0] : relatedForum
  const threadHref =
    forum?.slug && thread.slug
      ? `/forums/${encodeURIComponent(forum.slug)}/${encodeURIComponent(thread.slug)}`
      : null
  const instructions = [
    `Summarise this public thread. It has ${replies.length} public replies.`,
    'Participants are anonymised as "Reply N". Never guess who wrote something.',
    ...(threadHref ? ['Link the reader back to the original thread using the route in the thread details.'] : []),
  ]
    .filter(Boolean)
    .join(' ')

  const threadDetails = [
    threadHref ? `Thread URL: ${threadHref}` : '',
    request.focus ? `Reader focus: ${request.focus}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return {
    input: [
      { role: 'developer' as const, content: instructions },
      ...(threadDetails
        ? [{ role: 'user' as const, content: asUntrustedContent('thread details', threadDetails) }]
        : []),
      { role: 'user' as const, content: asUntrustedContent(`forum thread ${thread.id}`, transcript) },
    ],
    records: [
      { recordType: 'forum_thread', recordId: String(thread.id) },
      ...replies.map((reply) => ({ recordType: 'forum_post', recordId: String(reply.id) })),
    ],
  }
}

export const POST = createAiRoute({
  feature: 'forum-summary',
  requestSchema: forumSummaryRequestSchema,
  outputSchema: forumSummaryOutputSchema,
  outputSchemaName: 'forum_summary',
  inputClassification: 'public_record',
  outputClassification: 'public_summary',
  humanReviewRequired: false,
  buildInput: buildForumSummaryInput,
})
