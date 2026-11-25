-- Apply only to the WeekFlow project, not Architecture-360.
-- Persistent global cooldown for the single explicitly allowlisted tester.
begin;
create table if not exists public.weekflow_push_test_throttle (
  id integer primary key check (id = 1),
  last_claim timestamptz not null
);
alter table public.weekflow_push_test_throttle enable row level security;
revoke all on table public.weekflow_push_test_throttle from public, anon, authenticated;
grant select, insert, update on table public.weekflow_push_test_throttle to service_role;
create or replace function public.claim_weekflow_push_test()
returns boolean language plpgsql security invoker set search_path = ''
as $$
declare claimed integer;
begin
  insert into public.weekflow_push_test_throttle (id, last_claim)
  values (1, clock_timestamp())
  on conflict (id) do update set last_claim = excluded.last_claim
    where public.weekflow_push_test_throttle.last_claim <= excluded.last_claim - interval '90 seconds';
  get diagnostics claimed = row_count;
  return claimed = 1;
end;
$$;
revoke all on function public.claim_weekflow_push_test() from public, anon, authenticated;
grant execute on function public.claim_weekflow_push_test() to service_role;
commit;
