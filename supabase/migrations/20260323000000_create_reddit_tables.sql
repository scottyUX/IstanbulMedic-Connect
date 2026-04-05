CREATE TYPE reddit_post_type AS ENUM ('post', 'comment');

-- Raw Reddit posts and comments scraped per clinic
-- Mirrors clinic_instagram_posts pattern. source_documents is not used because
-- it lacks clinic_id and Reddit-specific fields (score, is_firsthand, medical_analysis).
CREATE TABLE public.clinic_reddit_posts (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  source_id                uuid REFERENCES sources(id) ON DELETE SET NULL,

  -- Reddit identity
  reddit_post_id           varchar NOT NULL,
  subreddit                varchar,
  post_type                reddit_post_type NOT NULL,
  url                      text NOT NULL,

  -- Content
  title                    text,
  body                     text,
  author_username          varchar,

  -- Engagement (snapshot at time of scrape)
  score                    integer          DEFAULT 0,
  comment_count            integer          DEFAULT 0,

  -- Classification
  is_firsthand             boolean          DEFAULT false,

  -- Medical analysis from scraper (medical_analysis object in results.json)
  medical_summary          text,
  had_clinical_procedures  boolean,
  seeking_medical_help     boolean,

  -- Timing
  posted_at                timestamp with time zone,
  captured_at              timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT clinic_reddit_posts_unique UNIQUE (clinic_id, reddit_post_id)
);

CREATE INDEX idx_reddit_posts_clinic_id   ON clinic_reddit_posts(clinic_id);
CREATE INDEX idx_reddit_posts_posted_at   ON clinic_reddit_posts(clinic_id, posted_at DESC);
CREATE INDEX idx_reddit_posts_source_id   ON clinic_reddit_posts(source_id);

COMMENT ON TABLE  clinic_reddit_posts IS 'Raw Reddit posts and comments matched to a clinic. Engagement counts are point-in-time, not live.';
COMMENT ON COLUMN clinic_reddit_posts.reddit_post_id          IS 'Reddit internal post/comment ID (e.g. t3_abc123). Used for deduplication.';
COMMENT ON COLUMN clinic_reddit_posts.subreddit               IS 'Subreddit name without r/ prefix, e.g. HairTransplants';
COMMENT ON COLUMN clinic_reddit_posts.post_type               IS 'post = top-level thread, comment = reply';
COMMENT ON COLUMN clinic_reddit_posts.title                   IS 'Post title; null for comments';
COMMENT ON COLUMN clinic_reddit_posts.is_firsthand            IS 'True if the author describes their own personal experience, false for hearsay or questions';
COMMENT ON COLUMN clinic_reddit_posts.medical_summary         IS 'AI-generated summary of the medical journey from scraper medical_analysis.summary';
COMMENT ON COLUMN clinic_reddit_posts.had_clinical_procedures IS 'From scraper: author had a procedure, not just researching';
COMMENT ON COLUMN clinic_reddit_posts.seeking_medical_help    IS 'From scraper: author is actively looking for a clinic or advice';
COMMENT ON COLUMN clinic_reddit_posts.score                   IS 'Reddit upvote score at time of capture';
COMMENT ON COLUMN clinic_reddit_posts.captured_at             IS 'When this row was scraped, distinct from when the post was published';


-- Aggregated Reddit trust profile per clinic (one row per clinic)
-- Maps directly to the ClinicRedditProfile TypeScript type used by the profile page.
-- clinic_facts is not used because pros/cons/themes/notable_mentions are complex
-- arrays that would be unnatural to split into key-value rows.
CREATE TABLE public.clinic_reddit_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id             uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

  -- AI-generated aggregate
  summary               text,

  -- Volume signals
  mention_count         integer          NOT NULL DEFAULT 0,
  thread_count          integer          NOT NULL DEFAULT 0,
  unique_authors_count  integer,
  last_mentioned_at     timestamp with time zone,

  -- Quality signals
  confidence_score      numeric(4,3)     CHECK (confidence_score BETWEEN 0 AND 1),
  sentiment_score       numeric(4,3)     CHECK (sentiment_score BETWEEN -1 AND 1),

  -- Aggregated intelligence
  pros                  text[]           DEFAULT '{}',
  cons                  text[]           DEFAULT '{}',
  themes                jsonb            DEFAULT '[]',
  caution_flags         jsonb            DEFAULT '[]',
  notable_mentions      jsonb            DEFAULT '[]',

  -- Metadata
  captured_at           timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at            timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT clinic_reddit_profiles_clinic_id_key UNIQUE (clinic_id)
);

CREATE INDEX idx_reddit_profiles_last_mentioned ON clinic_reddit_profiles(clinic_id, last_mentioned_at DESC);

COMMENT ON TABLE  clinic_reddit_profiles IS 'Aggregated Reddit trust signal per clinic. One row per clinic. Computed by the Reddit ingestion pipeline.';
COMMENT ON COLUMN clinic_reddit_profiles.summary              IS '1-3 sentence AI summary of the clinic''s Reddit reputation';
COMMENT ON COLUMN clinic_reddit_profiles.mention_count        IS 'Total matched posts + comments across all threads';
COMMENT ON COLUMN clinic_reddit_profiles.thread_count         IS 'Number of unique Reddit threads that mention this clinic';
COMMENT ON COLUMN clinic_reddit_profiles.unique_authors_count IS 'Number of distinct Reddit authors who mentioned this clinic';
COMMENT ON COLUMN clinic_reddit_profiles.confidence_score     IS '0-1 signal reliability score based on volume and consistency';
COMMENT ON COLUMN clinic_reddit_profiles.sentiment_score      IS '-1 (very negative) to 1 (very positive) aggregate sentiment';
COMMENT ON COLUMN clinic_reddit_profiles.pros                 IS 'Recurring positives extracted from posts, e.g. "great doctor involvement"';
COMMENT ON COLUMN clinic_reddit_profiles.cons                 IS 'Recurring negatives or caution signals';
COMMENT ON COLUMN clinic_reddit_profiles.themes               IS 'Array of {label, count, sentiment} objects. Labels: natural_results, density, doctor_involvement, technician_heavy, aftercare, communication, sales_pressure, price_value, healing, donor_management, language_support';
COMMENT ON COLUMN clinic_reddit_profiles.caution_flags        IS 'Array of {label, count} objects for serious red flags e.g. overharvesting, bait_and_switch';
COMMENT ON COLUMN clinic_reddit_profiles.notable_mentions     IS 'Array of {title?, snippet, url, created_at?, sentiment?, firsthand?} representative source excerpts';
COMMENT ON COLUMN clinic_reddit_profiles.captured_at          IS 'Timestamp of the last ingestion run that produced this profile';
COMMENT ON COLUMN clinic_reddit_profiles.updated_at           IS 'Updated whenever the profile is recomputed; use for cache invalidation';