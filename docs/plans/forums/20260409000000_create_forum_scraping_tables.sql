-- Forum scraping schema: hub + extensions pattern
-- Covers HRN and Reddit (and future forum sources) with unified downstream tables.
--
-- Tables created:
--   forum_source_enum            new enum
--   forum_thread_index           hub — one row per thread URL across all sources
--   hrn_thread_content           HRN-specific extension (1:1 with hub)
--   reddit_thread_content        Reddit-specific extension (1:1 with hub)
--   forum_thread_signals         deterministic signals (regex/keyword), EAV
--   forum_thread_llm_analysis    LLM-derived signals, versioned per prompt run
--   clinic_forum_profiles        aggregated clinic profile per forum source
--
-- Reddit migration (clinic_reddit_posts → hub + reddit_thread_content,
--                   clinic_reddit_profiles → clinic_forum_profiles)
-- is handled at the bottom of this file.


-- ─────────────────────────────────────────────────────────────────────────────
-- ENUM
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TYPE forum_source_enum AS ENUM ('hrn', 'reddit', 'realself');


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. forum_thread_index  (hub)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.forum_thread_index (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id                  uuid REFERENCES clinics(id) ON DELETE SET NULL,
  source_id                  uuid REFERENCES sources(id) ON DELETE SET NULL,

  forum_source               forum_source_enum NOT NULL,
  thread_url                 text NOT NULL,

  title                      text,
  author_username            varchar,
  post_date                  timestamp with time zone,
  reply_count                integer,

  -- Attribution — filled in after LLM runs (or immediately if known at scrape time)
  clinic_attribution_method  varchar,   -- 'url' | 'llm' | 'manual' | null

  first_scraped_at           timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  last_scraped_at            timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT forum_thread_index_url_unique UNIQUE (thread_url)
);

CREATE INDEX idx_forum_index_clinic_id    ON forum_thread_index(clinic_id);
CREATE INDEX idx_forum_index_source       ON forum_thread_index(forum_source, post_date DESC);
CREATE INDEX idx_forum_index_unattributed ON forum_thread_index(forum_source) WHERE clinic_id IS NULL;

COMMENT ON TABLE  forum_thread_index IS 'Hub table — one row per unique thread URL across all forum sources. Platform-specific fields live in extension tables.';
COMMENT ON COLUMN forum_thread_index.clinic_id IS 'Nullable — unknown at scrape time, filled in after LLM attribution runs.';
COMMENT ON COLUMN forum_thread_index.clinic_attribution_method IS 'How the clinic was determined: url (slug), llm, manual, or null if still unattributed.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. hrn_thread_content  (HRN extension)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.hrn_thread_content (
  thread_id                  uuid PRIMARY KEY REFERENCES forum_thread_index(id) ON DELETE CASCADE,

  forum_section_id           varchar,   -- e.g. '24' = Hair Transplant Reviews, '17' = Clinic Results, '89' = Repairs
  forum_section_name         varchar,

  view_count                 integer,   -- not always present on HRN
  total_pages                integer,

  -- Original post
  op_text                    text,
  op_html                    text,      -- kept for re-parsing if selectors change

  -- Last post by the same author (captures long-term updates)
  last_author_post_text      text,
  last_author_post_date      timestamp with time zone,
  last_author_post_page      integer,

  -- Media
  has_photos                 boolean DEFAULT false,
  image_urls                 text[],

  -- Scraping metadata
  scrape_strategy            varchar,   -- 'op_only' | 'op_and_last' | 'paginated'
  sitemap_lastmod            timestamp with time zone  -- from HRN sitemap, used to detect re-scrape need
);

COMMENT ON TABLE  hrn_thread_content IS 'HRN-specific fields. Always joined to forum_thread_index via thread_id.';
COMMENT ON COLUMN hrn_thread_content.forum_section_id IS 'HRN internal forum ID. 17 = Clinic Results, 24 = Reviews, 89 = Repairs.';
COMMENT ON COLUMN hrn_thread_content.last_author_post_text IS 'Most recent post by the OP — the best source for long-term outcome signals.';
COMMENT ON COLUMN hrn_thread_content.sitemap_lastmod IS 'lastmod from HRN sitemap.php. If > last_scraped_at, thread needs re-scraping.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. reddit_thread_content  (Reddit extension)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.reddit_thread_content (
  thread_id                  uuid PRIMARY KEY REFERENCES forum_thread_index(id) ON DELETE CASCADE,

  reddit_post_id             varchar NOT NULL,  -- e.g. t3_abc123 — Reddit's internal ID
  subreddit                  varchar,            -- without r/ prefix, e.g. HairTransplants
  post_type                  varchar NOT NULL,   -- 'post' | 'comment'

  body                       text,
  score                      integer DEFAULT 0,
  comment_count              integer DEFAULT 0,

  -- Classification
  is_firsthand               boolean DEFAULT false,

  -- Medical signals (from scraper analysis)
  had_clinical_procedures    boolean,
  seeking_medical_help       boolean,

  CONSTRAINT reddit_thread_content_post_id_unique UNIQUE (reddit_post_id)
);

