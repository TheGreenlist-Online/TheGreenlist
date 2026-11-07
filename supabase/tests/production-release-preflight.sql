-- Read-only inventory; this is not a replacement for rollback smoke tests.
-- Run with psql -X -v ON_ERROR_STOP=1 -f this-file.sql.
begin read only;
select current_database() as database_name, current_setting('server_version') as postgres_version;
select version, name
from supabase_migrations.schema_migrations
where version in ('20261017202824', '20261019035642', '20261019035650',
                  '20261019035830', '20261019035906', '20261019040232', '20261019040314')
order by version;
select n.nspname as schema_name, c.relname as table_name,
       c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in
  ('coa_reports', 'organization_memberships', 'organization_verification_requests');
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename in
  ('coa_reports', 'organization_memberships', 'organization_verification_requests')
order by tablename, policyname;
-- Compare actual definitions, not only deployment-time migration versions.
select p.oid::regprocedure::text as function_name, p.prosecdef as security_definer,
       p.proconfig as function_settings, pg_get_functiondef(p.oid) as definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where (n.nspname = 'public' and p.proname in
       ('has_permission', 'current_platform_role', 'touch_organization_verification_request'))
   or (n.nspname = 'private' and p.proname = 'protect_profile_authority')
order by function_name;
rollback;
