-- Seed data for IstanbulMedic-Connect
-- Run automatically when you execute: supabase db reset

-- ============================================
-- CLINICS
-- ============================================

INSERT INTO clinics (id, display_name, legal_name, status, primary_city, primary_country, website_url, whatsapp_contact, email_contact, phone_contact)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Istanbul Hair Masters', 'Istanbul Hair Masters Medical Tourism Ltd', 'active', 'Istanbul', 'Turkey', 'https://istanbulhairmasters.com', '+905551234567', 'info@istanbulhairmasters.com', '+902121234567'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ankara Smile Dental Clinic', 'Ankara Smile Dental Center Inc', 'active', 'Ankara', 'Turkey', 'https://ankarasmiledental.com', '+905552345678', 'contact@ankarasmiledental.com', '+903121234567'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bodrum Aesthetic Surgery', 'Bodrum Aesthetic Medical Ltd', 'under_review', 'Bodrum', 'Turkey', 'https://bodrumaesthetic.com', '+905553456789', 'hello@bodrumaesthetic.com', '+902521234567'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Izmir Cosmetic Center', 'Izmir Cosmetic Healthcare Inc', 'active', 'Izmir', 'Turkey', NULL, '+905554567890', 'info@izmircosmetic.com', '+902321234567');

-- ============================================
-- CLINIC LOCATIONS (with new city, country, postal_code fields)
-- ============================================

INSERT INTO clinic_locations (clinic_id, location_name, address_line, city, country, postal_code, latitude, longitude, is_primary)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Istanbul Hair Masters Main Facility', 'Nisantasi, Vali Konagi Cad. No:42, Sisli', 'Istanbul', 'Turkey', '34360', 41.0482, 28.9940, true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Istanbul Hair Masters Airport Branch', 'Istanbul Airport, Terminal 1, Gate A15', 'Istanbul', 'Turkey', '34283', 41.2619, 28.7419, false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ankara Smile Main Clinic', 'Kizilirmak Mah. Dumlupinar Blv. No:3, Cankaya', 'Ankara', 'Turkey', '06510', 39.9042, 32.8597, true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bodrum Aesthetic Center', 'Gumbet Mah. Adnan Menderes Cad. No:89', 'Bodrum', 'Turkey', '48400', 37.0242, 27.4307, true),
  ('550e8400-e29b-41d4-a716-446655440004', 'Izmir Cosmetic Main Office', 'Kibris Sehitleri Cad. No:140, Alsancak, Konak', 'Izmir', 'Turkey', '35220', 38.4382, 27.1393, true);

-- ============================================
-- CLINIC SERVICES
-- ============================================

INSERT INTO clinic_services (clinic_id, service_category, service_name, is_primary_service)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440001', 'Cosmetic', 'Other', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Cosmetic', 'Other', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Cosmetic', 'Other', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'Cosmetic', 'Other', true);

-- ============================================
-- CLINIC MEDIA
-- ============================================

INSERT INTO clinic_media (clinic_id, media_type, url, alt_text, caption, is_primary, display_order)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'image',
   'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Clinic lobby', 'Main lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440001', 'image',
   'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Operating room', 'Modern operating room', false, 1),
  ('550e8400-e29b-41d4-a716-446655440001', 'image',
   'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Clinic equipment', 'State of the art equipment', false, 2),

  ('550e8400-e29b-41d4-a716-446655440002', 'image',
   'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Dental clinic interior', 'Dental clinic interior', true, 0),
  ('550e8400-e29b-41d4-a716-446655440002', 'image',
   'https://images.unsplash.com/photo-1521791136064-7986c2920216?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Dental chair', 'Patient treatment chair', false, 1),

  ('550e8400-e29b-41d4-a716-446655440003', 'image',
   'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Aesthetic clinic room', 'Private consultation room', true, 0),
  ('550e8400-e29b-41d4-a716-446655440003', 'image',
   'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Recovery area', 'Comfortable recovery area', false, 1),

  ('550e8400-e29b-41d4-a716-446655440004', 'image',
   'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Clinic waiting area', 'Waiting lounge', true, 0),
  ('550e8400-e29b-41d4-a716-446655440004', 'image',
   'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600',
   'Procedure room', 'Procedure room', false, 1);

-- ============================================
-- CLINIC TEAM
-- ============================================

INSERT INTO clinic_team (clinic_id, role, name, credentials, years_experience, doctor_involvement_level)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'medical_director', 'Dr. Mehmet Yilmaz', 'MD, Board Certified Hair Restoration Surgeon, ISHRS Member', 15, 'high'),
  ('550e8400-e29b-41d4-a716-446655440001', 'surgeon', 'Dr. Ayse Kaya', 'MD, FUE Specialist', 8, 'high'),
  ('550e8400-e29b-41d4-a716-446655440001', 'coordinator', 'Elif Demir', 'Medical Tourism Coordinator, Fluent in English/Arabic', 5, 'medium'),
  ('550e8400-e29b-41d4-a716-446655440002', 'medical_director', 'Dr. Ahmet Ozturk', 'DDS, MSc Prosthodontics', 12, 'high'),
  ('550e8400-e29b-41d4-a716-446655440002', 'surgeon', 'Dr. Zeynep Arslan', 'DDS, Cosmetic Dentistry Specialist', 7, 'medium'),
  ('550e8400-e29b-41d4-a716-446655440003', 'surgeon', 'Dr. Can Yildirim', 'MD, EBOPRAS Certified Plastic Surgeon', 10, 'high'),
  ('550e8400-e29b-41d4-a716-446655440003', 'coordinator', 'Sara Johnson', 'Patient Coordinator, Native English Speaker', 3, 'low'),
  ('550e8400-e29b-41d4-a716-446655440004', 'medical_director', 'Dr. Emre Celik', 'MD, Aesthetic Medicine Specialist', 9, 'medium');

