begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}');
create temporary table document_guard_fixture(like public.business_documents including defaults);
create trigger document_guard_fixture before insert or update on document_guard_fixture for each row execute function private.guard_business_document_review();
grant insert,select,update on document_guard_fixture to authenticated;
insert into public.forum_threads(id,forum_id,author_id,title,body)
 values('33333333-3333-4333-8333-333333333333',(select id from public.forums where is_active limit 1),'22222222-2222-4222-8222-222222222222','Fixture thread','Forum guard fixture body');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by) values('44444444-4444-4444-8444-444444444444','Fixture doc','fixture-path',auth.uid());
 begin
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status) values('44444444-4444-4444-8444-444444444444','Forged doc','fixture-path',auth.uid(),'approved');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Document self-approval allowed'; end if;
 -- A reply to another user's accessible thread must work.
 insert into public.forum_posts(thread_id,author_id,body) values('33333333-3333-4333-8333-333333333333',auth.uid(),'Ordinary fixture reply');
end $$;
reset role;
update public.forum_threads set is_locked=true where id='33333333-3333-4333-8333-333333333333';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',true);
do $$ declare denied boolean:=false; begin
 begin insert into public.forum_posts(thread_id,author_id,body) values('33333333-3333-4333-8333-333333333333',auth.uid(),'Locked-thread reply'); exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Locked-thread reply allowed'; end if;
end $$;
reset role;
select set_config('request.jwt.claims','{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',true);
set local role authenticated;
do $$ declare denied boolean:=false; begin
 begin update public.forum_threads set is_locked=false where id='33333333-3333-4333-8333-333333333333'; exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Author can unlock thread'; end if;
end $$;
reset role;

rollback;
