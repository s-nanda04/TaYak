-- Run in Supabase → SQL Editor if posts should store a category/herd label.
-- The API sends `topic` on insert and expects it on select.

alter table public.yaks add column if not exists topic text;

comment on column public.yaks.topic is 'Category / herd for the post (e.g. Tech, Career).';