-- ============================================
-- SOURCES
-- ============================================

INSERT INTO sources (id, source_type, source_name, url, author_handle, content_hash)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', 'clinic_website', 'Istanbul Hair Masters Official Website', 'https://istanbulhairmasters.com/about', NULL, 'hash_ihm_about_001'),
  ('650e8400-e29b-41d4-a716-446655440002', 'review_platform', 'Trustpilot', 'https://trustpilot.com/review/istanbulhairmasters', 'patient_john_d', 'hash_tp_review_001'),
  ('650e8400-e29b-41d4-a716-446655440003', 'reddit', 'r/hairtransplants', 'https://reddit.com/r/hairtransplants/comments/abc123', 'u/happyhairpatient', 'hash_reddit_001'),
  ('650e8400-e29b-41d4-a716-446655440004', 'review_platform', 'WhatClinic', 'https://whatclinic.com/ankara-smile-dental', 'patient_maria_s', 'hash_wc_review_001'),
  ('650e8400-e29b-41d4-a716-446655440005', 'clinic_website', 'Ankara Smile Pricing Page', 'https://ankarasmiledental.com/pricing', NULL, 'hash_asd_pricing_001'),
  ('650e8400-e29b-41d4-a716-446655440006', 'mystery_inquiry', 'Mystery Email Inquiry - Istanbul Hair Masters', NULL, 'mystery_shopper_1', 'hash_mystery_ihm_001'),
  ('650e8400-e29b-41d4-a716-446655440007', 'social_media', 'Instagram', 'https://instagram.com/istanbulhairmasters', NULL, 'hash_ig_ihm_001');

-- ============================================
-- CLINIC PRICING (with source tracking)
-- ============================================

INSERT INTO clinic_pricing (clinic_id, service_name, price_min, price_max, currency, pricing_type, notes, source_id, is_verified, last_verified_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'FUE Hair Transplant (3000 grafts)', 1800, 2500, 'EUR', 'range', 'All-inclusive package with hotel and transfers', '650e8400-e29b-41d4-a716-446655440001', true, '2024-12-15 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'DHI Hair Transplant (4000 grafts)', 2500, 3200, 'EUR', 'range', 'Premium technique, includes PRP treatment', '650e8400-e29b-41d4-a716-446655440001', true, '2024-12-15 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'All-on-4 Dental Implants', 4500, 6000, 'EUR', 'range', 'Per arch, includes temporary teeth', '650e8400-e29b-41d4-a716-446655440005', true, '2024-11-20 14:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Smile Makeover Package', NULL, NULL, 'EUR', 'quote_only', 'Custom quote based on individual needs', '650e8400-e29b-41d4-a716-446655440005', false, NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'Rhinoplasty', 3000, 4500, 'EUR', 'range', 'Includes pre-op consultation and 1 year follow-up', NULL, false, NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'Liposuction (single area)', 2000, 2800, 'EUR', 'range', 'Price varies by area size', NULL, false, NULL);

-- ============================================
-- CLINIC PACKAGES (with pricing)
-- ============================================

INSERT INTO clinic_packages (clinic_id, package_name, includes, excludes, nights_included, transport_included, aftercare_duration_days, price_min, price_max, currency)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Premium Hair Transplant Package', 
   '["4000 grafts FUE", "PRP treatment", "Medications", "Post-op kit", "4-star hotel", "Airport transfers", "Translator"]'::jsonb,
   '["Flights", "Personal expenses", "Additional nights"]'::jsonb,
   3, true, 365, 2800, 3200, 'EUR'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Budget Hair Transplant Package', 
   '["3000 grafts FUE", "Medications", "3-star hotel", "Airport transfers"]'::jsonb,
   '["PRP treatment", "Flights", "Translator"]'::jsonb,
   2, true, 180, 1800, 2200, 'EUR'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Dental Tourism Package', 
   '["All-on-4 implants", "Temporary teeth", "5-star hotel", "All transfers", "Interpreter"]'::jsonb,
   '["Flights", "Final prosthesis (done after 3 months)"]'::jsonb,
   7, true, 90, 5200, 6000, 'EUR'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Rhinoplasty Complete Care', 
   '["Surgery", "Anesthesia", "Hospital stay", "Boutique hotel 5 nights", "All transfers", "Follow-up visits"]'::jsonb,
   '["Flights", "Revision surgery if needed"]'::jsonb,
   5, true, 365, 3500, 4500, 'EUR');

-- ============================================
-- CLINIC CREDENTIALS
-- ============================================

INSERT INTO clinic_credentials (clinic_id, credential_type, credential_name, credential_id, issuing_body, valid_from, valid_to)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'accreditation', 'JCI Accreditation', 12345, 'Joint Commission International', '2023-01-15', '2026-01-15'),
  ('550e8400-e29b-41d4-a716-446655440001', 'license', 'Turkish Ministry of Health Operating License', 98765, 'Ministry of Health Turkey', '2020-03-10', NULL),
  ('550e8400-e29b-41d4-a716-446655440002', 'membership', 'Turkish Dental Association', 45678, 'TDA', '2018-05-20', NULL),
  ('550e8400-e29b-41d4-a716-446655440003', 'accreditation', 'TSAPS Membership', 87654, 'Turkish Society of Aesthetic Plastic Surgeons', '2019-07-01', NULL),
  ('550e8400-e29b-41d4-a716-446655440004', 'license', 'Turkish Ministry of Health Operating License', 11223, 'Ministry of Health Turkey', '2021-02-15', NULL);

