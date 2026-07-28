import { z } from 'zod'

/**
 * Request and structured-output schemas for every AI feature.
 *
 * Output schemas are converted to JSON Schema and handed to the OpenAI
 * Responses API in strict mode. Strict mode requires that every property is
 * listed in `required`, so *optional* output fields are modelled as
 * `.nullable()` rather than `.optional()`. Request schemas have no such
 * constraint and use `.optional()` normally.
 */

const MAX_MESSAGE_LENGTH = 2_000

export const conversationTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(MAX_MESSAGE_LENGTH),
})

export type ConversationTurn = z.infer<typeof conversationTurnSchema>

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export const townGuideRequestSchema = z.object({
  message: z.string().trim().min(3, 'Ask a question of at least 3 characters.').max(MAX_MESSAGE_LENGTH),
  /** Where the user currently is, so the guide can give relative directions. */
  currentPath: z.string().trim().max(512).optional(),
  /** Prior turns, oldest first. Capped to keep the request small. */
  history: z.array(conversationTurnSchema).max(6).optional(),
})

export const forumSummaryRequestSchema = z.object({
  threadId: z.uuid('A valid thread id is required.'),
  focus: z.string().trim().max(500).optional(),
})

export const reportAssistantRequestSchema = z.object({
  /** The user's own draft. Never another user's report. */
  draft: z.string().trim().min(20, 'Add a little more detail before asking for help.').max(8_000),
  category: z.string().trim().max(120).optional(),
  /**
   * Opt-in acknowledgement that the draft text is sent to the AI provider.
   * Required — the assistant refuses without it.
   */
  consentToProcess: z.literal(true, {
    error: 'You must consent to sending your draft text to the AI provider.',
  }),
})

export const moderationReviewRequestSchema = z.object({
  /** Row id in the existing moderation queue. */
  queueItemId: z.uuid('A valid moderation queue item id is required.'),
  reviewerNote: z.string().trim().max(1_000).optional(),
})

export const businessTransparencyRequestSchema = z.object({
  businessId: z.uuid('A valid business id is required.'),
  question: z.string().trim().max(MAX_MESSAGE_LENGTH).optional(),
})

// ---------------------------------------------------------------------------
// Structured outputs
// ---------------------------------------------------------------------------

const sourceSchema = z.object({
  recordType: z.string().describe('The kind of record cited, e.g. business_profile, report, policy, town_location.'),
  recordId: z.string().describe('Identifier of the cited record.'),
  label: z.string().describe('Human-readable label for the cited record.'),
})

export const townGuideOutputSchema = z.object({
  message: z.string().describe('A concise, friendly answer for the resident. Plain text, no markdown headings.'),
  destinations: z
    .array(
      z.object({
        title: z.string(),
        standardHref: z.string().describe('Path on the standard site, always starting with /.'),
        townHref: z.string().nullable().describe('Equivalent town path, or null when the location has no town route.'),
        reason: z.string().describe('Why this destination answers the question.'),
      }),
    )
    .max(5),
  sources: z.array(sourceSchema).max(8),
  safetyNotice: z
    .string()
    .nullable()
    .describe('A caution shown to the user, or null. Use for legal, medical, or allegation-vs-fact warnings.'),
})

export type TownGuideOutput = z.infer<typeof townGuideOutputSchema>

export const forumSummaryOutputSchema = z.object({
  summary: z.string().describe('Neutral summary of the public discussion.'),
  verifiedFacts: z.array(z.string()).max(10).describe('Only claims corroborated by platform records.'),
  allegations: z.array(z.string()).max(10).describe('Unverified claims, phrased explicitly as allegations.'),
  openDisagreements: z
    .array(z.string())
    .max(10)
    .describe('Points where participants genuinely disagree. Preserve the disagreement, do not resolve it.'),
  sources: z.array(sourceSchema).max(8),
  safetyNotice: z.string().nullable(),
})

export type ForumSummaryOutput = z.infer<typeof forumSummaryOutputSchema>

export const reportAssistantOutputSchema = z.object({
  chronology: z
    .array(z.object({ when: z.string(), what: z.string() }))
    .max(15)
    .describe('Events in the order the draft implies. Use the draft\'s own wording for dates; never invent one.'),
  observations: z.array(z.string()).max(15).describe('Things the reporter states they directly witnessed.'),
  conclusions: z.array(z.string()).max(15).describe('Inferences or opinions in the draft, separated from observations.'),
  missingFields: z
    .array(z.object({ field: z.string(), why: z.string() }))
    .max(10)
    .describe('Factual gaps a reviewer would likely ask about.'),
  sensitiveInformation: z
    .array(z.object({ excerpt: z.string(), concern: z.string() }))
    .max(10)
    .describe('Personal or identifying details the reporter may want to remove before submitting.'),
  suggestedEvidenceCategories: z.array(z.string()).max(10),
  safetyNotice: z.string().nullable(),
})

export type ReportAssistantOutput = z.infer<typeof reportAssistantOutputSchema>

export const MODERATION_RECOMMENDATIONS = [
  'ALLOW',
  'LABEL_ONLY',
  'WARN_USER',
  'HOLD_FOR_REVIEW',
  'ESCALATE_TO_OWNER',
  'RECOMMEND_ACCOUNT_REVIEW',
] as const

export type ModerationRecommendation = (typeof MODERATION_RECOMMENDATIONS)[number]

export const moderationReviewOutputSchema = z.object({
  recommendation: z.enum(MODERATION_RECOMMENDATIONS).describe('A recommendation only. It is never applied automatically.'),
  confidence: z.enum(['low', 'medium', 'high']),
  reasons: z.array(z.string()).min(1).max(8).describe('Why this recommendation. Required for every recommendation.'),
  policyReferences: z.array(z.string()).max(6),
  riskFactors: z.array(z.string()).max(8),
  requiresHumanReview: z.literal(true).describe('Always true. Every AI moderation recommendation needs a human decision.'),
  safetyNotice: z.string().nullable(),
})

export type ModerationReviewOutput = z.infer<typeof moderationReviewOutputSchema>

export const businessTransparencyOutputSchema = z.object({
  summary: z.string().describe('What the public record actually shows. No trust score, no overall grade.'),
  publicDisclosures: z.array(z.object({ label: z.string(), detail: z.string() })).max(12),
  missingTransparencyFields: z
    .array(z.object({ field: z.string(), why: z.string() }))
    .max(12)
    .describe('Disclosures a transparent business would normally publish that are absent here.'),
  reportHistorySummary: z.string().describe('Public report history with statuses. Allegations must stay labelled as such.'),
  sources: z.array(sourceSchema).max(10),
  safetyNotice: z.string().nullable(),
})

export type BusinessTransparencyOutput = z.infer<typeof businessTransparencyOutputSchema>

// ---------------------------------------------------------------------------
// JSON Schema conversion
// ---------------------------------------------------------------------------

/**
 * Convert a Zod schema to the JSON Schema dialect the Responses API expects in
 * strict mode. The `$schema` annotation is stripped because OpenAI rejects it.
 */
export function toResponseJsonSchema(schema: z.ZodType): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, { target: 'draft-2020-12' }) as Record<string, unknown>
  delete jsonSchema.$schema
  return jsonSchema
}
