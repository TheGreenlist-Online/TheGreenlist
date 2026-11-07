-- Production's compatibility current_platform_role() returns text, while
-- role_permissions.role is app_role. Compare text on both sides so both the
-- production helper and the enum-returning repository helper are supported.
create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path='' as $$
 select public.is_platform_owner() or exists (
  select 1 from public.role_permissions rp
  where rp.role::text = public.current_platform_role()::text
    and rp.permission = p_permission
 );
$$;