-- ============================================
-- CLINIC LANGUAGES
-- ============================================

INSERT INTO clinic_languages (clinic_id, language, support_type)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Arabic', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Russian', 'translator'),
  ('550e8400-e29b-41d4-a716-446655440002', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440002', 'German', 'translator'),
  ('550e8400-e29b-41d4-a716-446655440003', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Spanish', 'on_request'),
  ('550e8400-e29b-41d4-a716-446655440004', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440004', 'French', 'translator');

-- ============================================
-- SOURCE DOCUMENTS
-- ============================================

INSERT INTO source_documents (source_id, doc_type, title, raw_text, language, published_at)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440001', 'html', 'About Istanbul Hair Masters', 'Istanbul Hair Masters has been performing hair transplants since 2009. We have completed over 15,000 successful procedures with our team of 5 specialist surgeons. All procedures use the latest FUE and DHI techniques.', 'English', '2024-01-15 10:00:00+00'),
  ('650e8400-e29b-41d4-a716-446655440002', 'review', 'Excellent hair transplant experience', 'I had my hair transplant at Istanbul Hair Masters in March 2024. The entire process was smooth from booking to aftercare. Dr. Mehmet was very professional and the results after 8 months are amazing! Highly recommend. Price was 2200 EUR for 3500 grafts all-inclusive.', 'English', '2024-11-20 14:30:00+00'),
  ('650e8400-e29b-41d4-a716-446655440003', 'post', 'Just got back from Istanbul - my experience', 'Wanted to share my experience with Istanbul Hair Masters. Had 4000 grafts done last week. The clinic was modern and clean, staff spoke perfect English. Hotel was decent, transfers were on time. Still early but hairline looks natural. Will update in 6 months.', 'English', '2025-01-05 18:45:00+00'),
  ('650e8400-e29b-41d4-a716-446655440004', 'review', 'Great dental work in Ankara', 'Got my All-on-4 implants at Ankara Smile. Dr. Ahmet and team were fantastic. Everything was explained clearly, no hidden costs. The temporary teeth look great and I can eat normally. Paid 5200 EUR total. Very happy with the choice!', 'English', '2024-12-10 09:15:00+00'),
  ('650e8400-e29b-41d4-a716-446655440005', 'html', 'Pricing - All-on-4 Implants', 'Our All-on-4 dental implant packages range from 4500 to 6000 EUR per arch. This includes consultation, surgery, temporary teeth, and all transfers. Final prosthesis is fitted after 3 months healing period.', 'English', '2024-11-01 12:00:00+00');

-- ============================================
-- CLINIC FACTS
-- ============================================

INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'years_in_operation', '15'::jsonb, 'number', 0.95, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'total_procedures_completed', '15000'::jsonb, 'number', 0.85, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'number_of_surgeons', '5'::jsonb, 'number', 0.90, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'techniques_offered', '["FUE", "DHI"]'::jsonb, 'json', 0.98, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'average_price_hair_transplant_eur', '2200'::jsonb, 'number', 0.75, 'model', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'response_time_hours', '4'::jsonb, 'number', 0.88, 'inquiry', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'specializes_in_all_on_4', 'true'::jsonb, 'bool', 0.92, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'price_transparency', 'true'::jsonb, 'bool', 0.95, 'human', false);

-- ============================================
-- FACT EVIDENCE
-- ============================================

INSERT INTO fact_evidence (clinic_fact_id, source_document_id, evidence_snippet, evidence_locator)
SELECT 
  cf.id,
  sd.id,
  'Istanbul Hair Masters has been performing hair transplants since 2009',
  '{"paragraph": 1, "sentence": 1}'::jsonb
FROM clinic_facts cf
CROSS JOIN source_documents sd
WHERE cf.fact_key = 'years_in_operation' 
  AND cf.clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND sd.source_id = '650e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

INSERT INTO fact_evidence (clinic_fact_id, source_document_id, evidence_snippet, evidence_locator)
SELECT 
  cf.id,
  sd.id,
  'We have completed over 15,000 successful procedures',
  '{"paragraph": 1, "sentence": 2}'::jsonb
FROM clinic_facts cf
CROSS JOIN source_documents sd
WHERE cf.fact_key = 'total_procedures_completed' 
  AND cf.clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND sd.source_id = '650e8400-e29b-41d4-a716-446655440001'
LIMIT 1;

INSERT INTO fact_evidence (clinic_fact_id, source_document_id, evidence_snippet, evidence_locator)
SELECT 
  cf.id,
  sd.id,
  'Our All-on-4 dental implant packages range from 4500 to 6000 EUR per arch',
  '{"paragraph": 1, "sentence": 1}'::jsonb
FROM clinic_facts cf
CROSS JOIN source_documents sd
WHERE cf.fact_key = 'price_transparency' 
  AND cf.clinic_id = '550e8400-e29b-41d4-a716-446655440002'
  AND sd.source_id = '650e8400-e29b-41d4-a716-446655440005'
LIMIT 1;

-- ============================================
-- CLINIC REVIEWS
-- ============================================

INSERT INTO clinic_reviews (clinic_id, source_id, rating, review_text, review_date, language)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', '5/5', 'I had my hair transplant at Istanbul Hair Masters in March 2024. The entire process was smooth from booking to aftercare. Dr. Mehmet was very professional and the results after 8 months are amazing! Highly recommend.', '2024-11-20', 'English'),
  ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', '5/5', 'Got my All-on-4 implants at Ankara Smile. Dr. Ahmet and team were fantastic. Everything was explained clearly, no hidden costs. The temporary teeth look great and I can eat normally. Very happy with the choice!', '2024-12-10', 'English');

-- ============================================
-- CLINIC MENTIONS (with new topic types)
-- ============================================

INSERT INTO clinic_mentions (clinic_id, source_id, mention_text, topic, sentiment)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'The clinic was modern and clean, staff spoke perfect English.', 'staff', 'positive'),
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Hotel was decent, transfers were on time.', 'logistics', 'positive'),
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Price was 2200 EUR for 3500 grafts all-inclusive.', 'pricing', 'neutral'),
  ('550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Still early but hairline looks natural.', 'results', 'positive'),
  ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', 'Everything was explained clearly, no hidden costs.', 'pricing', 'positive'),
  ('550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', 'Package price matched exactly what they quoted.', 'package_accuracy', 'positive');

-- ============================================
-- CLINIC SCORE COMPONENTS
-- ============================================

INSERT INTO clinic_score_components (clinic_id, component_key, score, weight, explanation)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'safety_credentials', 95, 0.30, 'JCI accredited facility with all required licenses'),
  ('550e8400-e29b-41d4-a716-446655440001', 'surgeon_qualifications', 88, 0.25, 'Experienced team with international certifications'),
  ('550e8400-e29b-41d4-a716-446655440001', 'patient_reviews', 92, 0.20, 'Consistently high ratings across multiple platforms'),
  ('550e8400-e29b-41d4-a716-446655440001', 'transparency', 85, 0.15, 'Clear pricing, comprehensive information available'),
  ('550e8400-e29b-41d4-a716-446655440001', 'aftercare_support', 90, 0.10, '1-year follow-up included in packages'),
  ('550e8400-e29b-41d4-a716-446655440002', 'safety_credentials', 82, 0.30, 'Licensed facility, professional association member'),
  ('550e8400-e29b-41d4-a716-446655440002', 'surgeon_qualifications', 85, 0.25, 'Qualified specialists with advanced training'),
  ('550e8400-e29b-41d4-a716-446655440002', 'patient_reviews', 90, 0.20, 'Excellent patient feedback'),
  ('550e8400-e29b-41d4-a716-446655440002', 'transparency', 92, 0.15, 'Outstanding price clarity and communication'),
  ('550e8400-e29b-41d4-a716-446655440002', 'aftercare_support', 80, 0.10, '90-day follow-up program');

