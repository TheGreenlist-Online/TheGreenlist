-- Recovered source snapshot; local review/testing only. No user records.
CREATE OR REPLACE FUNCTION private.audit_business_document_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
 caller_role text := current_setting('role',true);
 before_review jsonb := null;
 after_review jsonb := jsonb_build_object('status',new.status,'review_note',new.review_note);
begin
 -- Preserve the guard's explicit trusted import/maintenance exemptions.
 if caller_role in ('service_role','postgres','supabase_admin')
  or (caller_role='none' and session_user in ('service_role','postgres','supabase_admin')) then
  return new;
 end if;
 if tg_op='INSERT' then
  if new.status='pending_review' and new.review_note is null
   and new.uploaded_by is not distinct from auth.uid() then return new; end if;
 else
  before_review := jsonb_build_object('status',old.status,'review_note',old.review_note);
  if before_review=after_review then return new; end if;
 end if;
 if auth.uid() is null or not coalesce(public.has_permission('business.review'),false) then
  raise exception using errcode='42501',message='Document review audit requires review authority';
 end if;
 -- Never copy file paths, titles, uploader identity, or other submission data.
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
 values(auth.uid(),'business_document.review','business_documents',new.id,
  jsonb_build_object('operation',tg_op,'before',before_review,'after',after_review));
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION private.enforce_client_write_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare caller_role text := current_setting('role',true); actor uuid := auth.uid();
 bucket timestamptz := date_trunc('hour',statement_timestamp(),'UTC'); used_count integer;
 cap integer := tg_argv[0]::integer;
begin
 -- SET ROLE remains the caller's selected DB role inside SECURITY DEFINER.
 if (caller_role in ('service_role','postgres','supabase_admin') or (caller_role='none' and session_user in ('postgres','supabase_admin'))) then return new; end if;
 if actor is null then raise exception using errcode='42501',message='A signed-in account is required'; end if;
 insert into private.client_write_buckets as b(user_id,action,window_start,used)
 values(actor,tg_table_name||':'||tg_op,bucket,1)
 on conflict(user_id,action) do update set
 used=case when b.window_start=excluded.window_start then b.used+1 else 1 end,
 window_start=excluded.window_start
 returning used into used_count;
 if used_count>cap then raise sqlstate 'PT429' using message='Hourly write quota exceeded; retry in the next hour'; end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION private.guard_business_document_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
 if current_user in ('service_role','postgres','supabase_admin') then return new; end if;
 -- Check before every untrusted path: NULL actor/uploader equality is not auth.
 if auth.uid() is null then
  raise exception using errcode='42501',message='Document writes require an authenticated actor';
 end if;
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
  if new.status is null or new.status not in ('pending_review','approved','rejected') then
   raise exception using errcode='22023',message='Invalid document review status';
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
end $function$
;
CREATE OR REPLACE FUNCTION private.guard_coa_intake()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  if tg_op = 'INSERT' then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.owner_id::text, 17202824));
    -- A network retry for a known id must reach the unique constraint, even when
    -- the owner's quota has since been reached. It cannot write another object.
    if not exists (select 1 from public.coa_reports where id = new.id) then
      if (select count(*) from public.coa_reports where owner_id = new.owner_id) >= 50
        or (select count(*) from public.coa_reports where owner_id = new.owner_id and created_at > now() - interval '24 hours') >= 5 then
        raise exception using errcode = 'PT429', message = 'COA intake quota reached';
      end if;
    end if;
    if new.intake_status <> 'upload_pending' or new.received_at is not null or new.created_at is distinct from now() then
      raise exception using errcode = '42501', message = 'COA must begin with an upload reservation';
    end if;
  else
    if (to_jsonb(new) - 'intake_status' - 'received_at') is distinct from (to_jsonb(old) - 'intake_status' - 'received_at')
      or old.intake_status <> 'upload_pending' or new.intake_status not in ('submitted', 'upload_failed') then
      raise exception using errcode = '42501', message = 'COA source and receipt are immutable';
    end if;
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.guard_forum_review_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  -- Defaults have already run, so always replace caller-supplied metadata.
  -- App inserts consume RETURNING rows; maintenance retains its bypass above.
  new.id := gen_random_uuid();
  new.created_at := now();
  new.updated_at := now();
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
end $function$
;
CREATE OR REPLACE FUNCTION private.is_platform_owner(check_user_id uuid DEFAULT auth.uid())
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = check_user_id
      AND raw_app_meta_data ->> 'platform_owner' = 'true'
  );
