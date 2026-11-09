-- DISPOSABLE LOCAL TEST FIXTURE ONLY. Not a hosted Auth/Storage installation.
-- No login credentials, network endpoints or production identities.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create role supabase_admin nologin;
create role supabase_auth_admin nologin;
create role supabase_storage_admin nologin;
create schema auth authorization supabase_admin;
create schema storage authorization supabase_admin;
create schema extensions;
create table auth.users(id uuid primary key, email text, raw_user_meta_data jsonb default '{}', raw_app_meta_data jsonb default '{}');
alter table auth.users owner to supabase_auth_admin;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
create function auth.role() returns text language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role',current_user) $$;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,owner uuid,owner_id text,metadata jsonb);
alter table storage.buckets owner to supabase_storage_admin;
alter table storage.objects owner to supabase_storage_admin;
alter table auth.users enable row level security;
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant usage on schema public,auth,storage to anon,authenticated,service_role;
grant usage,create on schema auth to supabase_auth_admin;
grant usage,create on schema storage to supabase_storage_admin;
grant select,insert,update,delete on storage.objects,storage.buckets to anon,authenticated;
grant all on storage.objects,storage.buckets to service_role;
