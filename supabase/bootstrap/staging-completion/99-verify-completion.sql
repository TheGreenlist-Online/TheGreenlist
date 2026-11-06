do $$ declare before_state record; obj record; row_count integer; begin
 if (select count(*) from pg_class c join pg_namespace s on s.oid=c.relnamespace where s.nspname in ('public','private') and c.relkind in ('r','p'))<>30
    or (select count(*) from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname in ('public','private'))<>36
    or (select count(*) from pg_policies where schemaname in ('public','private','storage','auth'))<>93
    or (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace s on s.oid=c.relnamespace
      join pg_proc p on p.oid=t.tgfoid join pg_namespace fn on fn.oid=p.pronamespace
      where not t.tgisinternal and (s.nspname in ('public','private') or fn.nspname in ('public','private')))<>22
    or not exists(select 1 from pg_event_trigger where evtname='ensure_rls')
    or (select count(*) from storage.buckets)<>4
    or exists(select 1 from storage.buckets where public is distinct from false) then
   raise exception 'Completed schema inventory failed';
 end if;
 if exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      where s.nspname in ('public','private') and c.relkind in ('r','p') and (not c.relrowsecurity or not c.relforcerowsecurity))
    or exists(select 1 from pg_proc p join pg_namespace s on s.oid=p.pronamespace
      cross join lateral aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a
      where s.nspname in ('public','private') and a.grantee=0 and a.privilege_type='EXECUTE')
    or exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      cross join (values('anon'),('authenticated')) r(role_name)
      where s.nspname in ('public','private') and c.relkind in ('r','p','v')
      and has_table_privilege(r.role_name,c.oid,'MAINTAIN,TRUNCATE,REFERENCES,TRIGGER')) then
   raise exception 'Completed schema access hardening failed';
 end if;
 for obj in select s.nspname,c.relname from pg_class c join pg_namespace s on s.oid=c.relnamespace
   where s.nspname in ('public','private') and c.relkind in ('r','p') loop
   execute format('select count(*) from %I.%I',obj.nspname,obj.relname) into row_count;
   if row_count<>(case obj.relname when 'role_catalog' then 6 when 'role_permissions' then 42 else 0 end) then
     raise exception 'Unexpected application content during completion';
   end if;
 end loop;
 select * into before_state from staging_completion_before;
 if before_state.default_acls is distinct from (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d)
    or before_state.roles is distinct from (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r)
    or before_state.managed_schemas is distinct from (select jsonb_agg(to_jsonb(n) order by n.oid) from pg_namespace n where n.nspname in ('public','auth','storage'))
    or before_state.managed_events is distinct from (select jsonb_agg(to_jsonb(e) order by e.oid) from pg_event_trigger e where evtname<>'ensure_rls')
    or exists(select 1 from auth.users) or exists(select 1 from storage.objects) then
   raise exception 'Platform settings or empty-data boundary changed';
 end if;
end $$;
