-- Proposed completion hardening. Not a standalone hosted migration and not
-- applied to staging: prerequisites and complete activation acceptance remain.
-- Preserve the captured snapshot unchanged; test this delta separately.
create or replace function private.is_platform_owner(check_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from auth.users
   where id=check_user_id and raw_app_meta_data->'platform_owner'='true'::jsonb
 );
$$;

create or replace function public.has_permission(p_permission text)
returns boolean language sql stable security definer set search_path=''
as $$
 select exists (
   select 1 from public.role_permissions rp
   where rp.permission=p_permission
     and (public.is_platform_owner() or rp.role::text=public.current_platform_role()::text)
 );
$$;

-- Do not authorize from a stale or permissively coerced JWT owner flag.
alter policy profiles_owner_read on public.profiles to authenticated
using (id=(select auth.uid()) or is_public=true or (select public.is_platform_owner()));
alter policy profiles_owner_write on public.profiles to authenticated
using (id=(select auth.uid()) or (select public.is_platform_owner()))
with check (id=(select auth.uid()) or (select public.is_platform_owner()));

-- PUBLIC is inherited by every future database login, including a CI reader.
-- Existing explicit anon/authenticated grants remain for app RPCs and helpers.
revoke execute on all functions in schema public,private from public;
revoke maintain,truncate,references,trigger on all tables in schema public,private from anon,authenticated;
do $$ declare obj record; begin
 for obj in select p.oid::regprocedure as signature from pg_proc p
   join pg_namespace n on n.oid=p.pronamespace
   where n.nspname in ('public','private') and p.prorettype in ('trigger'::regtype,'event_trigger'::regtype) loop
   execute format('revoke execute on function %s from anon,authenticated',obj.signature);
 end loop;
 for obj in select n.nspname,c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p') loop
   execute format('alter table %I.%I force row level security',obj.nspname,obj.relname);
 end loop;
end $$;
