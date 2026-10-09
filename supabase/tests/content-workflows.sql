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
('77777777-7777-4777-8777-777777777777','Other fixture business','security-fixture-other-business','lab','22222222-2222-4222-8222-222222222222'),
('88888888-8888-4888-8888-888888888888','Third fixture business','security-fixture-third-business','lab','11111111-1111-4111-8111-111111111111');
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
do $$ declare denied boolean; fixture record; outcome text; field text; begin
 -- Admins may submit pending documents, but review only unrelated documents.
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by)
 values('44444444-4444-4444-8444-444444444444','Admin pending upload','fixture-path',auth.uid());
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,uploaded_by,status,review_note)
 values('77777777-7777-4777-8777-777777777777','Admin external review','fixture-path','22222222-2222-4222-8222-222222222222','approved','Reviewed');
 insert into pg_temp.document_guard_fixture(business_id,title,file_url,status)
 values('77777777-7777-4777-8777-777777777777','Admin imported review','fixture-path','approved');
 update pg_temp.document_guard_fixture set status='rejected',review_note='Reviewed',updated_at=now() where title='Other document';
 foreach field in array array[
  'title=''Changed title''','doc_type=''license''','file_url=''changed-path''',
  'business_id=''88888888-8888-4888-8888-888888888888''',
  'uploaded_by=''11111111-1111-4111-8111-111111111111''',
  'created_at=created_at + interval ''1 second''',
  'id=''99999999-9999-4999-8999-999999999999'''
 ] loop
  denied:=false;
  begin
   execute format('update pg_temp.document_guard_fixture set status=''approved'',review_note=''Combined review tampering'',%s where title=''Other document''',field);
  exception when insufficient_privilege then denied:=true; end;
  if not denied then raise exception 'Admin review changed submission field: %',field; end if;
 end loop;
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


-- Direct writes use authenticated + JWT claims, as the Supabase Data API does.
create function pg_temp.expect_error(command text, expected text) returns void
language plpgsql security invoker as $$
begin
 begin
  execute command;
 exception when others then
  if sqlstate=expected then return; end if;
  raise;
 end;
 raise exception 'Expected SQLSTATE %, but command succeeded: %',expected,command;
end $$;
grant execute on function pg_temp.expect_error(text,text) to authenticated;

insert into public.forum_threads(id,forum_id,author_id,title,body,visibility,status) values
('88888888-8888-4888-8888-888888888888',(select id from public.forums where is_active limit 1),'22222222-2222-4222-8222-222222222222','Private fixture','Private body','private','published'),
('99999999-9999-4999-8999-999999999999',(select id from public.forums where is_active limit 1),'22222222-2222-4222-8222-222222222222','Removed fixture','Removed body','public','removed');

insert into public.forum_posts(id,thread_id,author_id,body) values('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222','Moderation fixture reply');

