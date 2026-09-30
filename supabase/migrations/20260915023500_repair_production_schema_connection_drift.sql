-- Keep the repository migration history aligned with the production repairs made
-- after Vercel was pointed at the canonical TheGreenlist Supabase project.

alter table public.nda_signatures
  add column if not exists document_version text not null default 'v1';

alter table public.nda_signatures
  alter column document_version set default 'v1';

comment on column public.nda_signatures.document_version is
  'Version identifier of the NDA document accepted by the signer.';

alter table public.business_profiles
  alter column owner_id set default auth.uid();

comment on column public.business_profiles.owner_id is
  'Owning user. Defaults to the authenticated user for client-created records; may remain null for privileged imports.';

alter view public.user_roles set (security_invoker = true);
