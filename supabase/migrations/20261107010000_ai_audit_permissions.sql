-- Align AI audit access with the canonical role permission system and ensure
-- the trusted application role can append rows but cannot mutate or remove them.

ALTER TABLE public.ai_audit_logs
  DROP CONSTRAINT IF EXISTS ai_audit_logs_feature_check;

ALTER TABLE public.ai_audit_logs
  ADD CONSTRAINT ai_audit_logs_feature_check CHECK (feature IN (
    'town-guide',
    'records-guide',
    'forum-summary',
    'report-assistant',
    'moderation-review',
    'business-transparency'
  ));

DROP POLICY IF EXISTS "ai_audit_logs_self_read" ON public.ai_audit_logs;
CREATE POLICY "ai_audit_logs_self_read" ON public.ai_audit_logs
FOR SELECT TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.has_permission('audit.read')
);

REVOKE UPDATE, DELETE, TRUNCATE ON public.ai_audit_logs FROM service_role;