COMMENT ON TABLE  reddit_thread_content IS 'Reddit-specific fields. Replaces clinic_reddit_posts after migration. Always joined to forum_thread_index via thread_id.';
COMMENT ON COLUMN reddit_thread_content.reddit_post_id IS 'Reddit internal post/comment ID (e.g. t3_abc123). Used for deduplication.';
COMMENT ON COLUMN reddit_thread_content.post_type IS 'post = top-level thread, comment = reply to a thread.';
COMMENT ON COLUMN reddit_thread_content.is_firsthand IS 'True if the author describes their own personal experience, false for hearsay or questions.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 4. forum_thread_signals  (deterministic, EAV)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.forum_thread_signals (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id           uuid NOT NULL REFERENCES forum_thread_index(id) ON DELETE CASCADE,

  signal_name         varchar NOT NULL,  -- 'graft_count' | 'timeline_markers' | 'has_photos' | ...
  signal_value        jsonb NOT NULL,    -- number, string[], boolean — whatever fits
  evidence_snippet    text,              -- exact text that triggered this extraction
  extraction_method   varchar NOT NULL,  -- 'regex' | 'keyword' | 'direct'
  extraction_version  varchar,           -- e.g. 'v1.0'

  created_at          timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT forum_thread_signals_unique UNIQUE (thread_id, signal_name)
);

CREATE INDEX idx_forum_signals_thread_id   ON forum_thread_signals(thread_id);
CREATE INDEX idx_forum_signals_signal_name ON forum_thread_signals(signal_name);

COMMENT ON TABLE  forum_thread_signals IS 'Deterministic signals extracted via regex or keyword matching. One row per signal per thread. EAV allows adding new signal types without schema changes.';
COMMENT ON COLUMN forum_thread_signals.signal_value IS 'jsonb for flexibility — graft_count: 3000, timeline_markers: ["6 months","1 year"], has_photos: true.';
COMMENT ON COLUMN forum_thread_signals.evidence_snippet IS 'The exact text that triggered this extraction — required for auditability.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 5. forum_thread_llm_analysis  (LLM-derived, versioned)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.forum_thread_llm_analysis (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id               uuid NOT NULL REFERENCES forum_thread_index(id) ON DELETE CASCADE,

  -- Attribution (LLM determines from thread text)
  attributed_clinic_name  varchar,
  attributed_doctor_name  varchar,
  attributed_clinic_id    uuid REFERENCES clinics(id) ON DELETE SET NULL,

  -- Sentiment & satisfaction
  sentiment_label         varchar,   -- 'positive' | 'mixed' | 'negative'
  satisfaction_label      varchar,   -- 'satisfied' | 'mixed' | 'regretful'

  -- Content analysis
  summary_short           text,
  main_topics             text[],    -- 'density' | 'hairline' | 'donor_area' | 'healing' | 'communication' | 'value' | 'doctor_involvement' | 'technician_quality' | 'aftercare' | 'natural_results' | 'other'
  issue_keywords          text[],    -- negation-aware: 'shock_loss' | 'scarring' | 'infection' | ...
  is_repair_case          boolean,

  -- Secondary clinic/doctor mentions found in this thread
  -- Stored for future use — allows backfilling a junction table later without re-running LLM
  -- Format: [{ clinic_name, doctor_name, role, sentiment, evidence }]
  -- role: 'mentioned' | 'compared' | 'repair_source'
  secondary_clinic_mentions jsonb DEFAULT '[]',

  -- Per-signal citations
  evidence_snippets       jsonb,     -- { "is_repair_case": "...text...", "sentiment": "...text..." }

  -- LLM auditability — required on every row
  model_name              varchar NOT NULL,
  prompt_version          varchar NOT NULL,
  run_timestamp           timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  -- Versioning: true = latest run for this thread, false = historical
  is_current              boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_forum_llm_thread_current ON forum_thread_llm_analysis(thread_id) WHERE is_current = true;
CREATE INDEX idx_forum_llm_attributed     ON forum_thread_llm_analysis(attributed_clinic_id) WHERE is_current = true;

COMMENT ON TABLE  forum_thread_llm_analysis IS 'LLM-derived signals per thread. Separate from forum_thread_signals because all fields come from one prompt call and need versioning together. is_current = true marks the active run.';
COMMENT ON COLUMN forum_thread_llm_analysis.is_current IS 'Set to false on older runs when a new prompt version is run. Query with WHERE is_current = true.';
COMMENT ON COLUMN forum_thread_llm_analysis.secondary_clinic_mentions IS 'Other clinics/doctors mentioned in the thread but not the primary subject. Stored as jsonb so a junction table can be backfilled later without re-running the LLM. Format: [{ clinic_name, doctor_name, role, sentiment, evidence }].';
COMMENT ON COLUMN forum_thread_llm_analysis.evidence_snippets IS 'Map of signal name → the text excerpt that informed that signal. Required for UI auditability.';


