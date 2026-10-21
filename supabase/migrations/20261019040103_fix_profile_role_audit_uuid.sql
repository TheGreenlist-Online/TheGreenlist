-- Preserve the production role-assignment guard; audit_logs.entity_id is UUID.
-- The old NEW.id::text expression aborted legitimate owner-authorized changes.
create or replace function private.protect_profile_authority()
returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.id <> old.id then raise exception 'Profile identity cannot be changed'; end if;
 if new.role is distinct from old.role and not private.is_platform_owner(auth.uid()) then
  raise exception 'Only the platform owner can assign roles';
 end if;
 if private.is_platform_owner(old.id) and new.role is distinct from 'ADMIN' then
  raise exception 'The platform owner must retain the ADMIN role';
 end if;
 if new.role is distinct from old.role then
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,metadata)
  values(auth.uid(),'ROLE_ASSIGNED_BY_PLATFORM_OWNER','profile',new.id,
   jsonb_build_object('from',old.role,'to',new.role,'human_review_required',true));
 end if;
 return new;
end $$;
