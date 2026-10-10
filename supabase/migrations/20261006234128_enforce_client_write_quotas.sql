-- One counter per account/table/operation, not one row per request or hour.
create table private.client_write_buckets (
 user_id uuid not null references auth.users(id) on delete cascade,
 action text not null,
 window_start timestamptz not null,
 used integer not null check(used>0),
 primary key(user_id,action)
);
alter table private.client_write_buckets enable row level security;
revoke all on private.client_write_buckets from public,anon,authenticated;
create or replace function private.enforce_client_write_quota()
returns trigger language plpgsql security definer set search_path='' as $$
declare caller_role text := current_setting('role',true); actor uuid := auth.uid();
 bucket timestamptz := date_trunc('hour',statement_timestamp(),'UTC'); used_count integer;
 cap integer := tg_argv[0]::integer;
begin
 -- SET ROLE remains the caller's selected DB role inside SECURITY DEFINER.
 if (caller_role in ('service_role','postgres','supabase_admin') or (caller_role='none' and session_user in ('postgres','supabase_admin'))) then return new; end if;
 if actor is null then raise exception using errcode='42501',message='A signed-in account is required'; end if;
 insert into private.client_write_buckets as b(user_id,action,window_start,used)
 values(actor,tg_table_name||':'||tg_op,bucket,1)
 on conflict(user_id,action) do update set
 used=case when b.window_start=excluded.window_start then b.used+1 else 1 end,
 window_start=excluded.window_start
 returning used into used_count;
 if used_count>cap then raise sqlstate 'PT429' using message='Hourly write quota exceeded; retry in the next hour'; end if;
 return new;
end $$;
revoke all on function private.enforce_client_write_quota() from public,anon,authenticated;
create trigger client_write_quota before insert on public.reports for each row execute function private.enforce_client_write_quota('10');
create trigger client_write_quota before insert on public.forum_threads for each row execute function private.enforce_client_write_quota('20');
create trigger client_write_quota before insert on public.forum_posts for each row execute function private.enforce_client_write_quota('120');
create trigger client_write_quota before insert on public.business_documents for each row execute function private.enforce_client_write_quota('20');
create trigger client_write_quota before insert on public.education_resources for each row execute function private.enforce_client_write_quota('20');
create trigger client_write_quota before insert on public.support_tickets for each row execute function private.enforce_client_write_quota('10');
-- Failed transactions do not count. Read floods, AI spend, updates, drafts,
-- Storage and Realtime require separate controls; this is an INSERT quota.
