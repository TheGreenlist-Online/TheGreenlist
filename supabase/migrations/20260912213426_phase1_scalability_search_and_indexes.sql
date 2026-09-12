-- Phase 1 scalability foundation for The Green List.
-- Additive changes only: indexes, generated search vectors, a SECURITY INVOKER search RPC,
-- and owner-scoped draft policies.

create index if not exists business_documents_uploaded_by_idx on public.business_documents (uploaded_by);
create index if not exists business_profiles_owner_idx on public.business_profiles (owner_id);
create index if not exists evidence_files_post_idx on public.evidence_files (post_id);
create index if not exists evidence_files_thread_idx on public.evidence_files (thread_id);
create index if not exists forum_posts_parent_post_idx on public.forum_posts (parent_post_id);
create index if not exists moderation_queue_assigned_to_idx on public.moderation_queue (assigned_to);
create index if not exists moderation_queue_reported_by_idx on public.moderation_queue (reported_by);
create index if not exists moderation_queue_items_assigned_to_idx on public.moderation_queue_items (assigned_to);
create index if not exists moderation_queue_items_batch_idx on public.moderation_queue_items (batch_id);
create index if not exists moderation_queue_items_report_idx on public.moderation_queue_items (report_id);
create index if not exists moderation_queue_items_reported_by_idx on public.moderation_queue_items (reported_by);
create index if not exists nda_signatures_batch_idx on public.nda_signatures (batch_id);
create index if not exists nda_signatures_queue_item_idx on public.nda_signatures (queue_item_id);
create index if not exists nda_signatures_report_idx on public.nda_signatures (report_id);
create index if not exists reports_forum_thread_idx on public.reports (forum_thread_id);
create index if not exists support_tickets_assigned_to_idx on public.support_tickets (assigned_to);
create index if not exists user_moderation_actions_reversed_by_idx on public.user_moderation_actions (reversed_by);
create index if not exists verified_facts_verified_by_idx on public.verified_facts (verified_by);

create index if not exists business_profiles_directory_idx
  on public.business_profiles (state, business_type, created_at desc)
  where is_active = true;
create index if not exists forums_directory_idx
  on public.forums (category, name)
  where is_active = true;
create index if not exists news_category_published_idx
  on public.news (category, published_at desc);

alter table public.business_profiles
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(business_type, '') || ' ' || coalesce(city, '') || ' ' || coalesce(state, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored;

alter table public.forum_threads
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(body, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(ai_summary, '')), 'C')
  ) stored;

alter table public.news
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '') || ' ' || coalesce(source_name, '') || ' ' || coalesce(category, '')), 'C')
  ) stored;

alter table public.education_resources
  add column if not exists search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '') || ' ' || coalesce(category, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'C')
  ) stored;

create index if not exists business_profiles_search_idx on public.business_profiles using gin (search_vector);
create index if not exists forum_threads_search_idx on public.forum_threads using gin (search_vector);
create index if not exists news_search_idx on public.news using gin (search_vector);
create index if not exists education_resources_search_idx on public.education_resources using gin (search_vector);

create or replace function public.search_public_content(
  search_text text,
  result_limit integer default 20,
  result_offset integer default 0
)
returns table (
  entity_type text,
  entity_id uuid,
  title text,
  summary text,
  href text,
  published_at timestamptz,
  rank real
)
language sql
stable
security invoker
set search_path = ''
as $$
  with input as (
    select websearch_to_tsquery('english', trim(search_text)) as query
    where length(trim(search_text)) >= 2
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
           '/news/' || n.id::text, coalesce(n.published_at, n.created_at),
           ts_rank_cd(n.search_vector, i.query)
    from public.news n cross join input i
    where n.search_vector @@ i.query
    union all
    select 'education', e.id, e.title, e.summary,
           '/help/resources/' || e.id::text, e.created_at,
           ts_rank_cd(e.search_vector, i.query)
    from public.education_resources e cross join input i
    where e.status = 'APPROVED' and e.search_vector @@ i.query
  )
  select *
  from matches
  order by rank desc, published_at desc, entity_id
  limit least(greatest(result_limit, 1), 50)
  offset greatest(result_offset, 0);
$$;

revoke all on function public.search_public_content(text, integer, integer) from public;
grant execute on function public.search_public_content(text, integer, integer) to anon, authenticated;

drop policy if exists drafts_owner_select on public.drafts;
create policy drafts_owner_select on public.drafts for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists drafts_owner_insert on public.drafts;
create policy drafts_owner_insert on public.drafts for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists drafts_owner_update on public.drafts;
create policy drafts_owner_update on public.drafts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists drafts_owner_delete on public.drafts;
create policy drafts_owner_delete on public.drafts for delete to authenticated
using ((select auth.uid()) = user_id);

comment on function public.search_public_content(text, integer, integer) is
  'Ranked public content search. SECURITY INVOKER preserves table RLS; hard-capped at 50 rows.';