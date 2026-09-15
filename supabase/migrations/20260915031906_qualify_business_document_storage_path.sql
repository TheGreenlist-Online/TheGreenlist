-- Qualify the Storage object path so the nested business lookup cannot bind
-- `name` to business_profiles.name.

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