-- ============================================
-- CLINIC SCORES
-- ============================================

INSERT INTO clinic_scores (clinic_id, overall_score, band, version)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 90, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440002', 86, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440003', 72, 'C', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440004', 78, 'B', 'v1.0');

-- ============================================
-- ADDITIONAL SOURCES FOR MEDIA TRACKING
-- ============================================

INSERT INTO sources (id, source_type, source_name, url, author_handle, content_hash)
VALUES
  ('650e8400-e29b-41d4-a716-446655440008', 'clinic_website', 'Bodrum Aesthetic Media Gallery', 'https://bodrumaesthetic.com/gallery', NULL, 'hash_ba_gallery_001'),
  ('650e8400-e29b-41d4-a716-446655440009', 'clinic_website', 'Izmir Cosmetic Instagram Bio Link', 'https://linktr.ee/izmircosmetic', NULL, 'hash_ic_linktree_001'),
  ('650e8400-e29b-41d4-a716-446655440010', 'social_media', 'YouTube', 'https://youtube.com/@IstanbulHairMastersTurkey', 'IstanbulHairMastersTurkey', 'hash_yt_ihm_001');

-- ============================================
-- CLINIC SOCIAL MEDIA
-- ============================================

INSERT INTO clinic_social_media (clinic_id, platform, account_handle, follower_count, verified, last_checked_at)
VALUES
  -- Istanbul Hair Masters (550e8400-e29b-41d4-a716-446655440001)
  ('550e8400-e29b-41d4-a716-446655440001', 'instagram', 'istanbulhairmasters', 45000, true, '2025-02-10 15:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'youtube', 'IstanbulHairMastersTurkey', 12000, false, '2025-02-10 15:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'facebook', 'istanbulhairmasters', 8500, false, '2025-02-10 15:30:00+00'),

  -- Ankara Smile Dental Clinic (550e8400-e29b-41d4-a716-446655440002)
  ('550e8400-e29b-41d4-a716-446655440002', 'instagram', 'ankarasmiledental', 28000, false, '2025-02-09 10:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'youtube', 'AnkaraSmileDentalClinic', 6800, false, '2025-02-09 10:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'tiktok', 'ankarasmiledental', 15000, false, '2025-02-09 10:15:00+00'),

  -- Bodrum Aesthetic Surgery (550e8400-e29b-41d4-a716-446655440003)
  ('550e8400-e29b-41d4-a716-446655440003', 'instagram', 'bodrumaesthetic', 38000, true, '2025-02-08 14:20:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'tiktok', 'bodrumaesthetic', 22000, false, '2025-02-08 14:20:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'youtube', 'BodrumAestheticSurgery', 4200, false, '2025-02-08 14:20:00+00'),

  -- Izmir Cosmetic Center (550e8400-e29b-41d4-a716-446655440004)
  ('550e8400-e29b-41d4-a716-446655440004', 'instagram', 'izmircosmetic', 19000, false, '2025-02-07 09:45:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'facebook', 'izmircosmetic', 5300, false, '2025-02-07 09:45:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'youtube', 'IzmirCosmeticCenter', 2100, false, '2025-02-07 09:45:00+00');

