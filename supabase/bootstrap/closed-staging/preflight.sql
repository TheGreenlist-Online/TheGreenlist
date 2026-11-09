-- Caller must bind the migration to otmaxtjstvbfckpgbwdi, never production.
set local lock_timeout='5s';
set local statement_timeout='120s';
select pg_advisory_xact_lock(68469204993793401);
do $$ begin
 if current_user <> 'postgres' or current_database() <> 'postgres'
    or current_setting('server_version_num')::int not between 170000 and 179999
    or not (select rolbypassrls from pg_roles where rolname=current_user) then
   raise exception 'Expected staging PostgreSQL 17 postgres connection';
 end if;
 if exists(select 1 from auth.users) or exists(select 1 from storage.objects)
    or exists(select 1 from storage.buckets)
    or exists(select 1 from pg_namespace where nspname='private')
    or exists(select 1 from pg_trigger where tgrelid='auth.users'::regclass and not tgisinternal)
    or exists(select 1 from pg_policy where polrelid in ('storage.objects'::regclass,'storage.buckets'::regclass))
    or exists(select 1 from pg_event_trigger where evtname='ensure_rls') then
   raise exception 'Closed foundation requires untouched empty staging';
 end if;
end $$;
-- Transaction-local evidence. No platform privileges/settings are modified.
create temporary table closed_foundation_before on commit drop as
select
 (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d) as default_acls,
 (select jsonb_agg(to_jsonb(e) order by e.oid) from pg_event_trigger e) as event_triggers,
 (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r) as roles,
 (select jsonb_agg(to_jsonb(n) order by n.oid) from pg_namespace n where n.nspname in ('public','auth','storage')) as managed_schemas,
 (select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid
   join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in ('auth','storage')) as managed_triggers,
 (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_policy p join pg_class c on c.oid=p.polrelid
   join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('auth','storage')) as managed_policies;
