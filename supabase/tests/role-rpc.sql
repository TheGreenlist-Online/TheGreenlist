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

-- PostgREST service credentials carry a role but no end-user subject.
set local role service_role;
select set_config('request.jwt.claims','{"role":"service_role"}',true);
do $$ begin
 if auth.uid() is not null then raise exception 'Service fixture unexpectedly has an actor'; end if;
 if public.platform_role('22222222-2222-4222-8222-222222222222') is distinct from 'USER'::public.app_role then raise exception 'Subjectless service-role lookup failed'; end if;
 if public.platform_role('99999999-9999-4999-8999-999999999999') is not null then raise exception 'Missing profile unexpectedly resolved'; end if;
end $$;
reset role;

-- A SECURITY DEFINER owner must not make signed-out authenticated requests trusted.
set local role authenticated;
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
do $$ begin
 if public.platform_role('22222222-2222-4222-8222-222222222222') is not null then raise exception 'Subjectless authenticated lookup exposed'; end if;
end $$;
select set_config('request.jwt.claims','',true);
do $$ begin
 if public.platform_role('22222222-2222-4222-8222-222222222222') is not null then raise exception 'Claimless authenticated lookup exposed'; end if;
end $$;
reset role;

-- A genuine service database session also works without request claims.
set session authorization service_role;
select set_config('request.jwt.claims','',true);
do $$ begin
 if public.platform_role('22222222-2222-4222-8222-222222222222') is distinct from 'USER'::public.app_role then raise exception 'Direct service session lookup failed'; end if;
end $$;
reset session authorization;

-- Preserve the authenticated administrator cross-account compatibility path.
update public.profiles set role='ADMIN' where id='11111111-1111-4111-8111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ begin
 if public.platform_role('22222222-2222-4222-8222-222222222222') is distinct from 'USER'::public.app_role then raise exception 'Admin cross-account lookup failed'; end if;
end $$;
reset role;
rollback;
