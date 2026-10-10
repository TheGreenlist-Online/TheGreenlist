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
end $$;
reset role;

rollback;
