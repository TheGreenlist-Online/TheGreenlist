-- Write notifications when a report's status changes and when a business claim
-- is approved or denied.
--
-- These live in the database rather than in application code on purpose. Report
-- status is changed from more than one place (admin API routes, the service
-- role client, and direct SQL during operations), and a notification that only
-- fires from one of those paths is worse than none at all — people learn to not
-- trust it. A trigger fires for every path.
--
-- The functions are SECURITY DEFINER because `notifications_insert` restricts
-- authenticated users to inserting rows for themselves (profile_id = auth.uid()).
-- Notifying somebody else is exactly what we need to do here, so the insert has
-- to run as the table owner.

-- Turn 'pending_review' / 'PENDING_REVIEW' into 'pending review'.
create or replace function public.humanize_status(value text)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select nullif(btrim(lower(replace(coalesce(value, ''), '_', ' '))), '')
$$;

comment on function public.humanize_status(text) is
  'Formats a status token for display in notification copy.';


create or replace function public.notify_report_status_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_status_changed boolean;
  v_verification_changed boolean;
  v_title text;
  v_body text;
  v_new text;
  v_old text;
begin
  -- Anonymous reports still notify their author. Anonymity governs what the
  -- public sees, not whether the reporter hears back about their own report.
  if new.reporter_id is null then
    return new;
  end if;

  v_status_changed := new.status is distinct from old.status;
  v_verification_changed := new.verification_status is distinct from old.verification_status;

  if not (v_status_changed or v_verification_changed) then
    return new;
  end if;

  if v_status_changed then
    v_new := public.humanize_status(new.status);
    v_old := public.humanize_status(old.status);

    if v_new is null then
      return new;
    end if;

    v_title := 'Your report is now ' || v_new;
    v_body := case
      when v_old is null then 'Status set to ' || v_new || '.'
      else 'Status changed from ' || v_old || ' to ' || v_new || '.'
    end;
    v_body := v_body || ' Report: "' || coalesce(new.title, 'Untitled report') || '".';
  else
    v_new := public.humanize_status(new.verification_status);

    if v_new is null then
      return new;
    end if;

    v_title := 'Verification updated to ' || v_new;
    v_body := 'The verification state of "' || coalesce(new.title, 'Untitled report')
      || '" is now ' || v_new || '.';
  end if;

  insert into public.notifications (profile_id, type, title, body, link_url)
  values (
    new.reporter_id,
    case when v_status_changed then 'report_status' else 'report_verification' end,
    v_title,
    v_body,
    '/reports/' || new.id::text
  );

  return new;
end;
$$;

comment on function public.notify_report_status_change() is
  'Notifies a reporter when their report changes status or verification state.';

drop trigger if exists trg_reports_notify_status_change on public.reports;

create trigger trg_reports_notify_status_change
  after update of status, verification_status on public.reports
  for each row
  execute function public.notify_report_status_change();


create or replace function public.notify_business_claim_decision()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new text;
  v_title text;
  v_body text;
  v_type text;
begin
  if new.owner_id is null then
    return new;
  end if;

  if new.verification_status is not distinct from old.verification_status then
    return new;
  end if;

  v_new := public.humanize_status(new.verification_status);

  if v_new is null then
    return new;
  end if;

  if v_new = 'verified' then
    v_type := 'claim_approved';
    v_title := new.name || ' is verified';
    v_body := 'Your claim was approved. You can now manage this profile and respond to reports about it.';
  elsif v_new = 'rejected' then
    v_type := 'claim_rejected';
    v_title := 'Claim on ' || new.name || ' was not approved';
    v_body := 'A reviewer could not confirm your authority over this business. '
      || 'Contact support if you can provide licence or registration details.';
  else
    v_type := 'claim_status';
    v_title := 'Claim on ' || new.name || ' is now ' || v_new;
    v_body := 'The verification state of this business profile changed to ' || v_new || '.';
  end if;

  insert into public.notifications (profile_id, type, title, body, link_url)
  values (new.owner_id, v_type, v_title, v_body, '/businesses/' || new.slug);

  return new;
end;
$$;

comment on function public.notify_business_claim_decision() is
  'Notifies a business owner when their claim is approved, denied, or otherwise changed.';

drop trigger if exists trg_business_profiles_notify_claim on public.business_profiles;

create trigger trg_business_profiles_notify_claim
  after update of verification_status on public.business_profiles
  for each row
  execute function public.notify_business_claim_decision();


-- The dashboard reads "my newest notifications" and "how many are unread".
create index if not exists notifications_profile_created_idx
  on public.notifications (profile_id, created_at desc);

create index if not exists notifications_profile_unread_idx
  on public.notifications (profile_id)
  where read_at is null;
