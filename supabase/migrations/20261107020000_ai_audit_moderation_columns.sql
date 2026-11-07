-- Reconcile audit tables created before bounded moderation metadata was added.
-- No grants, policies, row rewrites, or defaults are introduced. Historical
-- rows retain NULL for these optional metadata fields.
--
-- Existing-table rollout: apply this repair before 20261019050000 if its
-- moderation columns are missing (that migration comments on both columns).
-- Review the target's migration history first; do not blindly db push a
-- separately bootstrapped staging database. This does not supply missing
-- canonical permission helpers required by 20261107010000.

ALTER TABLE public.ai_audit_logs
  ADD COLUMN IF NOT EXISTS moderation_recommendation TEXT
    CHECK (moderation_recommendation IN (
      'ALLOW',
      'LABEL_ONLY',
      'WARN_USER',
      'HOLD_FOR_REVIEW',
      'ESCALATE_TO_OWNER',
      'RECOMMEND_ACCOUNT_REVIEW'
    )),
  ADD COLUMN IF NOT EXISTS moderation_confidence TEXT
    CHECK (moderation_confidence IN ('low', 'medium', 'high'));

COMMENT ON COLUMN public.ai_audit_logs.moderation_recommendation IS
  'Bounded AI moderation recommendation enum. Never a final moderation decision.';
COMMENT ON COLUMN public.ai_audit_logs.moderation_confidence IS
  'Bounded confidence level for an AI moderation recommendation.';
