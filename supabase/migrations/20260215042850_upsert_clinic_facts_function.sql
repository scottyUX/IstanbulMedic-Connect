-- Function to properly upsert clinic facts while preserving first_seen_at
CREATE OR REPLACE FUNCTION upsert_clinic_facts(facts_data jsonb)
RETURNS SETOF clinic_facts AS $$
BEGIN
  RETURN QUERY
  INSERT INTO clinic_facts (
    clinic_id,
    fact_key,
    fact_value,
    value_type,
    confidence,
    computed_by,
    is_conflicting,
    first_seen_at,
    last_seen_at
  )
  SELECT
    (f->>'clinic_id')::uuid,
    f->>'fact_key',
    (f->>'fact_value')::jsonb,
    (f->>'value_type')::value_type_enum,
    (f->>'confidence')::real,
    (f->>'computed_by')::computed_by_enum,
    (f->>'is_conflicting')::boolean,
    (f->>'first_seen_at')::timestamptz,
    (f->>'last_seen_at')::timestamptz
  FROM jsonb_array_elements(facts_data) AS f
  ON CONFLICT (clinic_id, fact_key) DO UPDATE SET
    fact_value = EXCLUDED.fact_value,
    confidence = EXCLUDED.confidence,
    first_seen_at = clinic_facts.first_seen_at,  -- Keep original
    last_seen_at = EXCLUDED.last_seen_at,        -- Update to now
    is_conflicting = EXCLUDED.is_conflicting
  RETURNING *;
END;
$$ LANGUAGE plpgsql;