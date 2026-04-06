-- Run this in Supabase → SQL Editor if you see:
--   PGRST205 / "Could not find the table 'public.yak_comment_votes'"
--
-- Use when yak_comments.id is bigint (matches comment ids like 1, 2, 14…).
-- Safe to run more than once (CREATE IF NOT EXISTS + idempotent policies).

CREATE TABLE IF NOT EXISTS public.yak_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL REFERENCES public.yak_comments (id) ON DELETE CASCADE,
  vote_value smallint NOT NULL CHECK (vote_value IN (-1, 0, 1)),
  UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS yak_comment_votes_comment_id_idx
  ON public.yak_comment_votes (comment_id);

ALTER TABLE public.yak_comment_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read yak_comment_votes" ON public.yak_comment_votes;
CREATE POLICY "Allow authenticated read yak_comment_votes"
  ON public.yak_comment_votes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write yak_comment_votes" ON public.yak_comment_votes;
CREATE POLICY "Allow authenticated write yak_comment_votes"
  ON public.yak_comment_votes FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
