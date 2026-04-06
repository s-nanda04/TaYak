-- Use this migration when `yak_comments.id` is bigint (identity), NOT uuid.
-- (Supabase sometimes creates int8/bigint ids; uuid parent_id then fails with 42804.)
--
-- Run in Supabase → SQL Editor after any failed attempt on the uuid-based script.
--
-- If comments work but comment *votes* fail (PGRST205 yak_comment_votes missing), run only:
--   backend/supabase_yak_comment_votes_only_bigint.sql

-- 1) Threading: parent_id must match `id` type (bigint)
ALTER TABLE public.yak_comments DROP CONSTRAINT IF EXISTS yak_comments_parent_id_fkey;
ALTER TABLE public.yak_comments DROP COLUMN IF EXISTS parent_id;
ALTER TABLE public.yak_comments
  ADD COLUMN parent_id bigint REFERENCES public.yak_comments (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS yak_comments_parent_id_idx ON public.yak_comments (parent_id);

-- 2) Optional: poster id (API sends when column exists)
ALTER TABLE public.yak_comments ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.yak_comments ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.yak_comments ADD COLUMN IF NOT EXISTS votes int NOT NULL DEFAULT 0;

-- 3) Comment votes: comment_id must be bigint to match yak_comments.id
DROP TABLE IF EXISTS public.yak_comment_votes CASCADE;

CREATE TABLE public.yak_comment_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  comment_id bigint NOT NULL REFERENCES public.yak_comments (id) ON DELETE CASCADE,
  vote_value smallint NOT NULL CHECK (vote_value IN (-1, 0, 1)),
  UNIQUE (user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS yak_comment_votes_comment_id_idx ON public.yak_comment_votes (comment_id);

ALTER TABLE public.yak_comment_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read yak_comment_votes" ON public.yak_comment_votes;
CREATE POLICY "Allow authenticated read yak_comment_votes"
  ON public.yak_comment_votes FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated write yak_comment_votes" ON public.yak_comment_votes;
CREATE POLICY "Allow authenticated write yak_comment_votes"
  ON public.yak_comment_votes FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
