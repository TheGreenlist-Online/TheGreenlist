-- Read-only authority preflight for a prospective validator, not provisioning.
-- Not wired into a hosted workflow. No login, membership, grants, or ACL repair.
-- This cannot establish provider/project identity: database "postgres" and
-- cluster_name "main" are not unique project identifiers. Separately verify the
-- exact pooler username against independently verified provider project metadata.
-- Success establishes only these authority checks, not data isolation, complete
-- routine/default/extension ACL safety, or useful catalog-only access.
do $$
declare
  safe boolean;
begin
  select
    session_user = 'greenlist_staging_validator'
    and current_user = 'greenlist_staging_validator'
    and pg_catalog.current_database() = 'postgres'
    and not r.rolsuper
    and not r.rolcreatedb
    and not r.rolcreaterole
    and not r.rolreplication
    and not r.rolbypassrls
    and not exists (select 1 from pg_catalog.pg_auth_members m where m.member = r.oid)
    and not pg_catalog.has_database_privilege(r.oid, pg_catalog.current_database(), 'CREATE')
    and not exists (
      select 1 from pg_catalog.pg_shdepend d
      where d.refclassid = 'pg_catalog.pg_authid'::pg_catalog.regclass
        and d.refobjid = r.oid and d.deptype = 'o'
    )
    and not exists (
      select 1 from pg_catalog.pg_namespace n
      where n.nspname !~ '^pg_' and n.nspname <> 'information_schema'
        and pg_catalog.has_schema_privilege(r.oid, n.oid, 'CREATE')
    )
  into safe
  from pg_catalog.pg_roles r where r.rolname = current_user;

  if safe is distinct from true then
    raise exception using errcode = '42501', message = 'VALIDATOR_IDENTITY_REJECTED';
  end if;
end
$$;