-- ============================================
-- CLINIC MEDIA
-- ============================================

INSERT INTO clinic_media (clinic_id, media_type, url, alt_text, caption, is_primary, display_order, source_id, uploaded_at)
VALUES
  -- Istanbul Hair Masters (550e8400-e29b-41d4-a716-446655440001) - 6 items
  ('550e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.istanbulhairmasters.com/facility-exterior.jpg', 'Istanbul Hair Masters clinic exterior in Nisantasi district', 'Our state-of-the-art facility in the heart of Istanbul', true, 1, '650e8400-e29b-41d4-a716-446655440001', '2024-11-15 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'before_after', 'https://images.istanbulhairmasters.com/results/fue-3500-grafts-ba.jpg', 'Before and after FUE hair transplant 3500 grafts', '8 months post-procedure - 3500 grafts FUE technique', false, 2, '650e8400-e29b-41d4-a716-446655440007', '2024-12-01 14:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'before_after', 'https://images.istanbulhairmasters.com/results/dhi-4000-grafts-ba.jpg', 'Before and after DHI hair transplant 4000 grafts', '12 months post-procedure - DHI premium technique', false, 3, '650e8400-e29b-41d4-a716-446655440007', '2025-01-10 09:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'certificate', 'https://images.istanbulhairmasters.com/certificates/jci-accreditation.pdf', 'JCI Accreditation Certificate 2023-2026', 'Joint Commission International Accreditation', false, 4, '650e8400-e29b-41d4-a716-446655440001', '2023-01-20 08:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'video', 'https://videos.istanbulhairmasters.com/facility-tour.mp4', 'Virtual tour of Istanbul Hair Masters facility', 'Take a virtual tour of our clinic and meet our team', false, 5, '650e8400-e29b-41d4-a716-446655440001', '2024-10-05 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.istanbulhairmasters.com/team/dr-mehmet-yilmaz.jpg', 'Dr. Mehmet Yilmaz, Medical Director', 'Our Medical Director, Dr. Mehmet Yilmaz - 15 years experience', false, 6, '650e8400-e29b-41d4-a716-446655440001', '2024-09-12 11:00:00+00'),

  -- Ankara Smile Dental Clinic (550e8400-e29b-41d4-a716-446655440002) - 5 items
  ('550e8400-e29b-41d4-a716-446655440002', 'image', 'https://images.ankarasmiledental.com/clinic-reception.jpg', 'Modern reception area at Ankara Smile Dental Clinic', 'Welcome to Ankara Smile - your dental tourism destination', true, 1, '650e8400-e29b-41d4-a716-446655440005', '2024-10-20 09:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'before_after', 'https://images.ankarasmiledental.com/results/all-on-4-patient-1.jpg', 'Before and after All-on-4 dental implants', 'Complete smile transformation with All-on-4 implants', false, 2, '650e8400-e29b-41d4-a716-446655440004', '2024-12-15 13:20:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'before_after', 'https://images.ankarasmiledental.com/results/veneers-smile-makeover.jpg', 'Before and after porcelain veneers smile makeover', 'Hollywood smile makeover with premium veneers', false, 3, '650e8400-e29b-41d4-a716-446655440004', '2025-01-08 10:45:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'image', 'https://images.ankarasmiledental.com/equipment/digital-scanner.jpg', 'State-of-the-art digital dental scanner', 'Latest technology for precise dental work', false, 4, '650e8400-e29b-41d4-a716-446655440005', '2024-11-03 14:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'certificate', 'https://images.ankarasmiledental.com/certificates/tda-membership.pdf', 'Turkish Dental Association Membership Certificate', 'Member of Turkish Dental Association since 2018', false, 5, '650e8400-e29b-41d4-a716-446655440005', '2018-05-25 08:00:00+00'),

  -- Bodrum Aesthetic Surgery (550e8400-e29b-41d4-a716-446655440003) - 5 items
  ('550e8400-e29b-41d4-a716-446655440003', 'image', 'https://images.bodrumaesthetic.com/clinic-exterior-beach.jpg', 'Bodrum Aesthetic Surgery clinic near the beach', 'Combine your aesthetic journey with a beautiful vacation', true, 1, '650e8400-e29b-41d4-a716-446655440008', '2024-09-15 11:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'before_after', 'https://images.bodrumaesthetic.com/results/rhinoplasty-patient-3.jpg', 'Before and after rhinoplasty procedure', 'Natural-looking rhinoplasty results by Dr. Can Yildirim', false, 2, '650e8400-e29b-41d4-a716-446655440008', '2024-11-28 15:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'before_after', 'https://images.bodrumaesthetic.com/results/breast-augmentation-1.jpg', 'Before and after breast augmentation', 'Breast augmentation with natural results', false, 3, '650e8400-e29b-41d4-a716-446655440008', '2024-12-20 09:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'video', 'https://videos.bodrumaesthetic.com/patient-testimonial-en.mp4', 'Patient testimonial video - English speaking patient', 'Hear from our satisfied international patients', false, 4, '650e8400-e29b-41d4-a716-446655440008', '2025-01-05 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'certificate', 'https://images.bodrumaesthetic.com/certificates/tsaps-membership.pdf', 'TSAPS Membership Certificate', 'Turkish Society of Aesthetic Plastic Surgeons member', false, 5, '650e8400-e29b-41d4-a716-446655440008', '2019-07-10 08:00:00+00'),

  -- Izmir Cosmetic Center (550e8400-e29b-41d4-a716-446655440004) - 4 items
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.izmircosmetic.com/clinic-treatment-room.jpg', 'Modern treatment room at Izmir Cosmetic Center', 'Advanced cosmetic procedures in a comfortable setting', true, 1, '650e8400-e29b-41d4-a716-446655440009', '2024-10-01 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'before_after', 'https://images.izmircosmetic.com/results/liposuction-abdomen.jpg', 'Before and after liposuction abdomen area', 'Effective body contouring with liposuction', false, 2, '650e8400-e29b-41d4-a716-446655440009', '2024-12-05 14:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.izmircosmetic.com/team-photo.jpg', 'Izmir Cosmetic Center medical team', 'Our experienced team of aesthetic specialists', false, 3, '650e8400-e29b-41d4-a716-446655440009', '2024-11-10 09:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.izmircosmetic.com/recovery-lounge.jpg', 'Comfortable recovery lounge area', 'Relax in our post-procedure recovery area', false, 4, '650e8400-e29b-41d4-a716-446655440009', '2024-10-18 11:30:00+00');
-- ADDITIONAL SEED CLINICS (for pagination testing)
-- ============================================

INSERT INTO clinics (id, display_name, legal_name, status, primary_city, primary_country, website_url, whatsapp_contact, email_contact, phone_contact)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Istanbul Specialty Clinic 1', 'Istanbul Specialty Clinic 1 Health Services Ltd', 'active', 'Istanbul', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440101', 'Ankara Specialty Clinic 2', 'Ankara Specialty Clinic 2 Health Services Ltd', 'active', 'Ankara', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440102', 'Izmir Specialty Clinic 3', 'Izmir Specialty Clinic 3 Health Services Ltd', 'active', 'Izmir', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440103', 'Antalya Specialty Clinic 4', 'Antalya Specialty Clinic 4 Health Services Ltd', 'active', 'Antalya', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440104', 'Bursa Specialty Clinic 5', 'Bursa Specialty Clinic 5 Health Services Ltd', 'active', 'Bursa', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440105', 'Adana Specialty Clinic 6', 'Adana Specialty Clinic 6 Health Services Ltd', 'active', 'Adana', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440106', 'Konya Specialty Clinic 7', 'Konya Specialty Clinic 7 Health Services Ltd', 'active', 'Konya', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440107', 'Gaziantep Specialty Clinic 8', 'Gaziantep Specialty Clinic 8 Health Services Ltd', 'active', 'Gaziantep', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440108', 'Mersin Specialty Clinic 9', 'Mersin Specialty Clinic 9 Health Services Ltd', 'active', 'Mersin', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440109', 'Kayseri Specialty Clinic 10', 'Kayseri Specialty Clinic 10 Health Services Ltd', 'active', 'Kayseri', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440110', 'Istanbul Specialty Clinic 11', 'Istanbul Specialty Clinic 11 Health Services Ltd', 'active', 'Istanbul', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440111', 'Ankara Specialty Clinic 12', 'Ankara Specialty Clinic 12 Health Services Ltd', 'active', 'Ankara', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440112', 'Izmir Specialty Clinic 13', 'Izmir Specialty Clinic 13 Health Services Ltd', 'active', 'Izmir', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440113', 'Antalya Specialty Clinic 14', 'Antalya Specialty Clinic 14 Health Services Ltd', 'active', 'Antalya', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440114', 'Bursa Specialty Clinic 15', 'Bursa Specialty Clinic 15 Health Services Ltd', 'active', 'Bursa', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440115', 'Adana Specialty Clinic 16', 'Adana Specialty Clinic 16 Health Services Ltd', 'active', 'Adana', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440116', 'Konya Specialty Clinic 17', 'Konya Specialty Clinic 17 Health Services Ltd', 'active', 'Konya', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440117', 'Gaziantep Specialty Clinic 18', 'Gaziantep Specialty Clinic 18 Health Services Ltd', 'active', 'Gaziantep', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440118', 'Mersin Specialty Clinic 19', 'Mersin Specialty Clinic 19 Health Services Ltd', 'active', 'Mersin', 'Turkey', NULL, NULL, NULL, NULL),
  ('550e8400-e29b-41d4-a716-446655440119', 'Kayseri Specialty Clinic 20', 'Kayseri Specialty Clinic 20 Health Services Ltd', 'active', 'Kayseri', 'Turkey', NULL, NULL, NULL, NULL);

INSERT INTO clinic_services (clinic_id, service_category, service_name, is_primary_service)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440101', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440102', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440103', 'Other', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440104', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440105', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440106', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440107', 'Other', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440108', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440109', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440110', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440111', 'Other', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440112', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440113', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440114', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440115', 'Other', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440116', 'Medical Tourism', 'Hair Transplant', true),
  ('550e8400-e29b-41d4-a716-446655440117', 'Dental', 'Other', true),
  ('550e8400-e29b-41d4-a716-446655440118', 'Cosmetic', 'Rhinoplasty', true),
  ('550e8400-e29b-41d4-a716-446655440119', 'Other', 'Other', true);

INSERT INTO clinic_languages (clinic_id, language, support_type)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440100', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440101', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440102', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440103', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440103', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440104', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440105', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440106', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440106', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440107', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440108', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440109', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440109', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440110', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440111', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440112', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440112', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440113', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440114', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440115', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440115', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440116', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440117', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440118', 'English', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440118', 'German', 'staff'),
  ('550e8400-e29b-41d4-a716-446655440119', 'English', 'staff');

INSERT INTO clinic_scores (clinic_id, overall_score, band, version)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 70, 'C', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440101', 75, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440102', 80, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440103', 85, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440104', 90, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440105', 95, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440106', 70, 'C', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440107', 75, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440108', 80, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440109', 85, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440110', 90, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440111', 95, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440112', 70, 'C', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440113', 75, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440114', 80, 'B', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440115', 85, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440116', 90, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440117', 95, 'A', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440118', 70, 'C', 'v1.0'),
  ('550e8400-e29b-41d4-a716-446655440119', 75, 'B', 'v1.0');

