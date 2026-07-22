-- Supabase Auth is the sole identity provider. Roles are controlled by the
-- platform owner and are never writable through ordinary profile updates.

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"platform_owner": true}'::jsonb
WHERE lower(email) = lower('mcarter136988@gmail.com');

UPDATE public.profiles AS profile
SET role = 'ADMIN'
FROM auth.users AS account
WHERE profile.id = account.id
  AND account.raw_app_meta_data ->> 'platform_owner' = 'true';

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.is_platform_owner(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = check_user_id
      AND raw_app_meta_data ->> 'platform_owner' = 'true'
  );
$$;

REVOKE ALL ON FUNCTION private.is_platform_owner(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.protect_profile_authority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.id <> OLD.id THEN
    RAISE EXCEPTION 'Profile identity cannot be changed';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role AND NOT private.is_platform_owner(auth.uid()) THEN
    RAISE EXCEPTION 'Only the platform owner can assign roles';
  END IF;

  IF private.is_platform_owner(OLD.id) AND NEW.role IS DISTINCT FROM 'ADMIN' THEN
    RAISE EXCEPTION 'The platform owner must retain the ADMIN role';
  END IF;

  IF NEW.role IS DISTINCT FROM OLD.role THEN
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
    VALUES (
      auth.uid(),
      'ROLE_ASSIGNED_BY_PLATFORM_OWNER',
      'profile',
      NEW.id::text,
      jsonb_build_object('from', OLD.role, 'to', NEW.role, 'human_review_required', true)
    );
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.protect_profile_authority() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS protect_profile_authority ON public.profiles;
CREATE TRIGGER protect_profile_authority
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION private.protect_profile_authority();

DROP POLICY IF EXISTS "profiles_platform_owner_read" ON public.profiles;
CREATE POLICY "profiles_platform_owner_read" ON public.profiles
FOR SELECT TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'platform_owner') = 'true');

DROP POLICY IF EXISTS "profiles_platform_owner_update" ON public.profiles;
CREATE POLICY "profiles_platform_owner_update" ON public.profiles
FOR UPDATE TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'platform_owner') = 'true')
WITH CHECK ((SELECT auth.jwt() -> 'app_metadata' ->> 'platform_owner') = 'true');

DROP POLICY IF EXISTS "audit_owner_read" ON public.audit_logs;
CREATE POLICY "audit_owner_read" ON public.audit_logs
FOR SELECT TO authenticated
USING ((SELECT auth.jwt() -> 'app_metadata' ->> 'platform_owner') = 'true');
