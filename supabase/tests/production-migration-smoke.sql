-- Production-safe SQL smoke test: synthetic random identities, no DDL, all writes
-- rolled back. Run the whole file in one connection as postgres. Never COMMIT it.
begin;
set local statement_timeout = '30s';
do $$
declare
 actor uuid := gen_random_uuid();
 other_actor uuid := gen_random_uuid();
 reviewer uuid := gen_random_uuid();
 moderator uuid := gen_random_uuid();
 own_business uuid := gen_random_uuid();
 other_business uuid := gen_random_uuid();
 document uuid := gen_random_uuid();
 forum uuid;
 thread uuid := gen_random_uuid();
 reply uuid;
 denied boolean;
 rows_changed integer;
begin
 insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data)
 select id,'migration-smoke-'||id||'@example.invalid','{}'::jsonb,
   case when id=reviewer then '{"platform_owner":true}'::jsonb else '{}'::jsonb end
 from unnest(array[actor,other_actor,reviewer,moderator]) id;
 -- Exercise the real profile authority trigger, without disabling it.
 perform set_config('request.jwt.claims',jsonb_build_object('sub',reviewer,'role','authenticated')::text,true);
 update public.profiles set role='ADMIN' where id=reviewer;
 update public.profiles set role='MODERATOR' where id=moderator;
 update auth.users set raw_app_meta_data='{}' where id=reviewer;

 insert into public.business_profiles(id,name,slug,business_type,owner_id) values
 (own_business,'Migration smoke owner','migration-smoke-'||own_business,'lab',reviewer),
 (other_business,'Migration smoke external','migration-smoke-'||other_business,'lab',other_actor);
 insert into public.business_documents(id,business_id,title,file_url,uploaded_by) values
 (document,other_business,'Migration smoke document','smoke/private.pdf',other_actor);
 select id into forum from public.forums where is_active limit 1;
 if forum is null then raise exception 'An active forum is required for smoke verification'; end if;
 insert into public.forum_threads(id,forum_id,author_id,title,body)
 values(thread,forum,other_actor,'Migration smoke thread','Synthetic rollback-only body');

 perform set_config('request.jwt.claims',jsonb_build_object('sub',actor,'role','authenticated')::text,true);
 set local role authenticated;
 if public.platform_role(actor) is distinct from 'USER'::public.app_role then raise exception 'Own role failed'; end if;
 if public.platform_role(other_actor) is not null then raise exception 'Cross-user role leak'; end if;
 for i in 1..10 loop
  insert into public.reports(reporter_id,report_type,title,description)
  values(actor,'correction_request','Migration smoke correction','Synthetic rollback-only correction request');
 end loop;
 denied := false;
 begin
  insert into public.reports(reporter_id,report_type,title,description)
  values(actor,'other','Migration smoke quota','Synthetic rollback-only quota check');
 exception when sqlstate 'PT429' then denied:=true; end;
 if not denied then raise exception 'Eleventh report escaped quota'; end if;
 insert into public.forum_posts(thread_id,author_id,body)
 values(thread,actor,'Synthetic rollback-only reply') returning id into reply;
 denied := false;
 begin
  update public.forum_posts set status='removed' where id=reply;
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Author self-moderation allowed'; end if;
 reset role;
 update public.forum_threads set is_locked=true where id=thread;
 set local role authenticated;
 denied:=false;
 begin
  insert into public.forum_posts(thread_id,author_id,body) values(thread,actor,'Denied locked reply');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Locked reply allowed'; end if;
 reset role;

 perform set_config('request.jwt.claims',jsonb_build_object('sub',moderator,'role','authenticated')::text,true);
 set local role authenticated;
 denied:=false;
 begin
  update public.business_documents set status='approved' where id=document;
  get diagnostics rows_changed=row_count;
  denied := rows_changed=0;
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Moderator reviewed business document'; end if;
 perform public.moderate_forum_content('thread',thread,'{"is_locked":false}', 'Synthetic rollback-only reopening');
 reset role;
 if not exists(select 1 from public.audit_logs where action='forum.moderate' and entity_id=thread
   and actor_id=moderator and metadata->>'reason'='Synthetic rollback-only reopening') then
  raise exception 'Forum review audit missing';
 end if;

 perform set_config('request.jwt.claims',jsonb_build_object('sub',reviewer,'role','authenticated')::text,true);
 set local role authenticated;
 update public.business_documents set status='approved',review_note='Synthetic rollback-only review' where id=document;
 get diagnostics rows_changed=row_count;
 if rows_changed<>1 then raise exception 'Authorized document review did not update'; end if;
 denied:=false;
 begin
  update public.business_documents set title='Rewritten submission' where id=document;
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Reviewer rewrote submission'; end if;
 denied:=false;
 begin
  insert into public.business_documents(business_id,title,file_url,uploaded_by,status)
  values(own_business,'Self-reviewed document','smoke/private.pdf',reviewer,'approved');
 exception when insufficient_privilege then denied:=true; end;
 if not denied then raise exception 'Reviewer approved own document'; end if;
 reset role;
 if not exists(select 1 from public.audit_logs where action='business_document.review'
   and entity_id=document and actor_id=reviewer) then raise exception 'Document audit missing'; end if;
 if has_function_privilege('anon','public.platform_role(uuid)','EXECUTE') then raise exception 'Anonymous role lookup exposed'; end if;
 if has_table_privilege('authenticated','private.client_write_buckets','UPDATE') then raise exception 'Quota counters exposed'; end if;
 if exists(select 1 from private.forum_review_context) then raise exception 'Review context leaked'; end if;
end $$;
rollback;
select 'PASS: quota, role isolation, correction intake, forum locks, review authorization and audits; all synthetic writes rolled back' as result;
