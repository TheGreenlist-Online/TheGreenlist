import type { SupabaseClient } from '@supabase/supabase-js'
import type { AiFeature } from './config'
import { redact } from './errors'

/**
 * AI audit trail.
 *
 * Writes one row per AI request to `public.ai_audit_logs`. The table stores
 * *metadata and references only* — never prompt text, report drafts, evidence,
 * or model output. See `prisma/migrations/20260728120000_ai_audit_logs/`.
 *
 * Auditing must never break the feature it audits: a failed insert (missing
 * table in an un-migrated environment, RLS denial, transient error) is logged
 * server-side and swallowed.
 */

export const AI_AUDIT_TABLE = 'ai_audit_logs'

/** How sensitive the input was, so reviewers know what was sent upstream. */
export type InputClassification =
  | 'public_query'
  | 'user_owned_draft'
  | 'public_record'
  | 'moderation_context'

/** How sensitive the output is, so reviewers know what the user received. */
export type OutputClassification =
  | 'public_navigation'
  | 'public_summary'
  | 'user_private_assistance'
  | 'moderation_recommendation'

export type AiAuditStatus = 'success' | 'refused' | 'error' | 'rate_limited' | 'disabled'

/** A record the AI actually read, so access can be reconstructed later. */
export type AccessedRecord = Readonly<{ recordType: string; recordId: string }>

export type AiAuditEntry = Readonly<{
  userId: string | null
  feature: AiFeature
  model: string
  requestId: string
  inputClassification: InputClassification
  recordsAccessed: readonly AccessedRecord[]
  toolNames: readonly string[]
  outputClassification: OutputClassification
  humanReviewRequired: boolean
  /** Bounded moderation metadata only; never free-form model output. */
  moderationRecommendation: string | null
  moderationConfidence: 'low' | 'medium' | 'high' | null
  latencyMs: number
  tokenUsage: Readonly<{ input: number; output: number; total: number }> | null
  estimatedCostUsd: number | null
  status: AiAuditStatus
  /** Short, non-sensitive diagnostic. Never the prompt or the model output. */
  errorCode: string | null
}>

/**
 * Per-1M-token pricing used for a rough cost estimate. Unknown models fall back
 * to null rather than a wrong number, so dashboards do not show fake costs.
 */
const MODEL_PRICING_USD_PER_MTOK: Readonly<Record<string, { input: number; output: number }>> = {
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1': { input: 2, output: 8 },
}

export function estimateCostUsd(
  model: string,
  usage: { input: number; output: number } | null,
): number | null {
  if (!usage) return null
  const pricing = MODEL_PRICING_USD_PER_MTOK[model]
  if (!pricing) return null

  const cost = (usage.input * pricing.input + usage.output * pricing.output) / 1_000_000
  return Number(cost.toFixed(6))
}

/**
 * Persist an audit entry. Resolves to `true` when the row was written.
 * Never throws.
 */
export async function recordAiAudit(
  supabase: SupabaseClient,
  entry: AiAuditEntry,
): Promise<boolean> {
  const row = {
    user_id: entry.userId,
    feature: entry.feature,
    model: entry.model,
    request_id: entry.requestId,
    input_classification: entry.inputClassification,
    records_accessed: entry.recordsAccessed.map((record) => ({
      record_type: record.recordType,
      record_id: record.recordId,
    })),
    tool_names: [...entry.toolNames],
    output_classification: entry.outputClassification,
    human_review_required: entry.humanReviewRequired,
    moderation_recommendation: entry.moderationRecommendation,
    moderation_confidence: entry.moderationConfidence,
    latency_ms: Math.round(entry.latencyMs),
    token_usage: entry.tokenUsage
      ? {
          input: entry.tokenUsage.input,
          output: entry.tokenUsage.output,
          total: entry.tokenUsage.total,
        }
      : null,
    estimated_cost_usd: entry.estimatedCostUsd,
    status: entry.status,
    error_code: entry.errorCode,
  }

  const { error } = await supabase.from(AI_AUDIT_TABLE).insert(row)

  if (error) {
    console.warn(
      `[ai:audit] could not write audit row feature=${entry.feature} request=${entry.requestId} ` +
        `reason=${redact(error.message)}`,
    )
    return false
  }

  return true
}

export function createRequestId(): string {
  return globalThis.crypto.randomUUID()
}
