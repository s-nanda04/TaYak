-- Run in Supabase → SQL Editor (after `yaks` exists)
-- Replies / chat on each yak (roots + threaded replies), optional author_name, vote tallies.

create table if not exists public.yak_comments (
  id uuid primary key default gen_random_uuid(),
  yak_id uuid not null references public.yaks (id) on delete cascade,
  text text not null,
  author_name text,
  parent_id uuid references public.yak_comments (id) on delete cascade,
  votes int not null default 0,
  created_at timestamptz not null default now()
);

-- Existing projects: add columns created before this migration
alter table public.yak_comments add column if not exists author_name text;
alter table public.yak_comments add column if not exists parent_id uuid references public.yak_comments (id) on delete cascade;
alter table public.yak_comments add column if not exists votes int not null default 0;

create index if not exists yak_comments_yak_id_idx on public.yak_comments (yak_id);
create index if not exists yak_comments_parent_id_idx on public.yak_comments (parent_id);

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

drop policy if exists "Allow anon update yak_comments votes" on public.yak_comments;
create policy "Allow anon update yak_comments votes"
  on public.yak_comments
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- Per-user votes on comments (same idea as yak_votes)
create table if not exists public.yak_comment_votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  comment_id uuid not null references public.yak_comments (id) on delete cascade,
  vote_value smallint not null,
  unique (user_id, comment_id)
);

create index if not exists yak_comment_votes_comment_id_idx on public.yak_comment_votes (comment_id);

alter table public.yak_comment_votes enable row level security;

drop policy if exists "Allow authenticated read yak_comment_votes" on public.yak_comment_votes;
create policy "Allow authenticated read yak_comment_votes"
  on public.yak_comment_votes
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow authenticated write yak_comment_votes" on public.yak_comment_votes;
create policy "Allow authenticated write yak_comment_votes"
  on public.yak_comment_votes
  for all
  to anon, authenticated
  using (true)
  with check (true);
