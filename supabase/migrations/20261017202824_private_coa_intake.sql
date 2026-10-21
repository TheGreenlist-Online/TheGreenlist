-- Phase 1: one neutral submission and one immutable original PDF.
-- No canonical product/batch, analytical values, extraction, or public projection.
create table public.coa_reports (
  id uuid primary key,
  owner_id uuid not null references auth.users(id),
  product_name_reported text check (char_length(product_name_reported) <= 160),
  batch_identifier_reported text check (char_length(batch_identifier_reported) <= 160),
  storage_bucket text not null default 'coa-sources' check (storage_bucket = 'coa-sources'),
  storage_path text not null unique,
  source_sha256 text not null check (source_sha256 ~ '^[a-f0-9]{64}$'),
  file_size integer not null check (file_size between 1 and 3145728),
  intake_status text not null default 'upload_pending' check (intake_status in ('upload_pending', 'submitted', 'upload_failed')),
  extraction_status text not null default 'not_started' check (extraction_status = 'not_started'),
  human_review_status text not null default 'not_reviewed' check (human_review_status = 'not_reviewed'),
  authenticity_status text not null default 'unverified' check (authenticity_status = 'unverified'),
  publication_status text not null default 'private' check (publication_status = 'private'),
  created_at timestamptz not null default now(),
  received_at timestamptz,
  constraint coa_source_identity check (storage_path = owner_id::text || '/' || id::text || '/original.pdf'),
  constraint coa_received_state check ((intake_status = 'submitted') = (received_at is not null))
);
create index coa_reports_owner_created on public.coa_reports(owner_id, created_at desc);
alter table public.coa_reports enable row level security;
revoke all on public.coa_reports from public, anon, authenticated;
grant select on public.coa_reports to authenticated;
grant select, insert, update, delete on public.coa_reports to service_role;
create policy coa_owner_read on public.coa_reports for select to authenticated
using (owner_id = (select auth.uid()) and coalesce((select auth.jwt())->>'is_anonymous', 'false') = 'false');

-- Count reservations as attempts, including failed/interrupted uploads. Serialize
-- requests for the same owner so parallel inserts cannot bypass the quota.
create or replace function private.guard_coa_intake() returns trigger
language plpgsql security invoker set search_path = '' as $$
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
$$;
revoke all on function private.guard_coa_intake() from public, anon, authenticated;
create trigger guard_coa_intake before insert or update on public.coa_reports
for each row execute function private.guard_coa_intake();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('coa-sources', 'coa-sources', false, 3145728, array['application/pdf']);
-- Server-only Storage writes/reads: bounded byte validation and receipt lookup
-- happen before service access. Restrictive policies also block unrelated broad
-- permissive policies. No client upload, overwrite, delete or signed URL access.
create policy coa_sources_server_only on storage.objects as restrictive for all to anon, authenticated
using (bucket_id <> 'coa-sources') with check (bucket_id <> 'coa-sources');
create policy coa_bucket_server_only on storage.buckets as restrictive for all to anon, authenticated
using (id <> 'coa-sources') with check (id <> 'coa-sources');