$function$
;
CREATE OR REPLACE FUNCTION private.is_platform_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.is_reviewer();
$function$
;
CREATE OR REPLACE FUNCTION private.protect_profile_authority()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
begin
 if new.id <> old.id then raise exception 'Profile identity cannot be changed'; end if;
 if new.role is distinct from old.role and not private.is_platform_owner(auth.uid()) then
  raise exception 'Only the platform owner can assign roles';
 end if;
 if private.is_platform_owner(old.id) and new.role is distinct from 'ADMIN' then
  raise exception 'The platform owner must retain the ADMIN role';
 end if;
 if new.role is distinct from old.role then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'ROLE_ASSIGNED_BY_PLATFORM_OWNER','profile',new.id,
   jsonb_build_object('from',old.role,'to',new.role,'human_review_required',true));
 end if;
 return new;
end $function$
;
CREATE OR REPLACE FUNCTION private.protect_report_review_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  -- Use the actual database role, never an editable user-metadata claim.
  if current_user in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.status is distinct from 'submitted'
      or new.verification_status is distinct from 'unverified'
      or new.risk_level is distinct from 'medium'
      or new.confidence_score is distinct from 0
      or new.public_summary is not null or new.admin_notes is not null then
      raise exception using errcode = '42501', message = 'Report review fields are reserved for authorized moderation';
    end if;
  else
    if new.id is distinct from old.id
      or new.reporter_id is distinct from old.reporter_id
      or new.created_at is distinct from old.created_at
      or new.status is distinct from old.status
      or new.verification_status is distinct from old.verification_status
      or new.risk_level is distinct from old.risk_level
      or new.confidence_score is distinct from old.confidence_score
      or new.public_summary is distinct from old.public_summary
      or new.admin_notes is distinct from old.admin_notes then
      raise exception using errcode = '42501', message = 'Report identity and review fields cannot be changed by the reporter';
    end if;
    if old.status <> 'submitted' and new is distinct from old then
      raise exception using errcode = '42501', message = 'Reports already in review must be changed through the correction workflow';
    end if;
  end if;
  if char_length(new.title) > 160 or char_length(new.description) > 50000
    or char_length(new.location_city) > 160 or char_length(new.location_state) > 160
    or char_length(new.business_name_reported) > 160 then
    raise exception using errcode = '22001', message = 'Report text exceeds the allowed size';
  end if;
  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION private.thread_accepts_reply(p_thread uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION public.audit_organization_verification_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
                                                                                                                                                                                                                                                                                                                                                             begin
                                                                                                                                                                                                                                                                                                                                                               if new.status = 'withdrawn' then return new; end if;
                                                                                                                                                                                                                                                                                                                                                                 insert into public.audit_logs(actor_id, action, entity_type, entity_id, metadata)
                                                                                                                                                                                                                                                                                                                                                                   values(auth.uid(), 'organization_verification.review', 'organization_verification_requests', new.id,
                                                                                                                                                                                                                                                                                                                                                                       jsonb_build_object('before_status', old.status, 'after_status', new.status));
                                                                                                                                                                                                                                                                                                                                                                         return new;
                                                                                                                                                                                                                                                                                                                                                                         end;
                                                                                                                                                                                                                                                                                                                                                                         $function$
;
CREATE OR REPLACE FUNCTION public.can_manage_organization_members(p_organization_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
                                              select exists (
                                                  select 1 from public.business_profiles b
                                                      where b.id = p_organization_id and b.owner_id = auth.uid()
                                                        ) or exists (
                                                            select 1 from public.organization_memberships m
                                                                where m.organization_id = p_organization_id and m.user_id = auth.uid()
                                                                      and m.status = 'active' and m.role in ('owner', 'admin')
                                                                        );
                                                                        $function$
;
CREATE OR REPLACE FUNCTION public.current_platform_role()
 RETURNS text
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select p.role::text
  from public.profiles as p
  where p.id = (select auth.uid());
$function$
;
CREATE OR REPLACE FUNCTION public.current_role_category()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.role_category(public.current_platform_role()::public.app_role);
$function$
;
CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.current_platform_role()::text;
$function$
;
CREATE OR REPLACE FUNCTION public.guard_organization_membership_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
                                                                                begin
                                                                                  if new.id is distinct from old.id
                                                                                       or new.organization_id is distinct from old.organization_id
                                                                                            or new.user_id is distinct from old.user_id then
                                                                                                raise exception 'Membership identity is immutable; remove and re-invite instead.';
                                                                                                  end if;
                                                                                                    new.updated_at := now();
                                                                                                      return new;
                                                                                                      end;
                                                                                                      $function$
;
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(
    regexp_replace(
      coalesce(
        nullif(new.raw_user_meta_data ->> 'username', ''),
        nullif(new.raw_user_meta_data ->> 'preferred_username', ''),
        nullif(split_part(new.email, '@', 1), ''),
        'user'
      ),
      '[^a-z0-9_]+',
      '_',
      'g'
    )
  );

  base_username := trim(both '_' from base_username);

  if base_username is null or base_username = '' then
    base_username := 'user';
  end if;

  final_username := left(base_username, 24) || '_' || replace(left(new.id::text, 8), '-', '');

  insert into public.profiles (
    id,
    username,
    display_name,
    role,
    verification_status,
    is_public,
    is_anonymous_allowed
  )
  values (
    new.id,
    final_username,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      final_username
    ),
    'USER',
    'unverified',
    true,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.has_permission(p_permission text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select public.is_platform_owner() or exists (
  select 1 from public.role_permissions rp
  where rp.role::text = public.current_platform_role()::text
    and rp.permission = p_permission
 );
$function$
;
CREATE OR REPLACE FUNCTION public.has_role(check_user_id uuid, check_role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.platform_role(check_user_id) = check_role;
$function$
;
CREATE OR REPLACE FUNCTION public.humanize_status(value text)
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select nullif(btrim(lower(replace(coalesce(value, ''), '_', ' '))), '')
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.is_platform_owner() or public.current_platform_role() = 'ADMIN';
$function$
;
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator(check_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select
    public.has_role(check_user_id, 'ADMIN'::public.app_role)
    or public.has_role(check_user_id, 'MODERATOR'::public.app_role);
$function$
;
CREATE OR REPLACE FUNCTION public.is_operator()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.role_category(public.current_platform_role()::public.app_role) = 'OPERATOR';
$function$
;
CREATE OR REPLACE FUNCTION public.is_platform_owner()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select private.is_platform_owner(auth.uid());
$function$
;
CREATE OR REPLACE FUNCTION public.is_reviewer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.is_platform_owner()
      or public.role_category(public.current_platform_role()::public.app_role) = 'REVIEW';
$function$
;
CREATE OR REPLACE FUNCTION public.moderate_forum_content(p_target_type text, p_target_id uuid, p_changes jsonb, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
end $function$
;
CREATE OR REPLACE FUNCTION public.notify_business_claim_decision()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_new text;
  v_title text;
  v_body text;
  v_type text;
begin
  if new.owner_id is null then
    return new;
  end if;

  if new.verification_status is not distinct from old.verification_status then
    return new;
  end if;

  v_new := public.humanize_status(new.verification_status);

  if v_new is null then
    return new;
  end if;

  if v_new = 'verified' then
    v_type := 'claim_approved';
    v_title := new.name || ' is verified';
    v_body := 'Your claim was approved. You can now manage this profile and respond to reports about it.';
  elsif v_new = 'rejected' then
    v_type := 'claim_rejected';
    v_title := 'Claim on ' || new.name || ' was not approved';
    v_body := 'A reviewer could not confirm your authority over this business. '
      || 'Contact support if you can provide licence or registration details.';
  else
    v_type := 'claim_status';
    v_title := 'Claim on ' || new.name || ' is now ' || v_new;
    v_body := 'The verification state of this business profile changed to ' || v_new || '.';
  end if;

  insert into public.notifications (profile_id, type, title, body, link_url)
  values (new.owner_id, v_type, v_title, v_body, '/businesses/' || new.slug);

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.notify_report_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_status_changed boolean;
  v_verification_changed boolean;
  v_title text;
  v_body text;
  v_new text;
  v_old text;
begin
  -- Anonymous reports still notify their author. Anonymity governs what the
  -- public sees, not whether the reporter hears back about their own report.
  if new.reporter_id is null then
    return new;
  end if;

  v_status_changed := new.status is distinct from old.status;
  v_verification_changed := new.verification_status is distinct from old.verification_status;

  if not (v_status_changed or v_verification_changed) then
    return new;
  end if;

  if v_status_changed then
    v_new := public.humanize_status(new.status);
    v_old := public.humanize_status(old.status);

    if v_new is null then
      return new;
    end if;

    v_title := 'Your report is now ' || v_new;
    v_body := case
      when v_old is null then 'Status set to ' || v_new || '.'
      else 'Status changed from ' || v_old || ' to ' || v_new || '.'
    end;
    v_body := v_body || ' Report: "' || coalesce(new.title, 'Untitled report') || '".';
  else
    v_new := public.humanize_status(new.verification_status);

    if v_new is null then
      return new;
    end if;

    v_title := 'Verification updated to ' || v_new;
    v_body := 'The verification state of "' || coalesce(new.title, 'Untitled report')
      || '" is now ' || v_new || '.';
  end if;

  insert into public.notifications (profile_id, type, title, body, link_url)
  values (
    new.reporter_id,
    case when v_status_changed then 'report_status' else 'report_verification' end,
    v_title,
    v_body,
    '/reports/' || new.id::text
  );

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.platform_role(p_user uuid)
 RETURNS app_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare result public.app_role;
begin
 if auth.uid() is null then
  if coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    session_user
  ) <> 'service_role' then
   return null;
  end if;
 elsif p_user is distinct from auth.uid() then
  if not coalesce(public.is_admin(),false) then return null; end if;
 end if;
 select p.role into result from public.profiles p where p.id=p_user;
 return result;
end $function$
;
CREATE OR REPLACE FUNCTION public.protect_business_review_fields()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  v_role text;
begin
  v_role := coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_user
  );

  -- Service role (admin-gated API routes) and direct database sessions are
  -- trusted to set review outcomes.
  if v_role in ('service_role', 'postgres', 'supabase_admin') then
    return new;
  end if;

  new.verification_status := old.verification_status;
  new.sponsorship_status := old.sponsorship_status;
  new.trust_rating := old.trust_rating;
  new.transparency_score := old.transparency_score;

  return new;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;
CREATE OR REPLACE FUNCTION public.role_category(p_role app_role)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select rc.category from public.role_catalog rc where rc.role = p_role;
$function$
;
CREATE OR REPLACE FUNCTION public.role_rank(p_role text)
 RETURNS integer
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$
  select case upper(coalesce(p_role, ''))
    when 'ADMIN' then 60
    when 'MODERATOR' then 50
    when 'DISTRIBUTOR' then 40
    when 'CULTIVATOR' then 30
    when 'BUSINESS' then 20
    when 'USER' then 10
    else 0
  end;
$function$
;
CREATE OR REPLACE FUNCTION public.search_public_content(search_text text, result_limit integer DEFAULT 20, result_offset integer DEFAULT 0)
 RETURNS TABLE(entity_type text, entity_id uuid, title text, summary text, href text, published_at timestamp with time zone, rank real)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
  with input as (
    select case when length(trim(search_text)) between 2 and 256
      then websearch_to_tsquery('english', trim(search_text)) end as query
    where length(trim(search_text)) between 2 and 256
  ),
  matches (entity_type, entity_id, title, summary, href, published_at, rank) as (
    select 'business'::text, b.id, b.name, b.description,
           '/businesses/' || b.slug, b.created_at,
           ts_rank_cd(b.search_vector, i.query)
    from public.business_profiles b cross join input i
    where b.is_active = true and b.search_vector @@ i.query
    union all
    select 'forum_thread', t.id, t.title, left(t.body, 320),
           '/forums/' || f.slug || '/' || coalesce(t.slug, t.id::text), t.created_at,
           ts_rank_cd(t.search_vector, i.query)
    from public.forum_threads t
    join public.forums f on f.id = t.forum_id
    cross join input i
    where t.status = 'published' and t.visibility = 'public' and f.is_active = true
      and t.search_vector @@ i.query
    union all
    select 'news', n.id, n.title, n.summary,
           '/news', coalesce(n.published_at, n.created_at),
           ts_rank_cd(n.search_vector, i.query)
    from public.news n cross join input i
    where n.search_vector @@ i.query
    union all
    select 'education', e.id, e.title, e.summary,
           '/education/' || e.id::text, e.created_at,
           ts_rank_cd(e.search_vector, i.query)
    from public.education_resources e cross join input i
    where e.status = 'APPROVED' and e.search_vector @@ i.query
  )
  select *
  from matches
  order by rank desc, published_at desc, entity_id
  limit least(greatest(coalesce(result_limit, 20), 1), 50)
  offset least(greatest(coalesce(result_offset, 0), 0), 1000);
$function$
;
CREATE OR REPLACE FUNCTION public.seed_organization_owner_membership()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
                          begin
                            if new.owner_id is not null then
                                insert into public.organization_memberships (organization_id, user_id, role, status, accepted_at)
                                    values (new.id, new.owner_id, 'owner', 'active', now())
                                        on conflict (organization_id, user_id) do nothing;
                                          end if;
                                            return new;
                                            end;
                                            $function$
;
CREATE OR REPLACE FUNCTION public.touch_organization_verification_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
                                                                                                                                          begin
                                                                                                                                            if new.id is distinct from old.id
                                                                                                                                                 or new.organization_id is distinct from old.organization_id
                                                                                                                                                      or new.submitted_by is distinct from old.submitted_by
                                                                                                                                                           or new.created_at is distinct from old.created_at then
                                                                                                                                                               raise exception 'Verification request identity is immutable.';
                                                                                                                                                                 end if;
                                                                                                                                                                   if auth.uid() is null then
                                                                                                                                                                       raise exception 'Verification updates require an authenticated actor.';
                                                                                                                                                                         end if;
                                                                                                                                                                           -- Submitters retain withdrawal even when they also hold review permission.
                                                                                                                                                                             if old.submitted_by = auth.uid() and new.status = 'withdrawn' then
                                                                                                                                                                                 if old.status not in ('submitted', 'needs_information')
                                                                                                                                                                                        or (to_jsonb(new) - 'status' - 'updated_at') is distinct from
                                                                                                                                                                                                  (to_jsonb(old) - 'status' - 'updated_at') then
                                                                                                                                                                                                        raise exception 'Applicants may only withdraw an open request.';
                                                                                                                                                                                                            end if;
                                                                                                                                                                                                              else
                                                                                                                                                                                                                  if not coalesce(public.has_permission('business.review'), false) then
                                                                                                                                                                                                                        raise exception 'Verification review requires business.review.';
                                                                                                                                                                                                                            end if;
                                                                                                                                                                                                                                if old.submitted_by = auth.uid()
                                                                                                                                                                                                                                       or exists(select 1 from public.business_profiles b
                                                                                                                                                                                                                                                        where b.id = old.organization_id and b.owner_id = auth.uid())
                                                                                                                                                                                                                                                               or exists(select 1 from public.organization_memberships m
                                                                                                                                                                                                                                                                                where m.organization_id = old.organization_id and m.user_id = auth.uid()) then
                                                                                                                                                                                                                                                                                      raise exception 'Reviewers cannot review affiliated organizations.';
                                                                                                                                                                                                                                                                                          end if;
                                                                                                                                                                                                                                                                                              if (to_jsonb(new) - array['status','review_note','updated_at']) is distinct from
                                                                                                                                                                                                                                                                                                     (to_jsonb(old) - array['status','review_note','updated_at']) then
                                                                                                                                                                                                                                                                                                           raise exception 'Review cannot rewrite submitted details or attribution.';
                                                                                                                                                                                                                                                                                                               end if;
                                                                                                                                                                                                                                                                                                                   if old.status not in ('submitted', 'in_review', 'needs_information') then
                                                                                                                                                                                                                                                                                                                         raise exception 'Closed verification requests cannot be reviewed.';
                                                                                                                                                                                                                                                                                                                             end if;
                                                                                                                                                                                                                                                                                                                                 if new.status not in ('in_review', 'needs_information', 'approved', 'rejected') then
                                                                                                                                                                                                                                                                                                                                       raise exception 'Invalid verification review status.';
                                                                                                                                                                                                                                                                                                                                           end if;
                                                                                                                                                                                                                                                                                                                                               new.reviewed_by := auth.uid();
                                                                                                                                                                                                                                                                                                                                                   new.reviewed_at := now();
                                                                                                                                                                                                                                                                                                                                                     end if;
                                                                                                                                                                                                                                                                                                                                                       new.updated_at := now();
                                                                                                                                                                                                                                                                                                                                                         return new;
                                                                                                                                                                                                                                                                                                                                                         end;
                                                                                                                                                                                                                                                                                                                                                         $function$
;
