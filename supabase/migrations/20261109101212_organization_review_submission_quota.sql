-- The shared helper is introduced after the organization foundation migration.
-- Attach here so both fresh installs and existing migration histories get the
-- database-enforced per-account cap. Direct REST inserts cannot bypass it.
create trigger client_write_quota
before insert on public.organization_verification_requests
for each row execute function private.enforce_client_write_quota('10');
