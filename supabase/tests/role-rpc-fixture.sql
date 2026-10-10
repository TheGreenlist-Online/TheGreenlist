-- Synthetic disposable PostgreSQL database ONLY; never apply to a hosted project.
-- Minimal role-helper contract from 20260913071000_unify_role_system.sql.
-- This is not a replay of the deployed schema, grants, or all RLS policies.
create role anon;
create role authenticated;
create role service_role;
create schema auth;
create schema private;
create type public.app_role as enum ('USER', 'ADMIN', 'MODERATOR');
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb, raw_app_meta_data jsonb default '{}');
create function auth.uid() returns uuid language sql stable as $$
 select (nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
$$;
create table public.profiles(id uuid primary key references auth.users, role public.app_role default 'USER');
create function public.fixture_user() returns trigger language plpgsql as $$
 begin insert into public.profiles(id) values(new.id); return new; end;
$$;
create trigger fixture_user after insert on auth.users for each row execute function public.fixture_user();
create function public.platform_role(p_user uuid) returns public.app_role language sql stable security definer set search_path='' as $$
 select p.role from public.profiles p where p.id=p_user;
$$;
create function public.current_platform_role() returns public.app_role language sql stable security definer set search_path='' as $$
 select public.platform_role(auth.uid());
$$;
create function public.is_platform_owner() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and raw_app_meta_data->>'platform_owner'='true');
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_platform_owner() or public.current_platform_role()='ADMIN';
$$;
create function public.is_reviewer() returns boolean language sql stable security definer set search_path='' as $$
 select public.is_platform_owner() or public.current_platform_role() in ('ADMIN','MODERATOR');
$$;
grant usage on schema auth,public to anon,authenticated,service_role;
-- No direct profile grants: the public RPC is the only tested lookup surface.
