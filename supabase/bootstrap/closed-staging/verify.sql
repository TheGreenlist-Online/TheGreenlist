do $$ declare n integer; obj record; expected_rows integer; before_state record; begin
 if (select count(*) from pg_class c join pg_namespace s on s.oid=c.relnamespace
      where s.nspname in ('public','private') and c.relkind in ('r','p')) <> 30
    or (select count(*) from pg_type t join pg_namespace s on s.oid=t.typnamespace
      where s.nspname='public' and t.typtype='e') <> 3
    or (select count(*) from pg_constraint c join pg_namespace s on s.oid=c.connamespace
      where s.nspname in ('public','private')) <> 127
    or (select count(*) from pg_index i join pg_class c on c.oid=i.indrelid
      join pg_namespace s on s.oid=c.relnamespace where s.nspname in ('public','private')) <> 101 then
   raise exception 'Closed foundation structural inventory mismatch';
 end if;
 if exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      where s.nspname in ('public','private') and c.relkind not in ('r','p','i'))
    or exists(select 1 from pg_proc p join pg_namespace s on s.oid=p.pronamespace where s.nspname in ('public','private'))
    or exists(select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
      join pg_namespace s on s.oid=c.relnamespace where s.nspname in ('public','private'))
    or exists(select 1 from pg_trigger t join pg_class c on c.oid=t.tgrelid
      join pg_namespace s on s.oid=c.relnamespace where not t.tgisinternal and s.nspname in ('public','private')) then
   raise exception 'Unexpected application activation object';
 end if;
 if exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      where s.nspname in ('public','private') and c.relkind in ('r','p')
      and (not c.relrowsecurity or not c.relforcerowsecurity))
    or exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      cross join lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) a
      where s.nspname in ('public','private') and c.relkind in ('r','p') and a.grantee<>c.relowner)
    or exists(select 1 from pg_class c join pg_namespace s on s.oid=c.relnamespace
      cross join (values('anon'),('authenticated'),('service_role')) r(role_name)
      where s.nspname in ('public','private') and c.relkind in ('r','p')
      and has_table_privilege(r.role_name,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER,MAINTAIN')) then
   raise exception 'Closed foundation access boundary failed';
 end if;
 for obj in select s.nspname,c.relname from pg_class c join pg_namespace s on s.oid=c.relnamespace
    where s.nspname in ('public','private') and c.relkind in ('r','p') loop
   execute format('select count(*) from %I.%I',obj.nspname,obj.relname) into n;
   expected_rows := case obj.relname when 'role_catalog' then 6 when 'role_permissions' then 42 else 0 end;
   if n<>expected_rows then raise exception 'Unexpected application data'; end if;
 end loop;
 select * into before_state from closed_foundation_before;
 if before_state.default_acls is distinct from (select jsonb_agg(to_jsonb(d) order by d.oid) from pg_default_acl d)
    or before_state.event_triggers is distinct from (select jsonb_agg(to_jsonb(e) order by e.oid) from pg_event_trigger e)
    or before_state.roles is distinct from (select jsonb_agg(to_jsonb(r) order by r.oid) from pg_roles r)
    or before_state.managed_schemas is distinct from (select jsonb_agg(to_jsonb(s) order by s.oid) from pg_namespace s where s.nspname in ('public','auth','storage'))
    or before_state.managed_triggers is distinct from (select jsonb_agg(to_jsonb(t) order by t.oid) from pg_trigger t join pg_class c on c.oid=t.tgrelid
      join pg_namespace s on s.oid=c.relnamespace where not t.tgisinternal and s.nspname in ('auth','storage'))
    or before_state.managed_policies is distinct from (select jsonb_agg(to_jsonb(p) order by p.oid) from pg_policy p join pg_class c on c.oid=p.polrelid
      join pg_namespace s on s.oid=c.relnamespace where s.nspname in ('auth','storage'))
    or exists(select 1 from auth.users) or exists(select 1 from storage.objects)
    or exists(select 1 from storage.buckets) then
   raise exception 'Platform state or empty-data boundary changed';
 end if;
end $$;
