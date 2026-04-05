-- Run in Supabase → SQL Editor (after `yaks` exists)
-- Replies / chat on each yak

create table if not exists public.yak_comments (
  id uuid primary key default gen_random_uuid(),
  yak_id uuid not null references public.yaks (id) on delete cascade,
  text text not null,
  author_name text,
  created_at timestamptz not null default now()
);

create index if not exists yak_comments_yak_id_idx on public.yak_comments (yak_id);

alter table public.yak_comments enable row level security;

drop policy if exists "Allow anon read yak_comments" on public.yak_comments;
create policy "Allow anon read yak_comments"
  on public.yak_comments
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow anon insert yak_comments" on public.yak_comments;
create policy "Allow anon insert yak_comments"
  on public.yak_comments
  for insert
  to anon, authenticated
  with check (true);
