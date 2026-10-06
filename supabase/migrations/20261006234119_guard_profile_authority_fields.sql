-- Preserve the existing owner-only role-assignment and audit trigger.
create or replace function private.guard_profile_review_fields()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if current_user in ('service_role','postgres','supabase_admin') or public.is_platform_owner() then return new; end if;
 if new.verification_status is distinct from old.verification_status
  or new.trust_score is distinct from old.trust_score
  or new.transparency_score is distinct from old.transparency_score
  or new.account_status is distinct from old.account_status
  or new.status_reason is distinct from old.status_reason
  or new.status_until is distinct from old.status_until
  or new.last_moderated_at is distinct from old.last_moderated_at
  or new.created_at is distinct from old.created_at then
  raise exception using errcode='42501',message='Profile review and enforcement fields require authorized administration';
 end if;
 return new;
end $$;
revoke all on function private.guard_profile_review_fields() from public,anon,authenticated;
create trigger guard_profile_review_fields before update on public.profiles
for each row execute function private.guard_profile_review_fields();