INSERT INTO clinic_media (clinic_id, media_type, url, alt_text, caption, is_primary, display_order)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440101', 'image', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440102', 'image', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440103', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440104', 'image', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440105', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440106', 'image', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440107', 'image', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440108', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440109', 'image', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440110', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440111', 'image', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440112', 'image', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440113', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440114', 'image', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440115', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440116', 'image', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440117', 'image', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440118', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0),
  ('550e8400-e29b-41d4-a716-446655440119', 'image', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Clinic interior', 'Lobby', true, 0);

-- ============================================
-- SCHEMA ENHANCEMENTS - Opening Hours, Payment Methods, Photos, Statistics
-- ============================================

-- Update clinic_locations with opening hours and payment methods
UPDATE clinic_locations SET
  opening_hours = '{
    "monday": {"open": "09:00", "close": "18:00"},
    "tuesday": {"open": "09:00", "close": "18:00"},
    "wednesday": {"open": "09:00", "close": "18:00"},
    "thursday": {"open": "09:00", "close": "18:00"},
    "friday": {"open": "09:00", "close": "17:00"},
    "saturday": {"open": "10:00", "close": "14:00"},
    "sunday": null
  }'::jsonb,
  payment_methods = ARRAY['Cash', 'Credit Card', 'Bank Transfer', 'Insurance']
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE clinic_locations SET
  opening_hours = '{
    "monday": {"open": "08:30", "close": "19:00"},
    "tuesday": {"open": "08:30", "close": "19:00"},
    "wednesday": {"open": "08:30", "close": "19:00"},
    "thursday": {"open": "08:30", "close": "19:00"},
    "friday": {"open": "08:30", "close": "18:00"},
    "saturday": {"open": "09:00", "close": "15:00"},
    "sunday": null
  }'::jsonb,
  payment_methods = ARRAY['Cash', 'Credit Card', 'Bank Transfer']
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE clinic_locations SET
  opening_hours = '{
    "monday": {"open": "10:00", "close": "18:00"},
    "tuesday": {"open": "10:00", "close": "18:00"},
    "wednesday": {"open": "10:00", "close": "18:00"},
    "thursday": {"open": "10:00", "close": "18:00"},
    "friday": {"open": "10:00", "close": "17:00"},
    "saturday": {"open": "10:00", "close": "14:00"},
    "sunday": null
  }'::jsonb,
  payment_methods = ARRAY['Cash', 'Credit Card', 'Bank Transfer', 'Cryptocurrency']
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440003';

