create or replace function private.guard_business_document_review()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user in ('service_role','postgres','supabase_admin') or coalesce(public.is_reviewer(),false) then return new; end if;
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

create or replace function private.guard_forum_review_fields()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if current_setting('role',true) in ('service_role','postgres','supabase_admin')
  or (current_setting('role',true)='none' and session_user in ('postgres','supabase_admin'))
  or coalesce(public.is_reviewer(),false) then return new; end if;
 if tg_op='INSERT' then
  if new.status is distinct from 'published' or new.risk_level is distinct from 'low' then
   raise exception using errcode='42501',message='Forum review fields require review authority';
  end if;
  if tg_table_name='forum_threads' then
   if new.is_locked or new.is_pinned or new.ai_summary is not null then
    raise exception using errcode='42501',message='Thread moderation fields require review authority';
   end if;
  end if;
 else
  if new.id is distinct from old.id or new.author_id is distinct from old.author_id
   or new.created_at is distinct from old.created_at or new.status is distinct from old.status
   or new.risk_level is distinct from old.risk_level then
   raise exception using errcode='42501',message='Forum identity and review fields cannot be changed by authors';
  end if;
  if old.status <> 'published' then
   raise exception using errcode='42501',message='Moderated content cannot be rewritten by its author';
  end if;
  if tg_table_name='forum_threads' then
   if new.is_locked is distinct from old.is_locked or new.is_pinned is distinct from old.is_pinned
    or new.ai_summary is distinct from old.ai_summary or new.forum_id is distinct from old.forum_id then
    raise exception using errcode='42501',message='Thread moderation and forum placement require review authority';
   end if;
  else
   if new.thread_id is distinct from old.thread_id or new.parent_post_id is distinct from old.parent_post_id then
    raise exception using errcode='42501',message='Reply placement cannot be changed';
   end if;
  end if;
 end if;
 if tg_table_name='forum_posts' then
  if not private.thread_accepts_reply(new.thread_id) then
   raise exception using errcode='42501',message='Replies require an accessible published and unlocked thread';
  end if;
 elsif tg_op='UPDATE' and old.is_locked then
  raise exception using errcode='42501',message='Locked threads cannot be edited by their author';
 end if;
 if char_length(new.body)>50000 then
  raise exception using errcode='22001',message='Forum body exceeds 50000 characters';
 end if;
 return new;
end $$;
revoke all on function private.guard_forum_review_fields() from public,anon,authenticated;
create trigger guard_forum_review_fields before insert or update on public.forum_threads
for each row execute function private.guard_forum_review_fields();
create trigger guard_forum_review_fields before insert or update on public.forum_posts
for each row execute function private.guard_forum_review_fields();
