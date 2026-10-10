-- ---------------------------------------------------------------------------
-- Public-records ingestion pipeline (ported into the Green List repo).
--
-- Origin: this schema was applied by hand on 2026-09-14 to the Supabase
-- project "Blacklist" (hdqxilnjhcqalrgaykst) instead of the Green List
-- project. That project is left untouched. This migration recreates the same
-- objects under the repo's migration workflow so they land on the correct
-- project (production: idtnlninotxwqpznbwur) with the repo's privilege posture.
--
-- Semantics are unchanged: source feeds -> immutable raw versions ->
-- normalized searchable records -> detections -> human-reviewed editorial
-- drafts -> published view. Nothing here publishes automatically.
--
-- Differences from the hand-applied version (all deliberate):
--   * functions use set search_path = '' (repo convention)
--   * anon/authenticated lose ALL table privileges; narrow read policies for
--     reviewers; writes are service-role-only (admin client in the app)
--   * published_records is the only public read surface
--   * Supabase-managed objects (rls_auto_enable, storage/realtime triggers)
--     are not copied; the target project has its own.
-- ---------------------------------------------------------------------------

-- 1. Enums --------------------------------------------------------------------
do $$ begin
  create type public.record_status as enum ('new', 'changed', 'reviewed', 'ignored', 'published', 'error');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.review_status as enum ('pending', 'approved', 'rejected', 'needs_verification');
exception when duplicate_object then null; end $$;

-- 2. Helpers ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.retire_previous_source_record_version()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.is_current then
    update public.source_records
       set is_current = false
     where feed_id = new.feed_id
       and external_id = new.external_id
       and is_current = true;
  end if;
  return new;
end;
$$;

