create or replace function private.guard_business_document_review()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user in ('service_role','postgres','supabase_admin') then return new; end if;
 if tg_op='INSERT' and new.status is not distinct from 'pending_review'
  and new.review_note is null and new.uploaded_by is not distinct from auth.uid() then
  return new;
 end if;
 if coalesce(public.has_permission('business.review'),false) then
  if new.uploaded_by=auth.uid()
   or exists(select 1 from public.business_profiles b where b.id=new.business_id and b.owner_id=auth.uid()) then
   raise exception using errcode='42501',message='Document reviewers cannot review their own submissions or businesses';
  end if;
  if tg_op='UPDATE' then
   if old.uploaded_by=auth.uid()
    or exists(select 1 from public.business_profiles b where b.id=old.business_id and b.owner_id=auth.uid()) then
    raise exception using errcode='42501',message='Document reviewers cannot review their own submissions or businesses';
   end if;
   if (to_jsonb(new) - array['status','review_note','updated_at'])
    is distinct from (to_jsonb(old) - array['status','review_note','updated_at']) then
    raise exception using errcode='42501',message='Document review updates cannot change submission details';
   end if;
  end if;
  return new;
 end if;
 if tg_op='INSERT' then
  if new.status is distinct from 'pending_review' or new.review_note is not null
   or new.uploaded_by is distinct from auth.uid() then
   raise exception using errcode='42501',message='Document submissions cannot supply review outcomes';
  end if;
 else
  raise exception using errcode='42501',message='Document review updates require review authority';
 end if;
 return new;
end $$;
revoke all on function private.guard_business_document_review() from public,anon,authenticated;
create trigger guard_business_document_review before insert or update on public.business_documents
for each row execute function private.guard_business_document_review();

-- Lock the parent row without applying the author's UPDATE policy to readers.
-- This helper returns only a boolean, checks visibility itself, and is private.
create or replace function private.thread_accepts_reply(p_thread uuid)
returns boolean language plpgsql security definer set search_path='' as $$
declare locked boolean;
begin
 if auth.uid() is null then return false; end if;
 select t.is_locked into locked from public.forum_threads t
 where t.id=p_thread and t.status='published'
 and (t.visibility in ('public','auth') or t.author_id=auth.uid())
 and exists(select 1 from public.forums f where f.id=t.forum_id and f.is_active)
 for share;
 if not found then return false; end if;
 return not locked;
end $$;
revoke all on function private.thread_accepts_reply(uuid) from public,anon;
revoke execute on function private.thread_accepts_reply(uuid) from authenticated;

-- Only the audited RPC can establish this transaction-scoped capability.
-- Unlike a custom GUC, authenticated SQL callers cannot forge it.
create table private.forum_review_context (
 transaction_id bigint primary key,
 actor_id uuid not null,
 target_table text not null,
 target_id uuid not null
);
alter table private.forum_review_context enable row level security;
revoke all on private.forum_review_context from public,anon,authenticated,service_role;

create or replace function private.guard_forum_review_fields()
returns trigger language plpgsql security definer set search_path='' as $$
declare
 trusted boolean := current_setting('role',true) in ('postgres','supabase_admin')
  or (current_setting('role',true)='none' and session_user in ('postgres','supabase_admin'));
 audited boolean := false;
 protected_changed boolean;
 before_row jsonb;
 after_row jsonb := to_jsonb(new);
begin
 -- Maintenance can seed rows, but body limits also apply to maintenance.
 if char_length(new.body)>50000 then
  raise exception using errcode='22001',message='Forum body exceeds 50000 characters';
 end if;
 if trusted then return new; end if;
 if auth.uid() is null then
  raise exception using errcode='42501',message='Forum writes require an authenticated actor';
 end if;
