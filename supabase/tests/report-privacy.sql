begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}');
insert into public.reports(id,reporter_id,report_type,title,description,status,public_summary,admin_notes,is_anonymous)
 values('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','mislabeling','Private original title','Private original description','published','Reviewed fixture finding','Internal fixture notes',true);
set local role anon;
do $$ declare denied boolean:=false; begin
 begin perform reporter_id from public.reports; exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Anonymous raw reports are readable'; end if;
 if not exists(select 1 from public.read_public_report_findings() where id='33333333-3333-4333-8333-333333333333') then raise exception 'Public finding missing'; end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
 if not exists(select 1 from public.reports where id='33333333-3333-4333-8333-333333333333') then raise exception 'Owner cannot read own report'; end if;
 begin perform admin_notes from public.reports; exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Internal notes exposed'; end if;
end $$;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
do $$ begin
 if exists(select 1 from public.reports where id='33333333-3333-4333-8333-333333333333') then raise exception 'Another account can read published raw report'; end if;
end $$;
reset role;

rollback;
