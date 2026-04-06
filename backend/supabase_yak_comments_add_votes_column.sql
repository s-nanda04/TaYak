-- If you see PGRST204 / "Could not find the 'votes' column of 'yak_comments'":
-- Run in Supabase → SQL Editor. The API can work without this column (totals come from
-- yak_comment_votes), but adding it lets you cache scores on each row if you want.

ALTER TABLE public.yak_comments
  ADD COLUMN IF NOT EXISTS votes int NOT NULL DEFAULT 0;
