-- Synthetic disposable PostgreSQL database ONLY; never run on a project.
-- Minimum tables for the quota trigger contract, not a deployed schema/RLS clone.
create role anon;
create role authenticated;
create role service_role bypassrls;
create role supabase_admin;
create schema auth;
create schema private;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb);
create function auth.uid() returns uuid language sql stable as $$
 select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid
$$;
create table public.reports (
 id uuid primary key default gen_random_uuid(), reporter_id uuid references auth.users,
 report_type text not null, title text not null, description text not null
);
create table public.forum_threads(id uuid primary key default gen_random_uuid());
create table public.forum_posts(id uuid primary key default gen_random_uuid());
create table public.business_documents(id uuid primary key default gen_random_uuid());
create table public.education_resources(id uuid primary key default gen_random_uuid());
create table public.support_tickets(id uuid primary key default gen_random_uuid());
grant usage on schema auth,private,public to authenticated;
grant insert on public.reports to authenticated;
alter table public.reports enable row level security;
create policy fixture_self_insert on public.reports for insert to authenticated
 with check(reporter_id=(select auth.uid()));
