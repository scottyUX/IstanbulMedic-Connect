-- Tighten clinic_team_qualifications uniqueness to one row per
-- (team_member_id, source), so a single doctor can never accumulate
-- multiple rows from the same registry.
--
-- Background: the original migration (20260502000000) declared the unique
-- constraint as (team_member_id, qualification, source). Under the new
-- presence-IS-the-credential model every (team_member_id, source) pair
-- carries exactly one canonical qualification string ("ISHRS member" /
-- "IAHRS member" / "TPRECD member ..."), so the looser triple-key constraint
-- can no longer fire. Tightening to (team_member_id, source) makes the
-- "one badge per registry per doctor" invariant a database guarantee, not
-- a convention enforced only by the scraper's upsert key.
--
-- Local-DB safety: any local instance that ran an earlier prerelease of
-- the scraper may hold rows that violate the new constraint (one row per
-- old-format detail credential — FISHRS, ABHRS Diplomate, FUE Europe Member,
-- and so on). We collapse those in-place before the constraint is added,
-- preserving the earliest verified_at and the first non-null source_url
-- per (team_member_id, source) pair.
--
-- Down step recreates the original triple-key constraint. The collapse pass
-- is one-way — there's no way to reconstruct the deleted detail rows, and
-- there's no need to: the new model treats them as derived noise.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Drop the existing unique constraint, if it exists.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clinic_team_qualifications
  DROP CONSTRAINT IF EXISTS clinic_team_qualifications_team_member_id_qualification_so_key;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Collapse any rows that would violate the new (team_member_id, source)
--    uniqueness. Per pair: keep the earliest verified_at, fold the first
--    non-null source_url, set qualification to the canonical string. Then
--    delete every other row for that pair.
-- ─────────────────────────────────────────────────────────────────────────────

WITH ranked AS (
  SELECT
    id,
    team_member_id,
    source,
    qualification,
    source_url,
    verified_at,
    ROW_NUMBER() OVER (
      PARTITION BY team_member_id, source
      ORDER BY verified_at ASC, id ASC
    ) AS rn,
    FIRST_VALUE(source_url) OVER (
      PARTITION BY team_member_id, source
      ORDER BY (source_url IS NULL), verified_at ASC, id ASC
    ) AS canonical_source_url,
    MIN(verified_at) OVER (PARTITION BY team_member_id, source) AS canonical_verified_at
  FROM public.clinic_team_qualifications
)
UPDATE public.clinic_team_qualifications q
SET
  qualification = CASE r.source
    WHEN 'ishrs'  THEN 'ISHRS member'
    WHEN 'iahrs'  THEN 'IAHRS member'
    WHEN 'tprecd' THEN 'TPRECD member (Turkish board-certified plastic surgeon)'
    ELSE q.qualification
  END,
  source_url = r.canonical_source_url,
  verified_at = r.canonical_verified_at
FROM ranked r
WHERE q.id = r.id AND r.rn = 1;

DELETE FROM public.clinic_team_qualifications q
USING (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY team_member_id, source
      ORDER BY verified_at ASC, id ASC
    ) AS rn
  FROM public.clinic_team_qualifications
) r
WHERE q.id = r.id AND r.rn > 1;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add the new uniqueness guarantee.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.clinic_team_qualifications
  ADD CONSTRAINT clinic_team_qualifications_team_member_id_source_key
  UNIQUE (team_member_id, source);

COMMENT ON CONSTRAINT clinic_team_qualifications_team_member_id_source_key
  ON public.clinic_team_qualifications IS
  'One qualification row per (doctor, registry). Registry presence is the credential — there is no second qualification a doctor can earn from the same registry.';
