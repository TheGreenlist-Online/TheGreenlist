begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
 update public.profiles set display_name='Allowed fixture edit' where id=auth.uid();
 begin update public.profiles set account_status='banned' where id=auth.uid(); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Account enforcement self-edit allowed'; end if;
 denied:=false;
 begin update public.profiles set verification_status='verified',trust_score=100 where id=auth.uid(); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Verification self-edit allowed'; end if;
end $$;
reset role;
set local role service_role;
update public.profiles set account_status='banned' where id='11111111-1111-4111-8111-111111111111';
reset role;

rollback;
