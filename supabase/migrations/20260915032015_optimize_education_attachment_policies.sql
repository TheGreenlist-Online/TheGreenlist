create index if not exists education_attachments_uploader_idx
  on public.education_attachments(uploader_id);

drop policy if exists education_attachments_public_read on public.education_attachments;
drop policy if exists education_attachments_owner_read on public.education_attachments;
drop policy if exists education_attachments_staff_read on public.education_attachments;

create policy education_attachments_public_read on public.education_attachments
for select to anon using (
  exists (
    select 1 from public.education_resources er
    where er.id = resource_id and er.status = 'APPROVED'
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

drop policy if exists education_materials_read on storage.objects;
drop policy if exists education_materials_public_read on storage.objects;

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
