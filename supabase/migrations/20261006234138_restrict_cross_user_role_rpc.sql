-- Avoid cross-user role enumeration while retaining compatibility helpers.
create or replace function public.platform_role(p_user uuid)
returns public.app_role language plpgsql stable security definer set search_path='' as $$
declare result public.app_role;
begin
 if auth.uid() is null then return null; end if;
 -- Separate branches avoid recursive is_admin/current_role evaluation on self.
 if p_user is distinct from auth.uid() then
  if not coalesce(public.is_admin(),false) then return null; end if;
 end if;
 select p.role into result from public.profiles p where p.id=p_user;
 return result;
end $$;
revoke execute on function public.platform_role(uuid) from public,anon;
grant execute on function public.platform_role(uuid) to authenticated,service_role;
-- has_role remains callable for authenticated policies; unauthorized lookups
-- now return NULL through platform_role rather than revealing a target's role.
