begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
 for i in 1..10 loop
 insert into public.reports(reporter_id,report_type,title,description) values(auth.uid(),'mislabeling','Quota fixture report','Quota fixture report body for verification.');
 end loop;
 begin
 insert into public.reports(reporter_id,report_type,title,description) values(auth.uid(),'mislabeling','Quota fixture report','Quota fixture report body for verification.');
 exception when sqlstate 'PT429' then denied:=true; end;
 if not denied then raise exception 'Eleventh report was not rate-limited'; end if;
end $$;
reset role;
-- Reset the window as a privileged test setup, then verify recovery.
update private.client_write_buckets set window_start=window_start-interval '1 hour' where user_id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.reports(reporter_id,report_type,title,description) values(auth.uid(),'mislabeling','Recovered quota fixture','Quota fixture report body for verification.');
reset role;
do $$ begin
 if has_table_privilege('authenticated','private.client_write_buckets','UPDATE') then raise exception 'Client can reset quota'; end if;
 if (select count(*) from private.client_write_buckets where user_id='11111111-1111-4111-8111-111111111111') <> 1 then raise exception 'Counter storage is not bounded'; end if;
end $$;

-- A caller must not be able to defeat the quota by rotating the session
-- timezone (PostgREST exposes this via the `Prefer: timezone=` header).
-- Fractional-offset zones would shift a timezone-dependent date_trunc bucket.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ declare denied boolean:=false; zones text[]:=array['Asia/Kolkata','Asia/Kathmandu','UTC']; begin
 for i in 1..10 loop
 execute format('set local timezone to %L', zones[1 + (i % array_length(zones,1))]);
 insert into public.reports(reporter_id,report_type,title,description) values(auth.uid(),'mislabeling','Quota fixture report','Quota fixture report body for verification.');
 end loop;
 begin
 set local timezone to 'Asia/Kathmandu';
 insert into public.reports(reporter_id,report_type,title,description) values(auth.uid(),'mislabeling','Quota fixture report','Quota fixture report body for verification.');
 exception when sqlstate 'PT429' then denied:=true; end;
 if not denied then raise exception 'Quota bypassed by rotating session timezone'; end if;
 denied:=false;
 for i in 1..10 loop
   insert into public.business_profiles(owner_id,name,slug,business_type,is_claimed,verification_status)
   values(auth.uid(),format('Quota fixture business %s',i),format('quota-fixture-business-%s',i),'dispensary',true,'unverified');
 end loop;
 begin
   insert into public.business_profiles(owner_id,name,slug,business_type,is_claimed,verification_status)
   values(auth.uid(),'Quota fixture business denied','quota-fixture-business-denied','dispensary',true,'unverified');
 exception when sqlstate 'PT429' then denied:=true; end;
 if not denied then raise exception 'Eleventh business claim was not rate-limited'; end if;
end $$;
reset role;

-- Trigger-only fixture isolates role handling from table grants/RLS.
-- These grants exist only inside this rolled-back test transaction.
create temporary table quota_role_fixture(id uuid default gen_random_uuid());
create trigger fixture_quota before insert on quota_role_fixture for each row
 execute function private.enforce_client_write_quota('1');
grant insert on quota_role_fixture to authenticated,anon,service_role,supabase_admin;
create function pg_temp.expect_quota_error(command text, expected text) returns void
language plpgsql as $$ begin
 begin execute command;
 exception when others then
  if sqlstate=expected then return; end if;
  raise;
 end;
 raise exception 'Expected SQLSTATE %, command succeeded: %',expected,command;
end $$;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into pg_temp.quota_role_fixture default values;
select pg_temp.expect_quota_error('insert into pg_temp.quota_role_fixture default values','PT429');
-- JWT role strings do not override the selected database role.
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"service_role","user_metadata":{"role":"ADMIN"}}',true);
select pg_temp.expect_quota_error('insert into pg_temp.quota_role_fixture default values','PT429');
select set_config('request.jwt.claims','{}',true);
select pg_temp.expect_quota_error('insert into pg_temp.quota_role_fixture default values','42501');
reset role;
set local role anon;
select pg_temp.expect_quota_error('insert into pg_temp.quota_role_fixture default values','42501');
reset role;
-- Trusted API and maintenance roles bypass quotas with or without a JWT actor.
set local role service_role;
insert into pg_temp.quota_role_fixture default values;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into pg_temp.quota_role_fixture default values;
reset role;
set local role supabase_admin;
insert into pg_temp.quota_role_fixture default values;
reset role;
insert into pg_temp.quota_role_fixture default values;
do $$ begin
 if (select used from private.client_write_buckets where user_id='11111111-1111-4111-8111-111111111111' and action='quota_role_fixture:INSERT')<>1 then
  raise exception 'Trusted or rejected writes charged the quota';
 end if;
end $$;
rollback;
