-- Pre-deployment SQL for WeekFlow Brain cloud. Not applied by code release.
-- One atomic quota claim per verified Firebase UID hash, max 12 calls per UTC day.
-- An additional global ceiling of 120 total requests/day limits multi-account abuse.
-- Service role only; no direct access for public API users.
create table if not exists public.weekflow_brain_daily_quota (
  user_hash text not null check (length(user_hash) = 64),
  day_utc date not null,
  request_count integer not null default 0 check (request_count between 0 and 120),
  primary key (user_hash, day_utc)
);
alter table public.weekflow_brain_daily_quota enable row level security;
revoke all on public.weekflow_brain_daily_quota from public, anon, authenticated;
grant select, insert, update on public.weekflow_brain_daily_quota to service_role;

create or replace function public.claim_weekflow_brain_slot(p_user_hash text)
returns boolean language plpgsql security invoker
set search_path = ''
as $$
declare claimed boolean;
declare globally_allowed boolean;
begin
  if p_user_hash is null or length(p_user_hash) <> 64 or p_user_hash !~ '^[a-f0-9]{64}$' then
    return false;
  end if;
  -- Global row is a reserved 64-zero hash. All requests must claim it first.
  insert into public.weekflow_brain_daily_quota (user_hash, day_utc, request_count)
  values (repeat('0',64), (now() at time zone 'utc')::date, 1)
  on conflict (user_hash, day_utc) do update
    set request_count = public.weekflow_brain_daily_quota.request_count + 1
    where public.weekflow_brain_daily_quota.request_count < 120
  returning true into globally_allowed;
  if not coalesce(globally_allowed, false) then return false; end if;

  insert into public.weekflow_brain_daily_quota (user_hash, day_utc, request_count)
  values (p_user_hash, (now() at time zone 'utc')::date, 1)
  on conflict (user_hash, day_utc) do update
    set request_count = public.weekflow_brain_daily_quota.request_count + 1
    where public.weekflow_brain_daily_quota.request_count < 12
  returning true into claimed;
  return coalesce(claimed, false);
end;
$$;
revoke all on function public.claim_weekflow_brain_slot(text) from public, anon, authenticated;
grant execute on function public.claim_weekflow_brain_slot(text) to service_role;