UPDATE clinic_locations SET
  opening_hours = '{
    "monday": {"open": "09:00", "close": "17:30"},
    "tuesday": {"open": "09:00", "close": "17:30"},
    "wednesday": {"open": "09:00", "close": "17:30"},
    "thursday": {"open": "09:00", "close": "17:30"},
    "friday": {"open": "09:00", "close": "17:00"},
    "saturday": null,
    "sunday": null
  }'::jsonb,
  payment_methods = ARRAY['Cash', 'Credit Card', 'Bank Transfer']
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440004';

-- Update clinic_team with photo URLs (using placeholder professional headshot images)
UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Mehmet Yilmaz';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Ayse Kaya';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Elif Demir';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Ahmet Ozturk';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Zeynep Arslan';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Can Yildirim';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Sara Johnson';

UPDATE clinic_team SET photo_url = 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
WHERE name = 'Dr. Emre Celik';

-- Update clinics with statistics (years in operation and procedures performed)
UPDATE clinics SET
  years_in_operation = 15,
  procedures_performed = 50000
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE clinics SET
  years_in_operation = 12,
  procedures_performed = 25000
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

UPDATE clinics SET
  years_in_operation = 8,
  procedures_performed = 12000
WHERE id = '550e8400-e29b-41d4-a716-446655440003';

UPDATE clinics SET
  years_in_operation = 10,
  procedures_performed = 18000
WHERE id = '550e8400-e29b-41d4-a716-446655440004';

-- ============================================
-- ENHANCED SEED FOR ADDITIONAL CLINICS
-- Add location + hours/payments + team photos + stats for pagination clinics
-- ============================================

