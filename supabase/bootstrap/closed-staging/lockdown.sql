-- No client or service role gets access to this unfinished application schema.
-- Revoke grants inherited from platform defaults within this same transaction.
revoke all on all tables in schema public,private from public,anon,authenticated,service_role;
revoke all on schema private from public,anon,authenticated,service_role;
do $$ declare obj record; begin
 for obj in select n.nspname,c.relname from pg_class c
   join pg_namespace n on n.oid=c.relnamespace
   where n.nspname in ('public','private') and c.relkind in ('r','p') loop
   execute format('alter table %I.%I enable row level security',obj.nspname,obj.relname);
   execute format('alter table %I.%I force row level security',obj.nspname,obj.relname);
 end loop;
end $$;
