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
  limit least(greatest(result_limit, 1), 50)
  offset greatest(result_offset, 0);
$$;

revoke all on function public.search_public_content(text, integer, integer) from public;
grant execute on function public.search_public_content(text, integer, integer) to anon, authenticated;