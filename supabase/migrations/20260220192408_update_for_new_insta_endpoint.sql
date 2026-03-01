CREATE TYPE instagram_post_type AS ENUM ('Image', 'Video', 'Sidecar');

CREATE TABLE clinic_instagram_posts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        uuid NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  source_id        uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,

  -- Identity
  instagram_post_id  varchar NOT NULL,
  short_code         varchar NOT NULL,
  post_type          instagram_post_type NOT NULL,
  url                text NOT NULL,

  -- Content
  caption            text,
  hashtags           text[]          DEFAULT '{}',

  -- Comments
  first_comment_text text,                        -- text of firstComment field
  comments_data      jsonb           DEFAULT '[]', -- full latestComments array

  -- Engagement (snapshot at time of scrape)
  likes_count        integer         DEFAULT 0,
  comments_count     integer         DEFAULT 0,

  -- Timing
  posted_at          timestamp with time zone,
  captured_at        timestamp with time zone NOT NULL DEFAULT (now() AT TIME ZONE 'utc'),

  CONSTRAINT clinic_instagram_posts_unique UNIQUE (clinic_id, instagram_post_id)
);

-- Indexes
CREATE INDEX idx_instagram_posts_clinic_id  ON clinic_instagram_posts(clinic_id);
CREATE INDEX idx_instagram_posts_posted_at  ON clinic_instagram_posts(clinic_id, posted_at DESC);
CREATE INDEX idx_instagram_posts_hashtags   ON clinic_instagram_posts USING GIN(hashtags);
CREATE INDEX idx_instagram_posts_source_id  ON clinic_instagram_posts(source_id);
CREATE INDEX idx_instagram_posts_comments   ON clinic_instagram_posts USING GIN(comments_data);

-- Comments
COMMENT ON TABLE  clinic_instagram_posts IS 'Snapshot of Instagram posts at time of scrape. Engagement counts are point-in-time, not live.';
COMMENT ON COLUMN clinic_instagram_posts.instagram_post_id  IS 'Instagrams internal post ID, used for deduplication';
COMMENT ON COLUMN clinic_instagram_posts.short_code         IS 'Used to reconstruct post URL: instagram.com/p/{short_code}';
COMMENT ON COLUMN clinic_instagram_posts.post_type          IS 'Image = single photo, Sidecar = carousel, Video = reel/video';
COMMENT ON COLUMN clinic_instagram_posts.hashtags           IS 'Array of hashtags without # prefix, lowercased for querying';
COMMENT ON COLUMN clinic_instagram_posts.first_comment_text IS 'Text of the first comment as returned by the scraper (may be own account)';
COMMENT ON COLUMN clinic_instagram_posts.comments_data      IS 'Full latestComments array from scraper: [{id, text, ownerUsername, timestamp, likesCount, repliesCount, replies[]}]';
COMMENT ON COLUMN clinic_instagram_posts.likes_count        IS 'Snapshot at time of capture, not a live count';
COMMENT ON COLUMN clinic_instagram_posts.comments_count     IS 'Snapshot at time of capture, not a live count';
COMMENT ON COLUMN clinic_instagram_posts.captured_at        IS 'When this data was scraped, distinct from when the post was made';


--social media table update
ALTER TABLE clinic_social_media
  ADD COLUMN IF NOT EXISTS follows_count bigint,
  ADD COLUMN IF NOT EXISTS posts_count integer,
  ADD COLUMN IF NOT EXISTS highlights_count integer,
  ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_category varchar;

COMMENT ON COLUMN clinic_social_media.follows_count IS 'Number of accounts this profile follows';
COMMENT ON COLUMN clinic_social_media.posts_count IS 'Total posts at time of last check';
COMMENT ON COLUMN clinic_social_media.highlights_count IS 'Number of story highlights';
COMMENT ON COLUMN clinic_social_media.is_private IS 'Whether the account is private';
COMMENT ON COLUMN clinic_social_media.business_category IS 'Instagram business category e.g. Medical & health';