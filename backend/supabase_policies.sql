-- Run this in Supabase → SQL Editor → New query → Run
-- Fixes "Failed to fetch yaks" when RLS is enabled but no policies exist.
-- Your FastAPI backend uses the anon key; PostgREST acts as role "anon".

-- ----- yaks -----
alter table public.yaks enable row level security;

drop policy if exists "Allow anon read yaks" on public.yaks;
create policy "Allow anon read yaks"
  on public.yaks
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert yaks" on public.yaks;
create policy "Allow anon insert yaks"
  on public.yaks
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Allow anon update yaks votes" on public.yaks;
create policy "Allow anon update yaks votes"
  on public.yaks
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- ----- yak_votes (optional; skip if table does not exist yet) -----
-- create table if needed, then:
-- alter table public.yak_votes enable row level security;
-- create policy ... for select, insert, update, delete as needed.

-- ----- comments / chat on yaks -----
-- Run backend/supabase_yak_comments.sql to create yak_comments + RLS.
