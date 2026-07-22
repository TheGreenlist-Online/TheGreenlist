-- Consolidate authorization policies and remove direct access to trigger helpers.

DROP POLICY IF EXISTS "profiles_platform_owner_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_platform_owner_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_owner_read" ON public.profiles;
CREATE POLICY "profiles_owner_read" ON public.profiles
FOR SELECT TO authenticated
USING (
  id = (SELECT auth.uid())
  OR is_public = true
  OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_owner') = 'true'
);

DROP POLICY IF EXISTS "profiles_owner_write" ON public.profiles;
CREATE POLICY "profiles_owner_write" ON public.profiles
FOR UPDATE TO authenticated
USING (
  id = (SELECT auth.uid())
  OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_owner') = 'true'
)
WITH CHECK (
  id = (SELECT auth.uid())
  OR ((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_owner') = 'true'
);

DROP POLICY IF EXISTS "audit_owner_read" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_admin_read" ON public.audit_logs;
CREATE POLICY "audit_authority_read" ON public.audit_logs
FOR SELECT TO authenticated
USING (
  ((SELECT auth.jwt()) -> 'app_metadata' ->> 'platform_owner') = 'true'
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.role = 'ADMIN'
  )
);

REVOKE EXECUTE ON FUNCTION public.handle_new_user_profile() FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs(actor_id);
