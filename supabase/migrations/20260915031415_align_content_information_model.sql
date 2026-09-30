-- Align forums, reports, business references, and educational attachments.

insert into public.forums
  (slug, name, description, category, accent_color, is_active, is_sensitive, requires_auth)
values
  ('general-discussion', 'General Discussion', 'Open community discussion about cannabis transparency and accountability.', 'COMMUNITY', '#a3d93b', true, false, false),
  ('consumer-safety', 'Consumer Safety', 'Product safety, labeling, testing, contamination, and consumer-protection discussions.', 'SAFETY', '#38bdf8', true, false, false),
  ('business-accountability', 'Business Accountability', 'Business practices, licensing, transparency, and public accountability.', 'ACCOUNTABILITY', '#f59e0b', true, false, false),
  ('worker-rights', 'Worker Rights', 'Workplace safety, labor rights, fair practices, and reporting channels.', 'WORKPLACE', '#a855f7', true, false, false),
  ('policy-regulation', 'Policy & Regulation', 'Regulatory changes, public policy, compliance, and agency guidance.', 'POLICY', '#22c55e', true, false, false),
  ('site-help-feedback', 'Site Help & Feedback', 'Questions and feedback about The Green List platform.', 'PLATFORM', '#94a3b8', true, false, false)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  accent_color = excluded.accent_color,
  is_active = excluded.is_active,
  is_sensitive = excluded.is_sensitive,
  requires_auth = excluded.requires_auth;

update public.reports set report_type = 'contamination' where report_type = 'product_safety';
update public.reports set report_type = 'deceptive_marketing' where report_type = 'business_conduct';
update public.reports set report_type = 'licensing' where report_type = 'compliance_concern';
update public.reports set report_type = 'other' where report_type in ('consumer_concern', 'platform_issue');

alter table public.reports drop constraint if exists reports_report_type_check;
alter table public.reports add constraint reports_report_type_check check (
  report_type in ('mislabeling', 'contamination', 'licensing', 'worker_safety', 'deceptive_marketing', 'other')
);

alter table public.reports add column if not exists business_name_reported text;
alter table public.reports drop constraint if exists reports_business_name_reported_length_check;
alter table public.reports add constraint reports_business_name_reported_length_check
  check (business_name_reported is null or char_length(btrim(business_name_reported)) between 1 and 160);
alter table public.reports drop constraint if exists reports_business_reference_check;
alter table public.reports add constraint reports_business_reference_check
  check (business_id is null or business_name_reported is null);

update storage.buckets
set file_size_limit = 15728640,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png','image/webp']
where id = 'business-documents';

drop policy if exists business_documents_storage_owner_upload on storage.objects;
create policy business_documents_storage_owner_upload on storage.objects
for insert to authenticated
with check (
  bucket_id = 'business-documents'
  and exists (
    select 1 from public.business_profiles bp
    where bp.id::text = (storage.foldername(storage.objects.name))[1]
      and bp.owner_id = (select auth.uid())
  )
);

drop policy if exists business_documents_storage_read_own_or_staff on storage.objects;
create policy business_documents_storage_read_own_or_staff on storage.objects
for select to authenticated using (
  bucket_id = 'business-documents'
  and (
    private.is_platform_staff()
    or exists (
      select 1 from public.business_profiles bp
      where bp.id::text = (storage.foldername(storage.objects.name))[1]
        and bp.owner_id = (select auth.uid())
    )
  )
);

drop policy if exists business_documents_storage_delete_own_or_staff on storage.objects;
create policy business_documents_storage_delete_own_or_staff on storage.objects
for delete to authenticated using (
  bucket_id = 'business-documents'
  and (
    private.is_platform_staff()
    or exists (
      select 1 from public.business_profiles bp
      where bp.id::text = (storage.foldername(storage.objects.name))[1]
        and bp.owner_id = (select auth.uid())
    )
  )
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'education-materials', 'education-materials', false, 15728640,
  array['application/pdf','image/jpeg','image/png','image/webp','text/plain']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.education_attachments (
  id uuid primary key default gen_random_uuid(),
  resource_id uuid not null references public.education_resources(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  storage_bucket text not null default 'education-materials' check (storage_bucket = 'education-materials'),
  storage_path text not null unique,
  file_name text not null check (char_length(file_name) between 1 and 255),
  file_type text not null check (file_type in ('application/pdf','image/jpeg','image/png','image/webp','text/plain')),
  file_size integer not null check (file_size > 0 and file_size <= 15728640),
  created_at timestamptz not null default now()
);

create index if not exists education_attachments_resource_idx on public.education_attachments(resource_id);
create index if not exists education_attachments_uploader_idx on public.education_attachments(uploader_id);
alter table public.education_attachments enable row level security;
revoke all on public.education_attachments from anon, authenticated;
grant select, insert, delete on public.education_attachments to authenticated;
grant select on public.education_attachments to anon;

create policy education_attachments_public_read on public.education_attachments
for select to anon using (
  exists (
    select 1 from public.education_resources er
    where er.id = resource_id
      and er.status = 'APPROVED'
  )
);

create policy education_attachments_authenticated_read on public.education_attachments
for select to authenticated using (
  uploader_id = (select auth.uid())
  or private.is_platform_staff()
  or exists (
    select 1 from public.education_resources er
    where er.id = resource_id and er.status = 'APPROVED'
  )
);

create policy education_attachments_insert on public.education_attachments
for insert to authenticated with check (
  uploader_id = (select auth.uid())
  and storage_bucket = 'education-materials'
  and (storage.foldername(storage_path))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.education_resources er
    where er.id = resource_id
      and er.submitter_id = (select auth.uid())
      and er.status in ('DRAFT','PENDING_REVIEW')
      and (storage.foldername(storage_path))[2] = er.id::text
  )
);

create policy education_attachments_delete on public.education_attachments
for delete to authenticated using (
  uploader_id = (select auth.uid()) or private.is_platform_staff()
);

create policy education_materials_upload on storage.objects
for insert to authenticated with check (
  bucket_id = 'education-materials'
  and (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
  and exists (
    select 1 from public.education_resources er
    where er.id::text = (storage.foldername(storage.objects.name))[2]
      and er.submitter_id = (select auth.uid())
      and er.status in ('DRAFT','PENDING_REVIEW')
  )
);

create policy education_materials_read on storage.objects
for select to authenticated using (
  bucket_id = 'education-materials'
  and (
    (storage.foldername(storage.objects.name))[1] = (select auth.uid())::text
    or private.is_platform_staff()
    or exists (
      select 1
      from public.education_attachments ea
      join public.education_resources er on er.id = ea.resource_id
      where ea.storage_path = storage.objects.name and er.status = 'APPROVED'
    )
  )
);

create policy education_materials_public_read on storage.objects
for select to anon using (
  bucket_id = 'education-materials'
  and exists (
    select 1
    from public.education_attachments ea
    join public.education_resources er on er.id = ea.resource_id
    where ea.storage_path = storage.objects.name and er.status = 'APPROVED'
  )
);

create policy education_materials_delete on storage.objects
for delete to authenticated using (
  bucket_id = 'education-materials'
  and ((storage.foldername(storage.objects.name))[1] = (select auth.uid())::text or private.is_platform_staff())
);
