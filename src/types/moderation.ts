// Types for the moderation/admin surface (moderation_queue, moderation_queue_items,
// moderation_batches, audit_logs, nda_signatures).
//
// `moderation_queue`, `audit_logs` shapes are taken directly from the task's documented
// live-DB schema.
//
// ASSUMPTION FLAG: `moderation_queue_items` and `moderation_batches` have no existing
// code, type, or migration references anywhere in this repo (confirmed via repo-wide
// grep — see greenlist_audit.md, section 6 / section 10). The shapes below are a
// best-effort, conservative guess and have NOT been verified against the live database.
// Any code path touching these two tables should be treated as provisional until
// confirmed against the actual Supabase schema.

export type ModerationItemType =
  | 'report'
  | 'forum_thread'
  | 'forum_post'
  | 'evidence_file'
  | 'education_resource'

export type ModerationStatus = 'pending' | 'in_review' | 'resolved'

export type ModerationRiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface ModerationQueueRow {
  id: string
  item_type: ModerationItemType | string
  item_id: string
  status: ModerationStatus | string
  risk_level: ModerationRiskLevel | string
  assigned_to: string | null
  ai_notes: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface ModerationQueueRowWithAssignee extends ModerationQueueRow {
  assignee?: {
    id: string
    display_name: string | null
  } | null
}

/**
 * ASSUMPTION (unverified against live DB): `moderation_queue_items` is treated as a
 * join/detail table representing membership of a single `moderation_queue` entry within
 * a `moderation_batches` batch — e.g. for bulk AI-flagged sweeps that get triaged together.
 * Guessed shape:
 *   - id: uuid primary key
 *   - batch_id: uuid → moderation_batches.id
 *   - queue_id: uuid → moderation_queue.id
 *   - position: integer (ordering within the batch), nullable
 *   - created_at: timestamptz
 * Not exercised by any route in this change set — no UI currently depends on this guess.
 */
export interface ModerationQueueItemRow {
  id: string
  batch_id: string
  queue_id: string
  position: number | null
  created_at: string
}

/**
 * ASSUMPTION (unverified against live DB): `moderation_batches` is treated as a
 * batch-level grouping record, e.g. one row per automated moderation sweep/run.
 * Guessed shape:
 *   - id: uuid primary key
 *   - label: text, human-readable batch name/description, nullable
 *   - status: text (pending|in_review|resolved), default 'pending'
 *   - created_by: uuid → profiles, nullable (who/what triggered the batch — could be
 *     an admin or a system/AI job)
 *   - created_at: timestamptz
 *   - updated_at: timestamptz
 * Not exercised by any route in this change set — no UI currently depends on this guess.
 * Explicitly deferred per task instructions ("if moderation_batches' purpose is
 * unclear/low-value to expose in UI yet, it's fine to skip a dedicated batches view").
 */
export interface ModerationBatchRow {
  id: string
  label: string | null
  status: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface AuditLogRow {
  id: string
  actor_id: string | null
  action: string
  target_type: string | null
  target_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface AuditLogRowWithActor extends AuditLogRow {
  actor?: {
    id: string
    display_name: string | null
  } | null
}

export const NDA_DOCUMENT_VERSION = 'v1'

export interface NdaSignatureRow {
  id: string
  user_id: string
  signed_at: string
  ip_address: string | null
  document_version: string
}
