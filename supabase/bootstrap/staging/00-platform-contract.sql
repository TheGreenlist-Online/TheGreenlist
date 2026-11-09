-- Application restore requires existing platform-managed dependencies.
-- This checks prerequisites; it creates no platform roles or extensions.
do $$ declare item text; begin
  foreach item in array array['anon','authenticated','service_role','postgres','supabase_admin'] loop
    if not exists(select 1 from pg_roles where rolname=item) then
      raise exception 'Missing platform role: %',item;
    end if;
  end loop;
  if to_regclass('auth.users') is null or to_regclass('storage.objects') is null
     or to_regclass('storage.buckets') is null or to_regprocedure('auth.uid()') is null
     or to_regprocedure('auth.jwt()') is null or to_regprocedure('storage.foldername(text)') is null then
    raise exception 'Missing managed Auth/Storage dependencies';
  end if;
end $$;
