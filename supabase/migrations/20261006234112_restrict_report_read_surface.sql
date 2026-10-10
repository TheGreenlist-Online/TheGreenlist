-- Raw report rows are private even after a finding is published.
drop policy if exists reports_public_read on public.reports;
drop policy if exists reports_auth_read on public.reports;
create policy reports_auth_read on public.reports for select to authenticated
using (reporter_id = (select auth.uid()));
-- reports_moderator_read keeps the existing reviewer/NDA scope.
revoke select on public.reports from anon, authenticated;
do $$
declare cols text;
begin
 select string_agg(quote_ident(attname), ', ') into cols from pg_attribute
 where attrelid='public.reports'::regclass and attnum>0 and not attisdropped;
 execute 'revoke select ('||cols||') on public.reports from anon, authenticated';
 select string_agg(quote_ident(attname), ', ') into cols from pg_attribute
 where attrelid='public.reports'::regclass and attnum>0 and not attisdropped and attname <> 'admin_notes';
 execute 'grant select ('||cols||') on public.reports to authenticated';
end $$;
-- Deliberate narrow privileged read: no raw description, author identity or notes.
-- Publication requires human review of public_summary for identifying content.
create or replace function public.read_public_report_findings(result_limit integer default 20, result_offset integer default 0)
returns table(id uuid,business_id uuid,report_type text,status text,verification_status text,public_summary text,created_at timestamptz,updated_at timestamptz)
language sql stable security definer set search_path='' as $$
 select r.id,r.business_id,r.report_type,r.status,r.verification_status,r.public_summary,r.created_at,r.updated_at
 from public.reports r
 where r.status in ('published', 'corrected') and nullif(btrim(r.public_summary),'') is not null
 order by r.created_at desc,r.id
 limit least(greatest(coalesce(result_limit,20),1),50)
 offset least(greatest(coalesce(result_offset,0),0),1000);
$$;
revoke all on function public.read_public_report_findings(integer,integer) from public;
grant execute on function public.read_public_report_findings(integer,integer) to anon,authenticated,service_role;