if tg_op='INSERT' then
  if new.author_id is distinct from auth.uid() or new.status is distinct from 'published'
   or new.risk_level is distinct from 'low' then
   raise exception using errcode='42501',message='Forum submissions cannot supply review outcomes';
  end if;
  if tg_table_name='forum_posts' then
   if new.parent_post_id is not null
    and not exists(select 1 from public.forum_posts p where p.id=new.parent_post_id and p.thread_id=new.thread_id) then
    raise exception using errcode='42501',message='Reply parent must belong to the same thread';
   end if;
  end if;
  if tg_table_name='forum_threads' then
   if new.is_locked or new.is_pinned or new.ai_summary is not null then
    raise exception using errcode='42501',message='Thread submissions cannot supply moderation fields';
   end if;
  end if;
 else
  before_row := to_jsonb(old);
  if new.id is distinct from old.id or new.author_id is distinct from old.author_id
   or new.created_at is distinct from old.created_at then
   raise exception using errcode='42501',message='Forum identity cannot be changed';
  end if;
  if tg_table_name='forum_threads' then
   if new.forum_id is distinct from old.forum_id then
    raise exception using errcode='42501',message='Forum placement cannot be changed';
   end if;
  elsif new.thread_id is distinct from old.thread_id
   or new.parent_post_id is distinct from old.parent_post_id then
   raise exception using errcode='42501',message='Reply placement cannot be changed';
  end if;
  protected_changed := new.status is distinct from old.status or new.risk_level is distinct from old.risk_level;
  if tg_table_name='forum_threads' then
   protected_changed := protected_changed or new.is_locked is distinct from old.is_locked
    or new.is_pinned is distinct from old.is_pinned or new.ai_summary is distinct from old.ai_summary;
  end if;
   select exists(select 1 from private.forum_review_context c
    where c.transaction_id=txid_current() and c.actor_id=auth.uid()
     and c.target_table=tg_table_name and c.target_id=old.id) into audited;
  if protected_changed or audited then
   if old.author_id=auth.uid() or new.author_id=auth.uid() then
    raise exception using errcode='42501',message='Reviewers cannot moderate their own forum content';
   end if;
   if not audited or not coalesce(public.has_permission('moderation.review'),false) then
    raise exception using errcode='42501',message='Forum moderation requires the audited moderation RPC';
   end if;
   -- The capability only permits moderation, never rewriting content/identity.
   if (after_row - array['status','risk_level','is_locked','is_pinned','ai_summary','updated_at','search_vector'])
    is distinct from (before_row - array['status','risk_level','is_locked','is_pinned','ai_summary','updated_at','search_vector']) then
    raise exception using errcode='42501',message='Moderation cannot rewrite forum content';
   end if;
  else
   if old.author_id is distinct from auth.uid() or old.status <> 'published' then
    raise exception using errcode='42501',message='Only authors may edit their published content';
   end if;
  end if;
 end if;
 -- Audited moderation may hide/restore replies on locked or removed threads.
 -- It cannot insert replies or change their body; ordinary writes always check
 -- the parent under a row lock, including writes by reviewer-authors.
 if not audited then
  if tg_table_name='forum_posts' then
   if not private.thread_accepts_reply(new.thread_id) then
    raise exception using errcode='42501',message='Replies require an accessible published and unlocked thread';
   end if;
  elsif tg_op='UPDATE' and old.is_locked then
   raise exception using errcode='42501',message='Locked threads cannot be edited by their author';
  end if;
 end if;
 return new;
end $$;
revoke all on function private.guard_forum_review_fields() from public,anon,authenticated;
create trigger guard_forum_review_fields before insert or update on public.forum_threads
for each row execute function private.guard_forum_review_fields();
create trigger guard_forum_review_fields before insert or update on public.forum_posts
for each row execute function private.guard_forum_review_fields();

-- Narrow, authenticated API: no actor parameter, no content/placement writes,
-- no service-key bypass, and no caller-controlled SQL identifiers.
create or replace function public.moderate_forum_content(
 p_target_type text, p_target_id uuid, p_changes jsonb, p_reason text
) returns void language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid();
 target_table text;
 before_row jsonb;
 after_row jsonb;
 parent_thread uuid;
