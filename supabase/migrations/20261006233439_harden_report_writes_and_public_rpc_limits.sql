-- Direct Supabase calls must preserve the same review boundary as the API.
-- No table data is removed; service-role moderation remains unchanged.
revoke insert, update, delete on public.ai_audit_logs from anon;
drop policy if exists ai_audit_logs_anon_insert on public.ai_audit_logs;

-- Trigger functions are internal; triggers do not require caller EXECUTE grants.
revoke execute on function public.notify_business_claim_decision() from public, anon, authenticated;
revoke execute on function public.notify_report_status_change() from public, anon, authenticated;
revoke execute on function public.protect_business_review_fields() from public, anon, authenticated;

create or replace function private.protect_report_review_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
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
$$;
revoke all on function private.protect_report_review_fields() from public, anon, authenticated;
drop trigger if exists protect_report_review_fields on public.reports;
create trigger protect_report_review_fields before insert or update on public.reports
for each row execute function private.protect_report_review_fields();

-- Preserve SECURITY INVOKER and RLS; bound parser input and pagination work.
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
$function$;

-- Avoid re-evaluating the same identity for every row, without changing access.
alter policy "authenticated users can submit education resources" on public.education_resources with check (((submitter_id = (select auth.uid())) AND (status = ANY (ARRAY['DRAFT'::text, 'PENDING_REVIEW'::text]))));
alter policy "education resources are publicly readable when approved" on public.education_resources using (((status = 'APPROVED'::text) OR (submitter_id = (select auth.uid()))));
alter policy "submitters can update pending education resources" on public.education_resources using (((submitter_id = (select auth.uid())) AND (status = ANY (ARRAY['DRAFT'::text, 'PENDING_REVIEW'::text])))) with check (((submitter_id = (select auth.uid())) AND (status = ANY (ARRAY['DRAFT'::text, 'PENDING_REVIEW'::text]))));
alter policy "authenticated users can submit moderation items" on public.moderation_queue with check ((((select auth.uid()) IS NOT NULL) AND ((reported_by IS NULL) OR (reported_by = (select auth.uid())))));
alter policy "nda_self_insert" on public.nda_signatures with check ((moderator_user_id = (select auth.uid())));
alter policy "nda_self_read" on public.nda_signatures using ((moderator_user_id = (select auth.uid())));
alter policy "nda_self_update" on public.nda_signatures using ((moderator_user_id = (select auth.uid()))) with check ((moderator_user_id = (select auth.uid())));

-- Live current_platform_role returns text; category helpers require app_role.
CREATE OR REPLACE FUNCTION public.current_role_category()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select public.role_category(public.current_platform_role()::public.app_role);
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
