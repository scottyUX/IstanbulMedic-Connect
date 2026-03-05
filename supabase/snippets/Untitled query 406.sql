-- See all facts for this clinic
SELECT 
  fact_key,
  fact_value,
  confidence,
  first_seen_at,
  last_seen_at
FROM clinic_facts
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY confidence DESC;