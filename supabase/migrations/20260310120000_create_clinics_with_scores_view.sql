-- Create view for sorting clinics by score and rating
-- This allows proper ORDER BY at the database level instead of JS sorting

CREATE OR REPLACE VIEW clinics_with_scores AS
SELECT
  c.*,
  cs.overall_score,
  cs.band AS score_band,
  cs.computed_at AS score_computed_at,
  cgp.rating AS google_rating,
  cgp.user_ratings_total AS google_review_count,
  cgp.place_id AS google_place_id
FROM clinics c
LEFT JOIN clinic_scores cs ON cs.clinic_id = c.id
LEFT JOIN clinic_google_places cgp ON cgp.clinic_id = c.id;

-- Grant permissions
GRANT SELECT ON clinics_with_scores TO anon;
GRANT SELECT ON clinics_with_scores TO authenticated;
GRANT SELECT ON clinics_with_scores TO service_role;
