-- AI audit trail for The Green List.
--
-- DECISION: a dedicated `ai_audit_logs` table rather than extending the
-- existing `audit_logs`.
--   * `audit_logs` records "an actor changed a resource" (action,
--     resource_type, resource_id, changes) and is read by admins as a change
--     history.
--   * An AI request is not a state change. It needs model, token usage, cost,
--     tool names, latency, and input/output sensitivity classifications, none
--     of which fit `audit_logs.changes` without turning that column into an
--     untyped grab bag.
--   * The two have different retention and access needs: users must be able to
--     see their own AI activity, which is NOT true of `audit_logs` (whose
--     current policy is admin/platform-owner read only). Widening that policy
--     to accommodate AI rows would weaken an intentionally hardened table.
-- Both tables coexist; a moderation action taken *because of* an AI
-- recommendation still writes its own `audit_logs` row, referencing the
-- ai_audit_logs.request_id.
--
-- This migration is purely additive: it creates one new table, its indexes and
-- its policies. It does not alter or drop any existing object, and it does not
-- touch any existing RLS policy.

CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Null for anonymous visitors using public features such as the Town Guide.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  feature TEXT NOT NULL CHECK (feature IN (
    'town-guide',
    'forum-summary',
    'report-assistant',
    'moderation-review',
    'business-transparency'
  )),

  model TEXT NOT NULL,

  -- Correlates this row with the x-request-id returned to the client and with
  -- any downstream audit_logs entry.
  request_id UUID NOT NULL,

  -- How sensitive the data sent upstream was. Deliberately a classification,
  -- not the content itself.
  input_classification TEXT NOT NULL CHECK (input_classification IN (
    'public_query',
    'user_owned_draft',
    'public_record',
    'moderation_context'
  )),

  -- References only: [{ "record_type": "report", "record_id": "<uuid>" }].
  -- Never record bodies, titles, drafts or evidence.
  records_accessed JSONB NOT NULL DEFAULT '[]'::jsonb,

  tool_names TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  output_classification TEXT NOT NULL CHECK (output_classification IN (
    'public_navigation',
    'public_summary',
    'user_private_assistance',
    'moderation_recommendation'
  )),

  -- True whenever the output must not be acted on without a human decision.
  human_review_required BOOLEAN NOT NULL DEFAULT false,

  -- Bounded metadata for moderation recommendations. Free-form model output is
  -- deliberately excluded from the audit trail.
  moderation_recommendation TEXT CHECK (moderation_recommendation IN (
    'ALLOW',
    'LABEL_ONLY',
    'WARN_USER',
    'HOLD_FOR_REVIEW',
    'ESCALATE_TO_OWNER',
    'RECOMMEND_ACCOUNT_REVIEW'
  )),
  moderation_confidence TEXT CHECK (moderation_confidence IN ('low', 'medium', 'high')),

  latency_ms INTEGER NOT NULL DEFAULT 0 CHECK (latency_ms >= 0),

  -- { "input": n, "output": n, "total": n }, or null when unknown.
  token_usage JSONB,

  estimated_cost_usd NUMERIC(12, 6),

  status TEXT NOT NULL CHECK (status IN ('success', 'refused', 'error', 'rate_limited', 'disabled')),

  -- Short diagnostic code only (e.g. 'rate_limited'). Never a prompt, a model
  -- response, or an upstream error body.
  error_code TEXT,

  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ai_audit_logs IS
  'Metadata-only audit trail for AI feature usage. Stores classifications and record references, never prompts, drafts, evidence or model output.';
COMMENT ON COLUMN public.ai_audit_logs.records_accessed IS
  'Array of { record_type, record_id } references to records the AI read. References only, never content.';
COMMENT ON COLUMN public.ai_audit_logs.human_review_required IS
  'True when the output is a recommendation that an accountable human must decide on before any action is taken.';
COMMENT ON COLUMN public.ai_audit_logs.moderation_recommendation IS
  'Bounded AI moderation recommendation enum. Never a final moderation decision.';
COMMENT ON COLUMN public.ai_audit_logs.moderation_confidence IS
  'Bounded confidence level for an AI moderation recommendation.';

CREATE INDEX IF NOT EXISTS ai_audit_logs_user_id_created_at_idx
  ON public.ai_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_audit_logs_feature_created_at_idx
  ON public.ai_audit_logs (feature, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_audit_logs_request_id_idx
  ON public.ai_audit_logs (request_id);
CREATE INDEX IF NOT EXISTS ai_audit_logs_human_review_idx
  ON public.ai_audit_logs (created_at DESC)
  WHERE human_review_required = true;

ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Read: a resident sees only their own AI activity. Admins and the platform
-- owner see all rows for operational oversight. Mirrors the authority check
-- used by the hardened `audit_authority_read` policy on audit_logs.
DROP POLICY IF EXISTS "ai_audit_logs_self_read" ON public.ai_audit_logs;
CREATE POLICY "ai_audit_logs_self_read" ON public.ai_audit_logs
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_owner') = 'true'
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
  )
);

-- Insert: only trusted server code may append operational audit rows. The
-- application uses a server-only Supabase secret/service-role credential for
-- this write. Public browser credentials receive no INSERT privilege and no
-- INSERT policy, so they cannot fabricate audit history.
DROP POLICY IF EXISTS "ai_audit_logs_self_insert" ON public.ai_audit_logs;
DROP POLICY IF EXISTS "ai_audit_logs_anon_insert" ON public.ai_audit_logs;

-- The audit trail is append-only for application roles. No UPDATE or DELETE
-- policy is defined.
REVOKE INSERT, UPDATE, DELETE ON public.ai_audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.ai_audit_logs TO authenticated;
GRANT INSERT ON public.ai_audit_logs TO service_role;
