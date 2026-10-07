begin;
insert into auth.users(id,email,raw_user_meta_data) values
('11111111-1111-4111-8111-111111111111','security-fixture-1@example.invalid','{}'),
('22222222-2222-4222-8222-222222222222','security-fixture-2@example.invalid','{}'),
('55555555-5555-4555-8555-555555555555','security-fixture-admin@example.invalid','{}'),
('66666666-6666-4666-8666-666666666666','security-fixture-moderator@example.invalid','{}');
alter table public.profiles disable trigger protect_profile_authority;
update public.profiles set role='ADMIN' where id='55555555-5555-4555-8555-555555555555';
update public.profiles set role='MODERATOR' where id='66666666-6666-4666-8666-666666666666';
alter table public.profiles enable trigger protect_profile_authority;
insert into public.business_profiles(id,name,slug,business_type,owner_id) values
('44444444-4444-4444-8444-444444444444','Admin fixture business','security-fixture-admin-business','lab','55555555-5555-4555-8555-555555555555'),
('77777777-7777-4777-8777-777777777777','Other fixture business','security-fixture-other-business','lab','22222222-2222-4222-8222-222222222222');
create temporary table document_guard_fixture(like public.business_documents including defaults);
create trigger document_guard_fixture before insert or update on document_guard_fixture for each row execute function private.guard_business_document_review();
grant insert,select,update on document_guard_fixture to authenticated;
grant insert,select,update on document_guard_fixture to service_role;
insert into document_guard_fixture(business_id,title,file_url,uploaded_by) values
('44444444-4444-4444-8444-444444444444','Owned business document','fixture-path','22222222-2222-4222-8222-222222222222'),
('77777777-7777-4777-8777-777777777777','Uploaded document','fixture-path','55555555-5555-4555-8555-555555555555'),
('77777777-7777-4777-8777-777777777777','Other document','fixture-path','22222222-2222-4222-8222-222222222222');
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

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',true);
do $$ declare denied boolean; begin
 denied:=false;
 begin
  insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status)
  values('77777777-7777-4777-8777-777777777777','Moderator review','fixture-path','22222222-2222-4222-8222-222222222222','approved');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Moderator document review insert allowed'; end if;
 denied:=false;
 begin
  update pg_temp.document_guard_fixture set status='approved' where title='Other document';
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Moderator document review update allowed'; end if;
end $$;
reset role;

set local role authenticated;
select set_config('request.jwt.claims','{"sub":"55555555-5555-4555-8555-555555555555","role":"authenticated"}',true);
do $$ declare denied boolean; fixture record; outcome text; begin
 -- Admins may submit pending documents, but review only unrelated documents.
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by)
 values('44444444-4444-4444-8444-444444444444','Admin pending upload','fixture-path',auth.uid());
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status,review_note)
 values('77777777-7777-4777-8777-777777777777','Admin external review','fixture-path','22222222-2222-4222-8222-222222222222','approved','Reviewed');
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,status)
 values('77777777-7777-4777-8777-777777777777','Admin imported review','fixture-path','approved');
 update pg_temp.document_guard_fixture set status='rejected',review_note='Reviewed' where title='Other document';
 foreach outcome in array array['approved','rejected','pending_review'] loop
  for fixture in select business_id,uploaded_by from pg_temp.document_guard_fixture
   where title in ('Owned business document','Uploaded document') loop
   denied:=false;
   begin
    insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status,review_note)
    values(fixture.business_id,'Admin self-review','fixture-path',fixture.uploaded_by,outcome,'Reviewed');
   exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Admin self-review insert allowed'; end if;
  end loop;
  for fixture in select title from pg_temp.document_guard_fixture
   where title in ('Owned business document','Uploaded document') loop
   denied:=false;
   begin
    update pg_temp.document_guard_fixture set status=outcome,review_note='Reviewed',
     business_id='77777777-7777-4777-8777-777777777777',
     uploaded_by='22222222-2222-4222-8222-222222222222' where title=fixture.title;
   exception when insufficient_privilege then denied:=true; end;
   if not denied then raise exception 'Admin can evade self-review guard by reassigning document'; end if;
  end loop;
 end loop;
 denied:=false;
 begin
  update pg_temp.document_guard_fixture set business_id='44444444-4444-4444-8444-444444444444' where title='Other document';
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Admin can move reviewed document to own business'; end if;
 denied:=false;
 begin
  update pg_temp.document_guard_fixture set uploaded_by=auth.uid() where title='Other document';
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Admin can become uploader of reviewed document'; end if;
end $$;
reset role;

set local role service_role;
do $$ begin
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status)
 values('44444444-4444-4444-8444-444444444444','Service review','fixture-path',auth.uid(),'approved');
 update pg_temp.document_guard_fixture set status='approved' where title='Owned business document';
end $$;
reset role;

rollback;