begin
 if actor is null or not coalesce(public.has_permission('moderation.review'),false) then
  raise exception using errcode='42501',message='Forum moderation requires moderation.review';
 end if;
 if p_reason is null or char_length(btrim(p_reason))=0 or char_length(p_reason)>2000 then
  raise exception using errcode='22023',message='A moderation reason of 1 to 2000 characters is required';
 end if;
 if p_target_type='thread' then target_table := 'forum_threads';
 elsif p_target_type='post' then target_table := 'forum_posts';
 else raise exception using errcode='22023',message='Unknown forum target type'; end if;
 if p_changes is null or jsonb_typeof(p_changes)<>'object' or p_changes='{}'::jsonb then
  raise exception using errcode='22023',message='Moderation changes must be a nonempty object';
 end if;
 if exists(select 1 from jsonb_each(p_changes) e where e.key not in ('status','risk_level')
  and not (p_target_type='thread' and e.key in ('is_locked','is_pinned','ai_summary'))) then
  raise exception using errcode='22023',message='Only moderation fields may be changed';
 end if;
 if exists(select 1 from jsonb_each(p_changes) e where
  (e.key in ('status','risk_level') and jsonb_typeof(e.value)<>'string') or
  (e.key in ('is_locked','is_pinned') and jsonb_typeof(e.value)<>'boolean') or
  (e.key='ai_summary' and jsonb_typeof(e.value) not in ('string','null'))) then
  raise exception using errcode='22023',message='Invalid moderation field type';
 end if;
 -- Values must come from the allowed vocabulary; plain text columns carry no
 -- CHECK constraint, so a typo like 'publshed' or 'urgent' would otherwise be
 -- written verbatim and silently drop the row out of all read policies.
 if p_changes ? 'status' and p_changes->>'status' not in ('published','removed','hidden','flagged') then
  raise exception using errcode='22023',message='Invalid moderation status value';
 end if;
 if p_changes ? 'risk_level' and p_changes->>'risk_level' not in ('low','medium','high','critical') then
  raise exception using errcode='22023',message='Invalid moderation risk_level value';
 end if;
 if p_target_type='thread' then
  select to_jsonb(t) into before_row from public.forum_threads t where t.id=p_target_id for update;
  parent_thread := p_target_id;
 else
  -- Parent-first lock order agrees with reply insertion and thread moderation.
  select thread_id into parent_thread from public.forum_posts where id=p_target_id;
  perform 1 from public.forum_threads where id=parent_thread for share;
  select to_jsonb(p) into before_row from public.forum_posts p where p.id=p_target_id for update;
 end if;
 if before_row is null then
  raise exception using errcode='22023',message='Forum target not found';
 end if;
 if (before_row->>'author_id')::uuid=actor then
  raise exception using errcode='42501',message='Reviewers cannot moderate their own forum content';
 end if;
 -- Review authority does not grant access to someone else's private thread.
 if not exists(select 1 from public.forum_threads t join public.forums f on f.id=t.forum_id
  where t.id=parent_thread and f.is_active and t.visibility in ('public','auth')) then
  raise exception using errcode='42501',message='Forum target is inaccessible';
 end if;
 insert into private.forum_review_context values(txid_current(),actor,target_table,p_target_id);
 if p_target_type='thread' then
  update public.forum_threads set
   status=case when p_changes ? 'status' then p_changes->>'status' else status end,
   risk_level=case when p_changes ? 'risk_level' then p_changes->>'risk_level' else risk_level end,
   is_locked=case when p_changes ? 'is_locked' then (p_changes->>'is_locked')::boolean else is_locked end,
   is_pinned=case when p_changes ? 'is_pinned' then (p_changes->>'is_pinned')::boolean else is_pinned end,
   ai_summary=case when p_changes ? 'ai_summary' then p_changes->>'ai_summary' else ai_summary end,
   updated_at=now() where id=p_target_id returning to_jsonb(forum_threads.*) into after_row;
 else
  update public.forum_posts set
   status=case when p_changes ? 'status' then p_changes->>'status' else status end,
   risk_level=case when p_changes ? 'risk_level' then p_changes->>'risk_level' else risk_level end,
   updated_at=now() where id=p_target_id returning to_jsonb(forum_posts.*) into after_row;
 end if;
 -- Failure here rolls back both the decision and its capability. Store only
 -- moderation fields, never body/author/anonymous content in the audit metadata.
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(actor,'forum.moderate',target_table,p_target_id,jsonb_build_object(
  'reason',btrim(p_reason),'before',(select jsonb_object_agg(e.key,e.value) from jsonb_each(before_row) e
    where e.key in ('status','risk_level','is_locked','is_pinned','ai_summary')),
  'after',(select jsonb_object_agg(e.key,e.value) from jsonb_each(after_row) e
    where e.key in ('status','risk_level','is_locked','is_pinned','ai_summary'))));
 delete from private.forum_review_context where transaction_id=txid_current();
end $$;
revoke all on function public.moderate_forum_content(text,uuid,jsonb,text) from public,anon,service_role;
grant execute on function public.moderate_forum_content(text,uuid,jsonb,text) to authenticated;
