-- Add parent_thread_id to reddit_thread_content
-- Links comment rows back to the parent post's forum_thread_index row.
-- Nullable: existing post rows have no parent; only comment rows will be populated.

ALTER TABLE public.reddit_thread_content
  ADD COLUMN parent_thread_id uuid REFERENCES forum_thread_index(id) ON DELETE SET NULL;

CREATE INDEX idx_reddit_content_parent_thread
  ON reddit_thread_content(parent_thread_id)
  WHERE parent_thread_id IS NOT NULL;

COMMENT ON COLUMN reddit_thread_content.parent_thread_id IS
  'For post_type=comment rows: FK to the forum_thread_index row of the parent post. NULL for top-level posts.';
