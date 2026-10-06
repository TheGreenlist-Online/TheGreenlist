begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
 if public.platform_role(auth.uid()) is distinct from 'USER'::public.app_role then raise exception 'Own role lookup failed'; end if;
 if public.platform_role('22222222-2222-4222-8222-222222222222') is not null then raise exception 'Cross-account role lookup exposed'; end if;
 if coalesce(public.is_reviewer(),false) then raise exception 'Ordinary account gained reviewer authority'; end if;
end $$;
reset role;
do $$ begin
 if has_function_privilege('anon','public.platform_role(uuid)','EXECUTE') then raise exception 'Anonymous role RPC remains exposed'; end if;
end $$;

rollback;