-- Repeat the reviewer-author scenarios for BOTH MODERATOR and ADMIN.
do $$ declare actor uuid; thread uuid; post uuid; field text; affected integer; begin
 foreach actor in array array['66666666-6666-4666-8666-666666666666'::uuid,'55555555-5555-4555-8555-555555555555'::uuid] loop
  perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
  set local role authenticated;
  insert into public.forum_threads(forum_id,author_id,title,body)
   values((select id from public.forums where is_active limit 1),actor,'Reviewer author fixture','Original body') returning id into thread;
  insert into public.forum_posts(thread_id,author_id,body) values(thread,actor,'Reviewer reply') returning id into post;
  update public.forum_threads set body='Normal author edit' where id=thread;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Reviewer normal edit did not affect one row'; end if;
  foreach field in array array['status=''removed''','risk_level=''high''','is_locked=true','is_pinned=true','ai_summary=''Forged summary'''] loop
   perform pg_temp.expect_error(format('update public.forum_threads set %s where id=%L',field,thread),'42501');
  end loop;
  foreach field in array array['status=''removed''','risk_level=''high''','thread_id=''33333333-3333-4333-8333-333333333333''','author_id=''22222222-2222-4222-8222-222222222222'''] loop
   perform pg_temp.expect_error(format('update public.forum_posts set %s where id=%L',field,post),'42501');
  end loop;
  perform pg_temp.expect_error(format('select public.moderate_forum_content(''thread'',%L,''{"is_locked":true}'',''Self lock'')',thread),'42501');
  perform pg_temp.expect_error(format('select public.moderate_forum_content(''post'',%L,''{"status":"removed"}'',''Self removal'')',post),'42501');
  perform pg_temp.expect_error(format('insert into public.forum_threads(forum_id,author_id,title,status) values((select id from public.forums limit 1),%L,''Forged'',''removed'')',actor),'42501');
  perform pg_temp.expect_error(format('insert into public.forum_posts(thread_id,author_id,body) values(''33333333-3333-4333-8333-333333333333'',%L,''Locked reviewer reply'')',actor),'42501');
  perform pg_temp.expect_error(format('insert into public.forum_posts(thread_id,author_id,body) values(''88888888-8888-4888-8888-888888888888'',%L,''Private reviewer reply'')',actor),'42501');
  perform pg_temp.expect_error(format('insert into public.forum_posts(thread_id,author_id,body) values(''99999999-9999-4999-8999-999999999999'',%L,''Removed reviewer reply'')',actor),'42501');
  perform pg_temp.expect_error(format('insert into public.forum_posts(thread_id,author_id,body) values(%L,%L,repeat(''x'',50001))',thread,actor),'22001');
  perform pg_temp.expect_error(format('update public.forum_threads set body=repeat(''x'',50001) where id=%L',thread),'22001');
  perform pg_temp.expect_error('insert into private.forum_review_context values(txid_current(),auth.uid(),''forum_threads'',''33333333-3333-4333-8333-333333333333'')','42501');
  perform pg_temp.expect_error('select public.moderate_forum_content(''thread'',''33333333-3333-4333-8333-333333333333'',''{"is_locked":false}'','' '')','22023');
  perform pg_temp.expect_error('select public.moderate_forum_content(''thread'',''33333333-3333-4333-8333-333333333333'',''{"body":"overwrite"}'',''Rewrite'')','22023');
  perform pg_temp.expect_error('select public.moderate_forum_content(''thread'',''33333333-3333-4333-8333-333333333333'',''{"is_locked":"false"}'',''Bad type'')','22023');
  perform pg_temp.expect_error('select public.moderate_forum_content(''thread'',''88888888-8888-4888-8888-888888888888'',''{"is_locked":true}'',''Private lock'')','42501');
  -- Legitimate reviewer can unlock another author's thread, with an audit.
  perform public.moderate_forum_content('thread','33333333-3333-4333-8333-333333333333','{"is_locked":false,"is_pinned":true}','Reviewed reopening');
  -- Repeating a reviewed decision still requires and records its rationale.
  perform public.moderate_forum_content('thread','33333333-3333-4333-8333-333333333333','{"is_locked":false}', 'Confirmed reopening');
  insert into public.forum_posts(thread_id,author_id,body) values('33333333-3333-4333-8333-333333333333',actor,'Reopened reply');
  reset role;
  if not exists(select 1 from public.audit_logs where actor_id=actor and action='forum.moderate'
    and entity_type='forum_threads' and entity_id='33333333-3333-4333-8333-333333333333'
    and metadata->>'reason'='Reviewed reopening' and metadata->'before'->>'is_locked'='true'
    and metadata->'after'->>'is_locked'='false' and not (metadata->'before' ? 'body')) then
   raise exception 'Missing actor/reason/before/after audit';
  end if;
  update public.forum_threads set is_locked=true where id='33333333-3333-4333-8333-333333333333';
  update public.forum_threads set is_locked=true where id=thread;
  set local role authenticated;
  perform pg_temp.expect_error(format('update public.forum_threads set body=''Locked edit'' where id=%L',thread),'42501');
  perform pg_temp.expect_error(format('update public.forum_posts set body=''Locked edit'' where id=%L',post),'42501');
  -- Pure moderation may remove a post on a locked thread, without rewriting it.
  perform public.moderate_forum_content('post','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"status":"removed","risk_level":"high"}','Reviewed removal');
  perform public.moderate_forum_content('post','aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','{"status":"published","risk_level":"low"}','Reviewed restore');
  reset role;
 end loop;
end $$;
-- A non-reviewer cannot call the RPC, even with forged editable metadata.
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated","user_metadata":{"role":"ADMIN","platform_owner":true}}',true);
select pg_temp.expect_error('select public.moderate_forum_content(''thread'',''33333333-3333-4333-8333-333333333333'',''{"is_locked":false}'',''Forged role'')','42501');
reset role;

-- An audit failure must roll the moderation update back atomically.
create function pg_temp.fail_forum_audit() returns trigger language plpgsql as $$
begin raise exception using errcode='23514',message='Synthetic audit failure'; end $$;
create trigger fixture_audit_failure before insert on public.audit_logs
for each row execute function pg_temp.fail_forum_audit();
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"66666666-6666-4666-8666-666666666666","role":"authenticated"}',true);
select pg_temp.expect_error('select public.moderate_forum_content(''thread'',''33333333-3333-4333-8333-333333333333'',''{"is_locked":false}'',''Failed audit'')','23514');
reset role;
do $$ begin
 if not (select is_locked from public.forum_threads where id='33333333-3333-4333-8333-333333333333') then
  raise exception 'Unaudited moderation committed';
 end if;
 if exists(select 1 from private.forum_review_context) then raise exception 'Leaked moderation capability'; end if;
 if exists(select 1 from public.audit_logs where metadata->>'reason'='Failed audit') then raise exception 'Failed decision left audit'; end if;
end $$;
drop trigger fixture_audit_failure on public.audit_logs;
rollback;
