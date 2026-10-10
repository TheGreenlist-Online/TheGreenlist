begin;
-- Run with psql as the migration owner. Everything rolls back.
create temporary table report_guard_fixture (like public.reports including defaults);
create trigger report_guard_fixture before insert or update on report_guard_fixture
for each row execute function private.protect_report_review_fields();
grant select,insert,update on report_guard_fixture to authenticated, service_role;
set local role authenticated;
do $$
declare fixture_id uuid; rejected boolean;
begin
 insert into pg_temp.report_guard_fixture (reporter_id,report_type,title,description)
 values ('11111111-1111-4111-8111-111111111111','mislabeling','Valid fixture report','This is a fixture for testing only.') returning id into fixture_id;
 update pg_temp.report_guard_fixture set title='Valid fixture edit' where id=fixture_id;
 rejected := false;
 begin
  update pg_temp.report_guard_fixture set status='published' where id=fixture_id;
 exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Reporter publication was not rejected'; end if;
 rejected := false;
 begin
  update pg_temp.report_guard_fixture set verification_status='verified' where id=fixture_id;
 exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Reporter verification was not rejected'; end if;
 rejected := false;
 begin
  update pg_temp.report_guard_fixture set admin_notes='forged',confidence_score=100 where id=fixture_id;
 exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Reporter review notes were not rejected'; end if;
 rejected := false;
 begin
  insert into pg_temp.report_guard_fixture (report_type,title,description,status)
  values ('mislabeling','Invalid fixture report','This is a fixture for testing only.','published');
 exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Pre-published insert was not rejected'; end if;
 rejected := false;
 begin
  update pg_temp.report_guard_fixture set description=repeat('x',50001) where id=fixture_id;
 exception when string_data_right_truncation then rejected := true; end;
 if not rejected then raise exception 'Oversized report was not rejected'; end if;
end $$;
reset role;
set local role service_role;
update pg_temp.report_guard_fixture set status='published',verification_status='verified';
reset role;
set local role authenticated;
do $$
declare rejected boolean := false;
begin
 begin
  update pg_temp.report_guard_fixture set description='Changed after publication';
 exception when insufficient_privilege then rejected := true; end;
 if not rejected then raise exception 'Published report rewrite was not rejected'; end if;
end $$;
reset role;
do $$
begin
 if has_table_privilege('anon','public.ai_audit_logs','INSERT') then raise exception 'Anonymous audit inserts remain allowed'; end if;
 if has_function_privilege('anon','public.notify_report_status_change()','EXECUTE') then raise exception 'Trigger RPC execute remains allowed'; end if;
end $$;

-- Also exercise real reports RLS with throwaway identities in this transaction.
insert into auth.users(id,email,raw_user_meta_data)
values ('11111111-1111-4111-8111-111111111111','guard-fixture-1@example.invalid','{}'),
       ('22222222-2222-4222-8222-222222222222','guard-fixture-2@example.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
insert into public.reports(id,reporter_id,report_type,title,description)
values ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','mislabeling','Valid RLS fixture report','This is a fixture for testing only.');
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$
declare affected integer;
begin
 if exists(select 1 from public.reports where id='33333333-3333-4333-8333-333333333333') then raise exception 'Another account read a private report'; end if;
 update public.reports set title='Other account edit' where id='33333333-3333-4333-8333-333333333333';
 get diagnostics affected=row_count;
 if affected <> 0 then raise exception 'Another account updated a private report'; end if;
end $$;
reset role;

set local role anon;
do $$ begin
 if exists(select 1 from public.search_public_content(repeat('x',257),50,2147483647)) then raise exception 'Oversized search produced results'; end if;
end $$;
reset role;
-- Regression: explicitly passing NULL must use the default cap, not LIMIT ALL.
set local role anon;
do $
begin
 if position('coalesce(result_limit, 20)' in pg_get_functiondef('public.search_public_content(text,integer,integer)'::regprocedure)) = 0 then
   raise exception 'NULL result_limit is not coalesced before LIMIT';
 end if;
 if (select count(*) from public.search_public_content('the',NULL,0)) > 20 then
   raise exception 'NULL result_limit exceeded the default 20-row cap';
 end if;
end $;
reset role;

rollback;
