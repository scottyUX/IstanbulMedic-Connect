ALTER TABLE public.forum_thread_llm_analysis
  ADD COLUMN sentiment_toward_clinic text
  CHECK (sentiment_toward_clinic IN ('positive', 'mixed', 'negative', 'not_applicable'));

COMMENT ON COLUMN forum_thread_llm_analysis.sentiment_toward_clinic IS
  'For inherited comment rows only: sentiment directed at the attributed clinic specifically.
   NULL on regular post rows. not_applicable = comment discusses a different clinic.';