-- 3. Tables -------------------------------------------------------------------
create table if not exists public.source_feeds (
  id                    uuid primary key default gen_random_uuid(),
  slug                  text not null unique,
  name                  text not null,
  agency                text,
  jurisdiction          text,
  source_type           text not null check (source_type in ('api', 'rss', 'csv', 'json', 'html', 'pdf')),
  base_url              text not null,
  documentation_url     text,
  terms_url             text,
  poll_interval_minutes integer not null default 360 check (poll_interval_minutes >= 15),
  enabled               boolean not null default true,
  config                jsonb not null default '{}'::jsonb,
  cursor                jsonb not null default '{}'::jsonb,
  last_success_at       timestamptz,
  last_error_at         timestamptz,
  last_error            text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
comment on table public.source_feeds is
  'Approved official source/feed configurations used by The Greenlist ingestion pipeline.';

create table if not exists public.source_records (
  id                  uuid primary key default gen_random_uuid(),
  feed_id             uuid not null references public.source_feeds(id) on delete cascade,
  external_id         text not null,
  canonical_url       text not null,
  source_published_at timestamptz,
  source_updated_at   timestamptz,
  fetched_at          timestamptz not null default now(),
  title               text,
  content_text        text,
  raw_payload         jsonb not null,
  raw_hash            text not null,
  content_hash        text not null,
  is_current          boolean not null default true,
  first_seen_at       timestamptz not null default now(),
  last_seen_at        timestamptz not null default now()
);
comment on table public.source_records is
  'Immutable raw evidence versions retrieved from approved source feeds.';

create unique index if not exists source_records_one_current_version_idx
  on public.source_records (feed_id, external_id) where is_current = true;
create index if not exists source_records_version_lookup_idx
  on public.source_records (feed_id, external_id, content_hash);
create index if not exists source_records_current_feed_update_idx
  on public.source_records (feed_id, source_updated_at desc, fetched_at desc) where is_current = true;

create table if not exists public.normalized_records (
  id               uuid primary key default gen_random_uuid(),
  source_record_id uuid not null unique references public.source_records(id) on delete cascade,
  record_type      text not null,
  title            text not null,
  summary          text,
  body_text        text,
  jurisdiction     text,
  agency           text,
  event_date       timestamptz,
  status           text,
  topics           text[] not null default '{}'::text[],
  entities         jsonb not null default '[]'::jsonb,
  source_url       text not null,
  status_lifecycle public.record_status not null default 'new',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.normalized_records is
  'Searchable cross-source records linked one-to-one to a specific source evidence version.';

create index if not exists normalized_records_search_gin_idx
  on public.normalized_records using gin (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(body_text, '')));
create index if not exists normalized_records_topics_gin_idx
  on public.normalized_records using gin (topics);

create table if not exists public.watch_rules (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  enabled       boolean not null default true,
  jurisdictions text[] not null default '{}'::text[],
  agencies      text[] not null default '{}'::text[],
  record_types  text[] not null default '{}'::text[],
  keywords      text[] not null default '{}'::text[],
  priority      integer not null default 50 check (priority >= 1 and priority <= 100),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
comment on table public.watch_rules is
  'Editorially managed relevance rules used to identify records for review.';

create table if not exists public.detections (
  id                   uuid primary key default gen_random_uuid(),
  normalized_record_id uuid not null references public.normalized_records(id) on delete cascade,
  watch_rule_id        uuid references public.watch_rules(id) on delete set null,
  change_type          text not null check (change_type in ('created', 'updated', 'attachment_added', 'status_changed', 'manual')),
  match_excerpt        text,
  score                integer not null default 0,
  detected_at          timestamptz not null default now()
);
comment on table public.detections is
  'Explains why a normalized record entered the editorial review queue.';

create unique index if not exists detections_no_duplicates_idx
  on public.detections (normalized_record_id, coalesce(watch_rule_id, '00000000-0000-0000-0000-000000000000'::uuid), change_type);

create table if not exists public.editorial_drafts (
  id                uuid primary key default gen_random_uuid(),
  detection_id      uuid not null unique references public.detections(id) on delete cascade,
  headline          text,
  short_summary     text,
  caption_draft     text,
  visual_brief      text,
  claims            jsonb not null default '[]'::jsonb,
  source_citations  jsonb not null default '[]'::jsonb,
  ai_model          text,
  ai_prompt_version text,
  disclosure_text   text,
  review_status     public.review_status not null default 'pending',
  reviewed_by       uuid references public.profiles(id) on delete set null,
  reviewed_at       timestamptz,
  reviewer_notes    text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
comment on table public.editorial_drafts is
  'AI-assisted editorial drafts that require human review and retain source citations.';

create table if not exists public.ingestion_runs (
  id              uuid primary key default gen_random_uuid(),
  feed_id         uuid references public.source_feeds(id) on delete set null,
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  status          text not null check (status in ('running', 'success', 'partial', 'failed')),
  records_fetched integer not null default 0,
  records_created integer not null default 0,
  records_changed integer not null default 0,
  error_message   text,
  metadata        jsonb not null default '{}'::jsonb
);
comment on table public.ingestion_runs is
  'Operational log for each source retrieval and normalization run.';

create table if not exists public.audit_log (
  id          uuid primary key default gen_random_uuid(),
  actor_type  text not null check (actor_type in ('system', 'editor', 'workflow')),
  actor_id    text,
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
comment on table public.audit_log is
  'Append-oriented audit trail for system, workflow, and editorial actions.';

-- 4. Triggers -----------------------------------------------------------------
drop trigger if exists source_feeds_set_updated_at on public.source_feeds;
create trigger source_feeds_set_updated_at
  before update on public.source_feeds for each row execute function public.set_updated_at();

drop trigger if exists normalized_records_set_updated_at on public.normalized_records;
create trigger normalized_records_set_updated_at
  before update on public.normalized_records for each row execute function public.set_updated_at();

drop trigger if exists watch_rules_set_updated_at on public.watch_rules;
create trigger watch_rules_set_updated_at
  before update on public.watch_rules for each row execute function public.set_updated_at();

drop trigger if exists editorial_drafts_set_updated_at on public.editorial_drafts;
create trigger editorial_drafts_set_updated_at
  before update on public.editorial_drafts for each row execute function public.set_updated_at();

drop trigger if exists source_records_retire_previous_version on public.source_records;
create trigger source_records_retire_previous_version
  before insert on public.source_records for each row execute function public.retire_previous_source_record_version();

-- 5. Public read surface --------------------------------------------------------
-- Approved, non-sensitive editorial metadata only. Excludes raw payloads,
-- reviewer notes, ingestion errors, watch rules, and audit metadata.
create or replace view public.published_records as
  select nr.id            as normalized_record_id,
         d.id             as detection_id,
         nr.record_type,
         nr.title         as source_title,
         nr.summary       as source_summary,
         nr.jurisdiction,
         nr.agency,
         nr.event_date,
         nr.status,
         nr.topics,
         nr.entities,
         nr.source_url,
         ed.headline,
         ed.short_summary,
         ed.caption_draft,
         ed.visual_brief,
         ed.disclosure_text,
         ed.reviewed_at
    from public.normalized_records nr
    join public.detections d        on d.normalized_record_id = nr.id
    join public.editorial_drafts ed on ed.detection_id = d.id
   where ed.review_status = 'approved';

comment on view public.published_records is
  'Non-sensitive editorial metadata approved for publication; excludes raw payloads, reviewer notes, ingestion errors, watch rules, and audit metadata.';

-- 6. RLS and privileges (repo lock-down posture) --------------------------------
alter table public.source_feeds       enable row level security;
alter table public.source_records     enable row level security;
alter table public.normalized_records enable row level security;
alter table public.watch_rules        enable row level security;
alter table public.detections         enable row level security;
alter table public.editorial_drafts   enable row level security;
alter table public.ingestion_runs     enable row level security;
alter table public.audit_log          enable row level security;

revoke all on
  public.source_feeds, public.source_records, public.normalized_records,
  public.watch_rules, public.detections, public.editorial_drafts,
  public.ingestion_runs, public.audit_log
from anon, authenticated;

-- Reviewers can read the pipeline; nobody but the service role writes to it.
grant select on
  public.source_feeds, public.source_records, public.normalized_records,
  public.watch_rules, public.detections, public.editorial_drafts,
  public.ingestion_runs, public.audit_log
to authenticated;

-- Editors (reviewer roles) may decide drafts; that is the one human write path.
grant update (review_status, reviewed_by, reviewed_at, reviewer_notes) on public.editorial_drafts to authenticated;

drop policy if exists source_feeds_reviewer_read on public.source_feeds;
create policy source_feeds_reviewer_read on public.source_feeds
  for select to authenticated using (public.is_reviewer());

drop policy if exists source_records_reviewer_read on public.source_records;
create policy source_records_reviewer_read on public.source_records
  for select to authenticated using (public.is_reviewer());

drop policy if exists normalized_records_reviewer_read on public.normalized_records;
create policy normalized_records_reviewer_read on public.normalized_records
  for select to authenticated using (public.is_reviewer());

drop policy if exists watch_rules_reviewer_read on public.watch_rules;
create policy watch_rules_reviewer_read on public.watch_rules
  for select to authenticated using (public.is_reviewer());

drop policy if exists detections_reviewer_read on public.detections;
create policy detections_reviewer_read on public.detections
  for select to authenticated using (public.is_reviewer());

drop policy if exists editorial_drafts_reviewer_read on public.editorial_drafts;
create policy editorial_drafts_reviewer_read on public.editorial_drafts
  for select to authenticated using (public.is_reviewer());

drop policy if exists editorial_drafts_reviewer_decide on public.editorial_drafts;
create policy editorial_drafts_reviewer_decide on public.editorial_drafts
  for update to authenticated
  using (public.is_reviewer())
  with check (public.is_reviewer() and reviewed_by = (select auth.uid()));

drop policy if exists ingestion_runs_reviewer_read on public.ingestion_runs;
create policy ingestion_runs_reviewer_read on public.ingestion_runs
  for select to authenticated using (public.is_reviewer());

drop policy if exists audit_log_reviewer_read on public.audit_log;
create policy audit_log_reviewer_read on public.audit_log
  for select to authenticated using (public.is_reviewer());

-- The view is owned by the migration role and exposes only approved columns,
-- so it is the single surface anonymous readers get.
grant select on public.published_records to anon, authenticated;
