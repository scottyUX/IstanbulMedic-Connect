-- Add sentiment_score to forum_thread_llm_analysis
-- The LLM already returns a numeric score (-1.0 to 1.0) alongside the label,
-- but we were only storing the label. This column captures the raw score so
-- clinic_forum_profiles.sentiment_score can be computed from per-thread values.

ALTER TABLE public.forum_thread_llm_analysis
  ADD COLUMN sentiment_score numeric(4,3) CHECK (sentiment_score BETWEEN -1 AND 1);

COMMENT ON COLUMN forum_thread_llm_analysis.sentiment_score IS 'LLM-assigned sentiment score from -1.0 (very negative) to 1.0 (very positive). Stored alongside sentiment_label for numeric aggregation at the clinic level.';