-- Add one primary location per additional seeded clinic
INSERT INTO clinic_locations (
  clinic_id,
  location_name,
  address_line,
  city,
  country,
  postal_code,
  latitude,
  longitude,
  is_primary,
  opening_hours,
  payment_methods
)
SELECT
  c.id,
  c.display_name || ' Main Location',
  'Ataturk Blvd. No:' || ((idx % 80) + 10) || ', Central District',
  c.primary_city,
  c.primary_country,
  LPAD((30000 + idx)::text, 5, '0'),
  (36.9000 + (idx * 0.05)),
  (27.0000 + (idx * 0.06)),
  true,
  CASE
    WHEN idx % 4 = 0 THEN '{
      "monday": {"open": "09:00", "close": "18:00"},
      "tuesday": {"open": "09:00", "close": "18:00"},
      "wednesday": {"open": "09:00", "close": "18:00"},
      "thursday": {"open": "09:00", "close": "18:00"},
      "friday": {"open": "09:00", "close": "17:00"},
      "saturday": {"open": "10:00", "close": "14:00"},
      "sunday": null
    }'::jsonb
    WHEN idx % 4 = 1 THEN '{
      "monday": {"open": "08:30", "close": "19:00"},
      "tuesday": {"open": "08:30", "close": "19:00"},
      "wednesday": {"open": "08:30", "close": "19:00"},
      "thursday": {"open": "08:30", "close": "19:00"},
      "friday": {"open": "08:30", "close": "18:00"},
      "saturday": {"open": "09:00", "close": "15:00"},
      "sunday": null
    }'::jsonb
    WHEN idx % 4 = 2 THEN '{
      "monday": {"open": "10:00", "close": "18:00"},
      "tuesday": {"open": "10:00", "close": "18:00"},
      "wednesday": {"open": "10:00", "close": "18:00"},
      "thursday": {"open": "10:00", "close": "18:00"},
      "friday": {"open": "10:00", "close": "17:00"},
      "saturday": null,
      "sunday": null
    }'::jsonb
    ELSE '{
      "monday": {"open": "09:30", "close": "17:30"},
      "tuesday": {"open": "09:30", "close": "17:30"},
      "wednesday": {"open": "09:30", "close": "17:30"},
      "thursday": {"open": "09:30", "close": "17:30"},
      "friday": {"open": "09:30", "close": "16:30"},
      "saturday": {"open": "10:00", "close": "13:00"},
      "sunday": null
    }'::jsonb
  END,
  CASE
    WHEN idx % 3 = 0 THEN ARRAY['Cash', 'Credit Card', 'Bank Transfer', 'Insurance']
    WHEN idx % 3 = 1 THEN ARRAY['Cash', 'Credit Card', 'Bank Transfer']
    ELSE ARRAY['Cash', 'Credit Card', 'Bank Transfer', 'Cryptocurrency']
  END
FROM (
  SELECT id, display_name, primary_city, primary_country, ROW_NUMBER() OVER (ORDER BY id) AS idx
  FROM clinics
  WHERE id >= '550e8400-e29b-41d4-a716-446655440100'
    AND id <= '550e8400-e29b-41d4-a716-446655440119'
) c
WHERE NOT EXISTS (
  SELECT 1
  FROM clinic_locations cl
  WHERE cl.clinic_id = c.id
    AND cl.is_primary = true
);

-- Add team members (doctor + coordinator) with photos for additional clinics
INSERT INTO clinic_team (
  clinic_id,
  role,
  name,
  credentials,
  years_experience,
  doctor_involvement_level,
  photo_url
)
SELECT
  c.id,
  'doctor'::clinic_roles,
  'Dr. ' || split_part(c.display_name, ' Specialty', 1),
  'MD, International Patient Care Specialist',
  6 + (idx % 12),
  CASE
    WHEN idx % 3 = 0 THEN 'high'
    WHEN idx % 3 = 1 THEN 'medium'
    ELSE 'low'
  END::doctor_involvement_levels,
  CASE
    WHEN idx % 4 = 0 THEN 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
    WHEN idx % 4 = 1 THEN 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
    WHEN idx % 4 = 2 THEN 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
    ELSE 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
  END
FROM (
  SELECT id, display_name, ROW_NUMBER() OVER (ORDER BY id) AS idx
  FROM clinics
  WHERE id >= '550e8400-e29b-41d4-a716-446655440100'
    AND id <= '550e8400-e29b-41d4-a716-446655440119'
) c
WHERE NOT EXISTS (
  SELECT 1
  FROM clinic_team t
  WHERE t.clinic_id = c.id
    AND t.role = 'doctor'::clinic_roles
);

INSERT INTO clinic_team (
  clinic_id,
  role,
  name,
  credentials,
  years_experience,
  doctor_involvement_level,
  photo_url
)
SELECT
  c.id,
  'coordinator'::clinic_roles,
  'Coordinator ' || c.idx,
  'International Patient Coordinator',
  2 + (idx % 6),
  'medium'::doctor_involvement_levels,
  CASE
    WHEN idx % 2 = 0 THEN 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
    ELSE 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400'
  END
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS idx
  FROM clinics
  WHERE id >= '550e8400-e29b-41d4-a716-446655440100'
    AND id <= '550e8400-e29b-41d4-a716-446655440119'
) c
WHERE NOT EXISTS (
  SELECT 1
  FROM clinic_team t
  WHERE t.clinic_id = c.id
    AND t.role = 'coordinator'::clinic_roles
);

-- Add clinic-level statistics for additional clinics
UPDATE clinics c
SET
  years_in_operation = 5 + x.idx,
  procedures_performed = 6000 + (x.idx * 1100)
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS idx
  FROM clinics
  WHERE id >= '550e8400-e29b-41d4-a716-446655440100'
    AND id <= '550e8400-e29b-41d4-a716-446655440119'
) x
WHERE c.id = x.id;