-- ─────────────────────────────────────────────────────────────────────────────
-- 6. clinic_forum_profiles  (aggregated, one row per clinic per source)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE public.clinic_forum_profiles (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id               uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  forum_source            forum_source_enum NOT NULL,

  -- AI summary
  summary                 text,

  -- Volume signals (deterministic)
  thread_count            integer NOT NULL DEFAULT 0,
  photo_thread_count      integer NOT NULL DEFAULT 0,
  longterm_thread_count   integer NOT NULL DEFAULT 0,  -- threads with 6m+ or 12m+ timeline markers
  repair_mention_count    integer NOT NULL DEFAULT 0,
  unique_authors_count    integer,
  last_thread_at          timestamp with time zone,

  -- Quality signals (LLM-assisted)
  confidence_score        numeric(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  sentiment_score         numeric(4,3) CHECK (sentiment_score BETWEEN -1 AND 1),

  -- Aggregated intel
  sentiment_distribution  jsonb,    -- { "positive": 14, "mixed": 6, "negative": 3 }
  common_concerns         text[],
  notable_threads         jsonb,    -- [{ title, url, summary, sentiment, has_photos }]

  -- Staleness: set true when a new thread is attributed, triggers nightly recompute
  is_stale                boolean NOT NULL DEFAULT false,

  captured_at             timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),
  updated_at              timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT clinic_forum_profiles_unique UNIQUE (clinic_id, forum_source)
);

CREATE INDEX idx_forum_profiles_clinic_id ON clinic_forum_profiles(clinic_id);
CREATE INDEX idx_forum_profiles_stale     ON clinic_forum_profiles(forum_source) WHERE is_stale = true;

COMMENT ON TABLE  clinic_forum_profiles IS 'Aggregated clinic profile per forum source. One row per (clinic_id, forum_source). Replaces clinic_reddit_profiles after migration.';
COMMENT ON COLUMN clinic_forum_profiles.is_stale IS 'Set to true when a new thread is attributed to this clinic. Nightly job recomputes stale profiles.';
COMMENT ON COLUMN clinic_forum_profiles.longterm_thread_count IS 'Threads with 6-month or 12-month timeline markers — key trust signal.';


-- ─────────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- These tables are accessed server-side only via the service-role key.
-- RLS is intentionally disabled here — they are internal pipeline tables, not
-- user-facing. If any of these tables are ever exposed to the anon/authenticated
-- roles (e.g. a public forum-search endpoint), add RLS policies at that point.
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- REDDIT MIGRATION
-- Migrates clinic_reddit_posts → forum_thread_index + reddit_thread_content
-- Migrates clinic_reddit_profiles → clinic_forum_profiles
-- Then drops the old tables.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Migrate clinic_reddit_posts into hub + extension
INSERT INTO forum_thread_index (
  id,
  clinic_id,
  source_id,
  forum_source,
  thread_url,
  title,
  author_username,
  post_date,
  reply_count,
  clinic_attribution_method,
  first_scraped_at,
  last_scraped_at
)
SELECT
  id,
  clinic_id,
  source_id,
  'reddit'::forum_source_enum,
  url,
  title,
  author_username,
  posted_at,
  comment_count,
  'llm',          -- existing reddit posts were attributed upfront (treated as llm equivalent)
  captured_at,
  captured_at
FROM clinic_reddit_posts;

INSERT INTO reddit_thread_content (
  thread_id,
  reddit_post_id,
  subreddit,
  post_type,
  body,
  score,
  comment_count,
  is_firsthand,
  had_clinical_procedures,
  seeking_medical_help
)
SELECT
  id,           -- same uuid carried over to hub, now used as thread_id
  reddit_post_id,
  subreddit,
  post_type::varchar,
  body,
  score,
  comment_count,
  is_firsthand,
  had_clinical_procedures,
  seeking_medical_help
FROM clinic_reddit_posts;

-- 2. Migrate clinic_reddit_profiles → clinic_forum_profiles
INSERT INTO clinic_forum_profiles (
  clinic_id,
  forum_source,
  summary,
  thread_count,
  unique_authors_count,
  last_thread_at,
  confidence_score,
  sentiment_score,
  notable_threads,
  is_stale,
  captured_at,
  updated_at
)
SELECT
  clinic_id,
  'reddit'::forum_source_enum,
  summary,
  mention_count,   -- closest equivalent to thread_count
  unique_authors_count,
  last_mentioned_at,
  confidence_score,
  sentiment_score,
  notable_mentions,
  false,
  captured_at,
  updated_at
FROM clinic_reddit_profiles;

-- 3. Drop old Reddit tables
DROP TABLE clinic_reddit_posts;
DROP TABLE clinic_reddit_profiles;

-- 4. Drop the now-unused reddit_post_type enum
DROP TYPE reddit_post_type;
