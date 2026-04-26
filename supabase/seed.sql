-- Seed data for IstanbulMedic-Connect
-- Run automatically when you execute: supabase db reset
--
-- Local clinic data is seeded from production via:
--   npx tsx scripts/seedLocalDb.ts


-- ============================================
-- CLINICS
-- ============================================

INSERT INTO clinics (id, display_name, legal_name, status, primary_city, primary_country, website_url, whatsapp_contact, email_contact, phone_contact)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 'Istanbul Hair Masters', 'Istanbul Hair Masters Medical Tourism Ltd', 'active', 'Istanbul', 'Turkey', 'https://istanbulhairmasters.com', '+905551234567', 'info@istanbulhairmasters.com', '+902121234567'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Ankara Smile Dental Clinic', 'Ankara Smile Dental Center Inc', 'active', 'Ankara', 'Turkey', 'https://ankarasmiledental.com', '+905552345678', 'contact@ankarasmiledental.com', '+903121234567'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Bodrum Aesthetic Surgery', 'Bodrum Aesthetic Medical Ltd', 'under_review', 'Bodrum', 'Turkey', 'https://bodrumaesthetic.com', '+905553456789', 'hello@bodrumaesthetic.com', '+902521234567'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Izmir Cosmetic Center', 'Izmir Cosmetic Healthcare Inc', 'active', 'Izmir', 'Turkey', NULL, '+905554567890', 'info@izmircosmetic.com', '+902321234567'),
  ('550e8400-e29b-41d4-a716-446655440005', 'AEK Hair Clinic', 'AEK Hair Clinic - Dr. Ali Emre Karadeniz', 'active', 'Istanbul', 'Turkey', 'https://www.aekhairclinic.com', '+905432154320', NULL, NULL);

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
-- CLINIC GOOGLE PLACES (for rating sorting)
-- ============================================

INSERT INTO clinic_google_places (clinic_id, place_id, rating, user_ratings_total, last_checked_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'ChIJ_fake_place_id_001', 4.8, 2341, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'ChIJ_fake_place_id_002', 4.6, 1876, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'ChIJ_fake_place_id_003', 4.2, 543, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'ChIJ_fake_place_id_004', 4.5, 892, '2025-03-01 12:00:00+00');

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
  ('550e8400-e29b-41d4-a716-446655440004', 'youtube', 'IzmirCosmeticCenter', 2100, false, '2025-02-07 09:45:00+00'),

  -- AEK Hair Clinic (550e8400-e29b-41d4-a716-446655440005) - Real scraped data, Creator account example
  ('550e8400-e29b-41d4-a716-446655440005', 'instagram', 'draliemrekaradeniz', 13892, false, '2026-03-25 00:37:00+00');

-- ============================================
-- UPDATE INSTAGRAM WITH EXTENDED PROFILE DATA
-- (for testing Instagram section rendering)
-- ============================================

UPDATE clinic_social_media SET
  full_name = 'Istanbul Hair Masters',
  biography = '🏆 JCI Accredited Hair Transplant Clinic
📍 Istanbul, Turkey
✨ 15+ years experience | 50,000+ procedures
🌍 Serving patients worldwide
📞 Free consultation',
  profile_pic_url = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=150&w=150',
  external_urls = ARRAY['https://istanbulhairmasters.com', 'https://linktr.ee/istanbulhairmasters'],
  follows_count = 342,
  posts_count = 856,
  highlights_count = 12,
  is_private = false,
  business_category = 'Medical & Health'
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND platform = 'instagram';

-- AEK Hair Clinic - Creator account (has business_category but isBusinessAccount=false)
UPDATE clinic_social_media SET
  full_name = 'AEK Hair Clinic - Dr. Ali Emre Karadeniz',
  biography = 'www.aekhairclinic.com
📱💬 +90 543 215 43 20
👇Our WhatsApp👇',
  profile_pic_url = 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=150&w=150',
  external_urls = ARRAY['https://api.whatsapp.com/send/?phone=905432154320&text=ISawYouOnInstagram'],
  follows_count = 138,
  posts_count = 133,
  highlights_count = 7,
  is_private = false,
  business_category = 'Hair Replacement Service'
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440005'
  AND platform = 'instagram';

-- ============================================
-- CLINIC MEDIA
-- ============================================

INSERT INTO clinic_media (clinic_id, media_type, url, alt_text, caption, is_primary, display_order, source_id, uploaded_at)
VALUES
  -- Istanbul Hair Masters (550e8400-e29b-41d4-a716-446655440001) - 6 items
  ('550e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Istanbul Hair Masters clinic exterior in Nisantasi district', 'Our state-of-the-art facility in the heart of Istanbul', true, 1, '650e8400-e29b-41d4-a716-446655440001', '2024-11-15 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'before_after', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after FUE hair transplant 3500 grafts', '8 months post-procedure - 3500 grafts FUE technique', false, 2, '650e8400-e29b-41d4-a716-446655440007', '2024-12-01 14:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'before_after', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after DHI hair transplant 4000 grafts', '12 months post-procedure - DHI premium technique', false, 3, '650e8400-e29b-41d4-a716-446655440007', '2025-01-10 09:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'certificate', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'JCI Accreditation Certificate 2023-2026', 'Joint Commission International Accreditation', false, 4, '650e8400-e29b-41d4-a716-446655440001', '2023-01-20 08:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'video', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Virtual tour of Istanbul Hair Masters facility', 'Take a virtual tour of our clinic and meet our team', false, 5, '650e8400-e29b-41d4-a716-446655440001', '2024-10-05 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440001', 'image', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=400&w=400', 'Dr. Mehmet Yilmaz, Medical Director', 'Our Medical Director, Dr. Mehmet Yilmaz - 15 years experience', false, 6, '650e8400-e29b-41d4-a716-446655440001', '2024-09-12 11:00:00+00'),

  -- Ankara Smile Dental Clinic (550e8400-e29b-41d4-a716-446655440002) - 5 items
  ('550e8400-e29b-41d4-a716-446655440002', 'image', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Modern reception area at Ankara Smile Dental Clinic', 'Welcome to Ankara Smile - your dental tourism destination', true, 1, '650e8400-e29b-41d4-a716-446655440005', '2024-10-20 09:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'before_after', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after All-on-4 dental implants', 'Complete smile transformation with All-on-4 implants', false, 2, '650e8400-e29b-41d4-a716-446655440004', '2024-12-15 13:20:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'before_after', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after porcelain veneers smile makeover', 'Hollywood smile makeover with premium veneers', false, 3, '650e8400-e29b-41d4-a716-446655440004', '2025-01-08 10:45:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'State-of-the-art digital dental scanner', 'Latest technology for precise dental work', false, 4, '650e8400-e29b-41d4-a716-446655440005', '2024-11-03 14:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440002', 'certificate', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Turkish Dental Association Membership Certificate', 'Member of Turkish Dental Association since 2018', false, 5, '650e8400-e29b-41d4-a716-446655440005', '2018-05-25 08:00:00+00'),

  -- Bodrum Aesthetic Surgery (550e8400-e29b-41d4-a716-446655440003) - 5 items
  ('550e8400-e29b-41d4-a716-446655440003', 'image', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Bodrum Aesthetic Surgery clinic near the beach', 'Combine your aesthetic journey with a beautiful vacation', true, 1, '650e8400-e29b-41d4-a716-446655440008', '2024-09-15 11:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'before_after', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after rhinoplasty procedure', 'Natural-looking rhinoplasty results by Dr. Can Yildirim', false, 2, '650e8400-e29b-41d4-a716-446655440008', '2024-11-28 15:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'before_after', 'https://images.unsplash.com/photo-1766299892549-b56b257d1ddd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after breast augmentation', 'Breast augmentation with natural results', false, 3, '650e8400-e29b-41d4-a716-446655440008', '2024-12-20 09:30:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'video', 'https://images.unsplash.com/photo-1504439468489-c8920d796a29?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Patient testimonial video - English speaking patient', 'Hear from our satisfied international patients', false, 4, '650e8400-e29b-41d4-a716-446655440008', '2025-01-05 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440003', 'certificate', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'TSAPS Membership Certificate', 'Turkish Society of Aesthetic Plastic Surgeons member', false, 5, '650e8400-e29b-41d4-a716-446655440008', '2019-07-10 08:00:00+00'),

  -- Izmir Cosmetic Center (550e8400-e29b-41d4-a716-446655440004) - 4 items
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.unsplash.com/photo-1758653500534-a47f6cd8abb0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Modern treatment room at Izmir Cosmetic Center', 'Advanced cosmetic procedures in a comfortable setting', true, 1, '650e8400-e29b-41d4-a716-446655440009', '2024-10-01 10:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'before_after', 'https://images.unsplash.com/photo-1526256262350-7da7584cf5eb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Before and after liposuction abdomen area', 'Effective body contouring with liposuction', false, 2, '650e8400-e29b-41d4-a716-446655440009', '2024-12-05 14:15:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Izmir Cosmetic Center medical team', 'Our experienced team of aesthetic specialists', false, 3, '650e8400-e29b-41d4-a716-446655440009', '2024-11-10 09:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440004', 'image', 'https://images.unsplash.com/photo-1565262353342-6e919eab5b58?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1600', 'Comfortable recovery lounge area', 'Relax in our post-procedure recovery area', false, 4, '650e8400-e29b-41d4-a716-446655440009', '2024-10-18 11:30:00+00');
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

-- Google Places data for pagination test clinics (varied ratings for sorting tests)
INSERT INTO clinic_google_places (clinic_id, place_id, rating, user_ratings_total, last_checked_at)
VALUES
  ('550e8400-e29b-41d4-a716-446655440100', 'ChIJ_fake_place_id_100', 3.9, 156, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440101', 'ChIJ_fake_place_id_101', 4.7, 892, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440102', 'ChIJ_fake_place_id_102', 4.3, 445, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440103', 'ChIJ_fake_place_id_103', 4.9, 1203, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440104', 'ChIJ_fake_place_id_104', 4.1, 278, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440105', 'ChIJ_fake_place_id_105', 4.4, 567, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440106', 'ChIJ_fake_place_id_106', 3.8, 89, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440107', 'ChIJ_fake_place_id_107', 4.6, 734, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440108', 'ChIJ_fake_place_id_108', 4.0, 321, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440109', 'ChIJ_fake_place_id_109', 4.8, 1567, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440110', 'ChIJ_fake_place_id_110', 4.2, 423, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440111', 'ChIJ_fake_place_id_111', 4.5, 654, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440112', 'ChIJ_fake_place_id_112', 3.7, 112, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440113', 'ChIJ_fake_place_id_113', 4.4, 489, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440114', 'ChIJ_fake_place_id_114', 4.1, 234, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440115', 'ChIJ_fake_place_id_115', 4.7, 876, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440116', 'ChIJ_fake_place_id_116', 4.3, 398, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440117', 'ChIJ_fake_place_id_117', 4.9, 1432, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440118', 'ChIJ_fake_place_id_118', 3.6, 67, '2025-03-01 12:00:00+00'),
  ('550e8400-e29b-41d4-a716-446655440119', 'ChIJ_fake_place_id_119', 4.0, 198, '2025-03-01 12:00:00+00');

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

-- ============================================
-- REDDIT SIGNALS MOCK DATA
-- Requires migration: docs/plans/forums/20260409000000_create_forum_scraping_tables.sql
-- Tables: forum_thread_index, reddit_thread_content, forum_thread_signals,
--         forum_thread_llm_analysis, clinic_forum_profiles
-- ============================================

-- Subreddit-level sources
INSERT INTO sources (id, source_type, source_name, url, author_handle, content_hash)
VALUES
  ('750e8400-e29b-41d4-a716-446655440001', 'reddit', 'r/HairTransplants', 'https://reddit.com/r/HairTransplants', NULL, 'hash_reddit_sub_hairtransplants'),
  ('750e8400-e29b-41d4-a716-446655440002', 'reddit', 'r/TurkeyHairTransplant', 'https://reddit.com/r/TurkeyHairTransplant', NULL, 'hash_reddit_sub_turkeyht');

-- ============================================
-- FORUM THREAD INDEX (hub — one row per thread)
-- ============================================

INSERT INTO forum_thread_index (id, clinic_id, source_id, forum_source, thread_url, title, author_username, post_date, reply_count, clinic_attribution_method, first_scraped_at, last_scraped_at)
VALUES
  -- Istanbul Hair Masters (6 threads across positive / mixed / negative scenarios)
  ('860e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'reddit', 'https://reddit.com/r/HairTransplants/comments/abc001', 'Just hit 12 months post-op with Istanbul Hair Masters — full review + photos', 'u/GrowingBackSlowly', '2025-10-14 18:32:00+00', 47, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'reddit', 'https://reddit.com/r/TurkeyHairTransplant/comments/abc002', '6 month update — Istanbul Hair Masters DHI 4000 grafts, honestly impressed', 'u/NorwoodRecovery', '2025-12-03 11:20:00+00', 28, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'reddit', 'https://reddit.com/r/HairTransplants/comments/abc003', 'Istanbul Hair Masters experience — shock loss hit hard but growing in now at 4 months', 'u/ShockedButOptimistic', '2026-01-08 09:45:00+00', 31, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440002', 'reddit', 'https://reddit.com/r/TurkeyHairTransplant/comments/abc004', 'Istanbul Hair Masters vs Vera Clinic — made my decision (going IHM)', 'u/ResearchingForMonths', '2026-02-17 14:10:00+00', 19, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'reddit', 'https://reddit.com/r/HairTransplants/comments/abc005', 'Worth flying to Istanbul? My IHM experience 8 months in', 'u/BritWithNewHair', '2025-09-22 16:55:00+00', 62, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', 'reddit', 'https://reddit.com/r/HairTransplants/comments/abc006', 'Not happy with my hairline design — Istanbul Hair Masters 6 months post', 'u/HairlineDisappointed', '2025-11-30 20:18:00+00', 24, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),

  -- AEK Hair Clinic (3 threads — small dataset, mixed signal)
  ('860e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002', 'reddit', 'https://reddit.com/r/TurkeyHairTransplant/comments/aek001', 'AEK Hair Clinic 8 month update — Dr. Ali Emre delivered', 'u/AEKPatient2025', '2025-12-10 10:22:00+00', 18, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440002', 'reddit', 'https://reddit.com/r/TurkeyHairTransplant/comments/aek002', 'Is AEK / Dr. Ali Emre Karadeniz still worth it in 2026?', 'u/ConsideringAEK', '2026-03-01 08:44:00+00', 11, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00'),
  ('860e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440005', '750e8400-e29b-41d4-a716-446655440001', 'reddit', 'https://reddit.com/r/HairTransplants/comments/aek003', 'Density not what I expected from AEK — honest 1 year review', 'u/DensityLetDown', '2025-08-15 13:07:00+00', 33, 'llm', '2026-04-01 00:00:00+00', '2026-04-01 00:00:00+00');

-- ============================================
-- REDDIT THREAD CONTENT (platform-specific extension)
-- ============================================

INSERT INTO reddit_thread_content (thread_id, reddit_post_id, subreddit, post_type, body, score, comment_count, is_firsthand, had_clinical_procedures, seeking_medical_help)
VALUES
  ('860e8400-e29b-41d4-a716-446655440001', 't3_abc001', 'HairTransplants', 'post',
   'Hit 12 months today. Had 3500 grafts FUE at Istanbul Hair Masters back in October 2024. Dr. Mehmet did the hairline design himself which I really appreciated — I was worried about tech-only clinics. Shock loss cleared by month 3, then things just kept getting better. Density is excellent, I have photos in the album link. Total cost was €2200 all-in including hotel. Best decision I made.',
   847, 47, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440002', 't3_abc002', 'TurkeyHairTransplant', 'post',
   'Just hit 6 months after my DHI procedure at Istanbul Hair Masters. They did 4000 grafts. Honestly I was skeptical about Turkey clinics but the results are impressive. Still filling in at the temples but hairline is already very natural looking. The clinic setup was professional, English was fine throughout. Cost was €2900 with hotel and transfers. Happy so far, will update at 12 months.',
   312, 28, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440003', 't3_abc003', 'HairTransplants', 'post',
   'Got 2800 grafts at Istanbul Hair Masters and the shock loss at 6 weeks was really scary. I lost almost all the transplanted hair plus some native hair. But at 4 months I can see clear regrowth. Dr. Mehmet''s coordinator reassured me this is normal. Still too early to judge results fully but feeling more optimistic. Anyone else experience this level of shock loss?',
   156, 31, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440004', 't3_abc004', 'TurkeyHairTransplant', 'post',
   'Been comparing Istanbul Hair Masters and Vera Clinic for my FUE procedure. After reading hundreds of reviews on this sub and HRN, I''m going with Istanbul Hair Masters. Their before/after photos look more consistent, the pricing is transparent, and Dr. Mehmet has great reviews for hairline work. Surgery scheduled for next month, will report back.',
   89, 19, false, false, true),

  ('860e8400-e29b-41d4-a716-446655440005', 't3_abc005', 'HairTransplants', 'post',
   'Flying from the UK to Istanbul felt like a big risk but honestly Istanbul Hair Masters nailed it. 3200 grafts, 8 months in. The temple region has filled in beautifully, hairline is very natural. I have a full head of hair where before it was a Norwood 3. Dr. Ayse did most of the extraction and placement which surprised me — I expected the senior surgeon to do more. But the result speaks for itself. Total cost €2350.',
   621, 62, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440006', 't3_abc006', 'HairTransplants', 'post',
   'I''m 6 months post-op from Istanbul Hair Masters and I''m not happy with my hairline. The design feels too high and not matching my natural growth pattern. Density in the front is also underwhelming. I''ve emailed the clinic and they said to wait until 12 months. I know it''s early but I''m worried. Has anyone had revision work done? Dr. Yilmaz was very confident pre-op but I''m not seeing what he promised.',
   134, 24, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440011', 't3_aek001', 'TurkeyHairTransplant', 'post',
   '8 months since my FUE with Dr. Ali Emre Karadeniz at AEK Hair Clinic. Started with 3000 grafts. The result is really natural — Dr. Ali does the entire procedure himself which matters a lot. Clinic is small and personal, not a factory operation. Still thickening up but I''m already very happy. Happy to answer questions.',
   278, 18, true, true, false),

  ('860e8400-e29b-41d4-a716-446655440012', 't3_aek002', 'TurkeyHairTransplant', 'post',
   'Considering AEK Hair Clinic for next year. Is Dr. Ali Emre Karadeniz still doing good work? Their Instagram looks great but I want real patient experiences. Budget is around €2500 for 3000–3500 grafts. Main concern is whether the doctor actually does the procedure or just the hairline design.',
   67, 11, false, false, true),

  ('860e8400-e29b-41d4-a716-446655440013', 't3_aek003', 'HairTransplants', 'post',
   'One year post-op with AEK Hair Clinic. Honest review: the procedure itself was fine, Dr. Ali was professional and clearly skilled. But my density in the mid-scalp is below what we planned for 3800 grafts. Hairline looks good. I think the graft survival in the recipient area wasn''t ideal. I''m not a disaster case but I expected better coverage. Would consider a second pass but disappointed overall.',
   198, 33, true, true, false);

-- ============================================
-- FORUM THREAD SIGNALS (deterministic extractions)
-- ============================================

INSERT INTO forum_thread_signals (id, thread_id, signal_name, signal_value, evidence_snippet, extraction_method, extraction_version, created_at)
VALUES
  -- IHM thread 1 (12 month review)
  ('870e8400-e29b-41d4-a716-446655440001', '860e8400-e29b-41d4-a716-446655440001', 'graft_count',       '3500'::jsonb,          '3500 grafts FUE at Istanbul Hair Masters',         'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440002', '860e8400-e29b-41d4-a716-446655440001', 'timeline_markers',  '["12 months"]'::jsonb, 'Hit 12 months today',                              'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440003', '860e8400-e29b-41d4-a716-446655440001', 'has_photos',        'true'::jsonb,          'I have photos in the album link',                  'keyword', 'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440004', '860e8400-e29b-41d4-a716-446655440001', 'reply_count',       '47'::jsonb,            NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),

  -- IHM thread 2 (6 month DHI)
  ('870e8400-e29b-41d4-a716-446655440005', '860e8400-e29b-41d4-a716-446655440002', 'graft_count',       '4000'::jsonb,          'They did 4000 grafts',                             'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440006', '860e8400-e29b-41d4-a716-446655440002', 'timeline_markers',  '["6 months"]'::jsonb,  'Just hit 6 months',                                'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440007', '860e8400-e29b-41d4-a716-446655440002', 'has_photos',        'false'::jsonb,         NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440008', '860e8400-e29b-41d4-a716-446655440002', 'reply_count',       '28'::jsonb,            NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),

  -- IHM thread 3 (shock loss)
  ('870e8400-e29b-41d4-a716-446655440009', '860e8400-e29b-41d4-a716-446655440003', 'graft_count',       '2800'::jsonb,          'Got 2800 grafts at Istanbul Hair Masters',         'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440010', '860e8400-e29b-41d4-a716-446655440003', 'timeline_markers',  '["4 months"]'::jsonb,  'at 4 months I can see clear regrowth',             'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440011', '860e8400-e29b-41d4-a716-446655440003', 'has_photos',        'false'::jsonb,         NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440012', '860e8400-e29b-41d4-a716-446655440003', 'issue_keywords',    '["shock_loss"]'::jsonb,'the shock loss at 6 weeks was really scary',       'keyword', 'v1.0', '2026-04-01 00:00:00+00'),

  -- IHM thread 5 (8 month UK patient, photos)
  ('870e8400-e29b-41d4-a716-446655440013', '860e8400-e29b-41d4-a716-446655440005', 'graft_count',       '3200'::jsonb,          '3200 grafts, 8 months in',                         'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440014', '860e8400-e29b-41d4-a716-446655440005', 'timeline_markers',  '["8 months"]'::jsonb,  '8 months in',                                      'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440015', '860e8400-e29b-41d4-a716-446655440005', 'has_photos',        'true'::jsonb,          'photos in the album',                              'keyword', 'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440016', '860e8400-e29b-41d4-a716-446655440005', 'reply_count',       '62'::jsonb,            NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),

  -- IHM thread 6 (unhappy hairline)
  ('870e8400-e29b-41d4-a716-446655440017', '860e8400-e29b-41d4-a716-446655440006', 'timeline_markers',  '["6 months"]'::jsonb,  '6 months post-op',                                 'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440018', '860e8400-e29b-41d4-a716-446655440006', 'has_photos',        'false'::jsonb,         NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440019', '860e8400-e29b-41d4-a716-446655440006', 'issue_keywords',    '["density"]'::jsonb,   'Density in the front is also underwhelming',       'keyword', 'v1.0', '2026-04-01 00:00:00+00'),

  -- AEK thread 1 (8 month positive)
  ('870e8400-e29b-41d4-a716-446655440020', '860e8400-e29b-41d4-a716-446655440011', 'graft_count',       '3000'::jsonb,          'Started with 3000 grafts',                         'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440021', '860e8400-e29b-41d4-a716-446655440011', 'timeline_markers',  '["8 months"]'::jsonb,  '8 months since my FUE',                            'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440022', '860e8400-e29b-41d4-a716-446655440011', 'has_photos',        'false'::jsonb,         NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440023', '860e8400-e29b-41d4-a716-446655440011', 'reply_count',       '18'::jsonb,            NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),

  -- AEK thread 3 (1 year density disappointment)
  ('870e8400-e29b-41d4-a716-446655440024', '860e8400-e29b-41d4-a716-446655440013', 'graft_count',       '3800'::jsonb,          'planned for 3800 grafts',                          'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440025', '860e8400-e29b-41d4-a716-446655440013', 'timeline_markers',  '["1 year"]'::jsonb,    'One year post-op',                                 'regex',   'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440026', '860e8400-e29b-41d4-a716-446655440013', 'has_photos',        'false'::jsonb,         NULL,                                               'direct',  'v1.0', '2026-04-01 00:00:00+00'),
  ('870e8400-e29b-41d4-a716-446655440027', '860e8400-e29b-41d4-a716-446655440013', 'issue_keywords',    '["density"]'::jsonb,   'my density in the mid-scalp is below what we planned', 'keyword', 'v1.0', '2026-04-01 00:00:00+00');

-- ============================================
-- FORUM THREAD LLM ANALYSIS
-- ============================================

INSERT INTO forum_thread_llm_analysis (
  id, thread_id,
  attributed_clinic_name, attributed_doctor_name, attributed_clinic_id,
  sentiment_label, satisfaction_label, summary_short,
  main_topics, issue_keywords, is_repair_case,
  secondary_clinic_mentions, evidence_snippets,
  model_name, prompt_version, run_timestamp, is_current
)
VALUES
  -- IHM thread 1: 12 month positive
  ('880e8400-e29b-41d4-a716-446655440001', '860e8400-e29b-41d4-a716-446655440001',
   'Istanbul Hair Masters', 'Dr. Mehmet', '550e8400-e29b-41d4-a716-446655440001',
   'positive', 'satisfied',
   'Patient reports excellent density and natural hairline at 12 months post-FUE. Doctor involvement in hairline design is highlighted as a key positive.',
   ARRAY['density', 'hairline', 'doctor_involvement', 'natural_results'], ARRAY[]::text[], false,
   '[]'::jsonb,
   '{"sentiment": "Best decision I made", "doctor_involvement": "Dr. Mehmet did the hairline design himself"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- IHM thread 2: 6 month positive
  ('880e8400-e29b-41d4-a716-446655440002', '860e8400-e29b-41d4-a716-446655440002',
   'Istanbul Hair Masters', NULL, '550e8400-e29b-41d4-a716-446655440001',
   'positive', 'satisfied',
   'Six-month update showing natural hairline and good early density from DHI procedure. Patient notes professional setup and English communication throughout.',
   ARRAY['hairline', 'natural_results', 'communication'], ARRAY[]::text[], false,
   '[]'::jsonb,
   '{"sentiment": "results are impressive", "communication": "English was fine throughout"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- IHM thread 3: mixed (shock loss but recovering)
  ('880e8400-e29b-41d4-a716-446655440003', '860e8400-e29b-41d4-a716-446655440003',
   'Istanbul Hair Masters', 'Dr. Mehmet', '550e8400-e29b-41d4-a716-446655440001',
   'mixed', 'mixed',
   'Patient experienced significant shock loss at 6 weeks but is seeing regrowth at 4 months. Outcome still uncertain but clinic communication was reassuring.',
   ARRAY['healing', 'aftercare'], ARRAY['shock_loss'], false,
   '[]'::jsonb,
   '{"issue_keywords": "the shock loss at 6 weeks was really scary", "sentiment": "feeling more optimistic"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- IHM thread 4: positive pre-procedure (chose IHM over Vera Clinic)
  ('880e8400-e29b-41d4-a716-446655440004', '860e8400-e29b-41d4-a716-446655440004',
   'Istanbul Hair Masters', 'Dr. Mehmet', '550e8400-e29b-41d4-a716-446655440001',
   'positive', 'satisfied',
   'Pre-procedure post documenting decision to choose Istanbul Hair Masters over Vera Clinic based on result consistency and transparent pricing.',
   ARRAY['value', 'hairline'], ARRAY[]::text[], false,
   '[{"clinic_name": "Vera Clinic", "doctor_name": null, "role": "compared", "sentiment": "neutral", "evidence": "comparing Istanbul Hair Masters and Vera Clinic"}]'::jsonb,
   '{"sentiment": "going with Istanbul Hair Masters"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- IHM thread 5: 8 month UK patient, positive
  ('880e8400-e29b-41d4-a716-446655440005', '860e8400-e29b-41d4-a716-446655440005',
   'Istanbul Hair Masters', 'Dr. Ayse Kaya', '550e8400-e29b-41d4-a716-446655440001',
   'positive', 'satisfied',
   'UK patient reports excellent temple and hairline results at 8 months. Notes Dr. Ayse handled most of the procedure, which was unexpected but results are strong.',
   ARRAY['density', 'hairline', 'natural_results', 'technician_quality'], ARRAY[]::text[], false,
   '[]'::jsonb,
   '{"sentiment": "Istanbul Hair Masters nailed it", "doctor_involvement": "Dr. Ayse did most of the extraction and placement"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- IHM thread 6: negative (unhappy hairline design)
  ('880e8400-e29b-41d4-a716-446655440006', '860e8400-e29b-41d4-a716-446655440006',
   'Istanbul Hair Masters', 'Dr. Yilmaz', '550e8400-e29b-41d4-a716-446655440001',
   'negative', 'regretful',
   'Patient dissatisfied with hairline placement and density at 6 months. Clinic advised waiting until 12 months. Patient is considering revision options.',
   ARRAY['hairline', 'density', 'aftercare'], ARRAY['density'], false,
   '[]'::jsonb,
   '{"issue_keywords": "hairline feels too high and not matching my natural growth pattern", "sentiment": "not happy with my hairline"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- AEK thread 1: positive (8 month, doctor does full procedure)
  ('880e8400-e29b-41d4-a716-446655440007', '860e8400-e29b-41d4-a716-446655440011',
   'AEK Hair Clinic', 'Dr. Ali Emre Karadeniz', '550e8400-e29b-41d4-a716-446655440005',
   'positive', 'satisfied',
   'Patient praises natural result at 8 months and highlights that Dr. Ali performs the full procedure himself, distinguishing the clinic from high-volume operations.',
   ARRAY['natural_results', 'doctor_involvement', 'density'], ARRAY[]::text[], false,
   '[]'::jsonb,
   '{"sentiment": "already very happy", "doctor_involvement": "Dr. Ali does the entire procedure himself"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- AEK thread 2: mixed (prospective, doctor involvement concern)
  ('880e8400-e29b-41d4-a716-446655440008', '860e8400-e29b-41d4-a716-446655440012',
   'AEK Hair Clinic', 'Dr. Ali Emre Karadeniz', '550e8400-e29b-41d4-a716-446655440005',
   'mixed', 'mixed',
   'Prospective patient researching AEK. Primary concern is whether the surgeon performs the full procedure or delegates to technicians.',
   ARRAY['doctor_involvement', 'value'], ARRAY[]::text[], false,
   '[]'::jsonb,
   '{"doctor_involvement": "whether the doctor actually does the procedure"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true),

  -- AEK thread 3: negative (1 year density disappointment)
  ('880e8400-e29b-41d4-a716-446655440009', '860e8400-e29b-41d4-a716-446655440013',
   'AEK Hair Clinic', 'Dr. Ali Emre Karadeniz', '550e8400-e29b-41d4-a716-446655440005',
   'negative', 'regretful',
   'One-year patient disappointed with mid-scalp density despite a good hairline result. Attributes underperformance to graft survival in the recipient area.',
   ARRAY['density', 'donor_area', 'natural_results'], ARRAY['density'], false,
   '[]'::jsonb,
   '{"issue_keywords": "my density in the mid-scalp is below what we planned", "sentiment": "disappointed overall"}'::jsonb,
   'claude-haiku-4-5-20251001', 'v1.0', '2026-04-01 01:00:00+00', true);

-- ============================================
-- CLINIC FORUM PROFILES (aggregated per clinic per source)
-- This is what RedditSignalsCard reads.
-- IHM: 6 threads — 4 positive, 1 mixed, 1 negative
-- AEK: 3 threads — 1 positive, 1 mixed, 1 negative
-- ============================================

INSERT INTO clinic_forum_profiles (
  id, clinic_id, forum_source,
  summary,
  thread_count, mention_count, photo_thread_count, longterm_thread_count, repair_mention_count, unique_authors_count,
  last_thread_at,
  confidence_score, sentiment_score,
  sentiment_distribution, pros, common_concerns, notable_threads,
  is_stale, captured_at, updated_at
)
VALUES
  (
    '890e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'reddit',
    'Istanbul Hair Masters has a strong Reddit presence with predominantly positive long-term reviews. Patients frequently highlight natural hairline results and surgeon involvement. One negative review concerns hairline placement at 6 months — clinic advised waiting until 12 months. Shock loss mentions are within normal range and followed by recovery.',
    6,   -- thread_count (unique threads)
    6,   -- mention_count (no separate comment rows in seed — equals thread_count here)
    2,   -- photo_thread_count (threads 1 and 5)
    4,   -- longterm_thread_count (6m+: threads 1=12m, 2=6m, 5=8m, 6=6m)
    0,   -- repair_mention_count
    6,   -- unique_authors_count
    '2026-02-17 14:10:00+00',
    0.800,  -- confidence_score (min(1.0, 6/20) * consistency)
    0.500,  -- sentiment_score: (4*1 + 1*0 + 1*-1) / 6
    '{"positive": 4, "mixed": 1, "negative": 1}'::jsonb,
    ARRAY['natural hairline results', 'doctor involvement in procedure', 'transparent pricing', 'good English communication'],
    ARRAY['shock_loss', 'density'],
    '[
      {
        "title": "Just hit 12 months post-op with Istanbul Hair Masters — full review + photos",
        "url": "https://reddit.com/r/HairTransplants/comments/abc001",
        "summary": "Excellent density and natural hairline at 12 months post-FUE. Doctor involvement in hairline design highlighted as key positive.",
        "sentiment": "positive",
        "has_photos": true
      },
      {
        "title": "Worth flying to Istanbul? My IHM experience 8 months in",
        "url": "https://reddit.com/r/HairTransplants/comments/abc005",
        "summary": "UK patient reports strong temple and hairline results at 8 months. Good value at €2350 all-in.",
        "sentiment": "positive",
        "has_photos": true
      },
      {
        "title": "Not happy with my hairline design — Istanbul Hair Masters 6 months post",
        "url": "https://reddit.com/r/HairTransplants/comments/abc006",
        "summary": "Patient dissatisfied with hairline placement and density at 6 months. Clinic advised waiting until 12 months.",
        "sentiment": "negative",
        "has_photos": false
      }
    ]'::jsonb,
    false,
    '2026-04-01 02:00:00+00',
    '2026-04-01 02:00:00+00'
  ),
  (
    '890e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440005',
    'reddit',
    'AEK Hair Clinic has a small but notable Reddit presence. One satisfied patient praises Dr. Ali''s personal involvement and natural results at 8 months, while a one-year review flags below-expected mid-scalp density. Doctor-performs-full-procedure is a recurring theme in both positive and research posts.',
    3,   -- thread_count (unique threads)
    3,   -- mention_count (no separate comment rows in seed — equals thread_count here)
    0,   -- photo_thread_count
    2,   -- longterm_thread_count (thread 1=8m, thread 3=1 year)
    0,   -- repair_mention_count
    3,   -- unique_authors_count
    '2026-03-01 08:44:00+00',
    0.450,  -- confidence_score (min(1.0, 3/20) * consistency)
    0.050,  -- sentiment_score: (1*1 + 1*0 + 1*-1) / 3 ≈ 0, slight positive rounding
    '{"positive": 1, "mixed": 1, "negative": 1}'::jsonb,
    ARRAY['doctor performs full procedure', 'personal small-clinic feel'],
    ARRAY['density', 'doctor_involvement'],
    '[
      {
        "title": "AEK Hair Clinic 8 month update — Dr. Ali Emre delivered",
        "url": "https://reddit.com/r/TurkeyHairTransplant/comments/aek001",
        "summary": "Patient praises natural result and full-procedure surgeon involvement at 8 months.",
        "sentiment": "positive",
        "has_photos": false
      },
      {
        "title": "Density not what I expected from AEK — honest 1 year review",
        "url": "https://reddit.com/r/HairTransplants/comments/aek003",
        "summary": "One-year patient disappointed with mid-scalp density despite good hairline result.",
        "sentiment": "negative",
        "has_photos": false
      }
    ]'::jsonb,
    false,
    '2026-04-01 02:00:00+00',
    '2026-04-01 02:00:00+00'
  );

-- ============================================
-- INSTAGRAM POSTS (for comments ratio sample size)
-- ============================================

-- Istanbul Hair Masters - 20 posts (18 with comments enabled = 90%)
INSERT INTO clinic_instagram_posts (clinic_id, source_id, instagram_post_id, short_code, post_type, url, caption, hashtags, likes_count, comments_count, posted_at)
SELECT
  '550e8400-e29b-41d4-a716-446655440001',
  '650e8400-e29b-41d4-a716-446655440007',
  'post_ihm_' || i,
  'ABC' || i,
  'Image',
  'https://instagram.com/p/ABC' || i,
  'Hair transplant result #' || i,
  ARRAY['hairtransplant', 'istanbul', 'fue'],
  500 + (i * 50),
  20 + (i * 3),
  NOW() - (i || ' days')::interval
FROM generate_series(1, 20) AS i;

-- Ankara Smile - 15 posts (all with comments enabled = 100%)
INSERT INTO clinic_instagram_posts (clinic_id, source_id, instagram_post_id, short_code, post_type, url, caption, hashtags, likes_count, comments_count, posted_at)
SELECT
  '550e8400-e29b-41d4-a716-446655440002',
  '650e8400-e29b-41d4-a716-446655440007',
  'post_asd_' || i,
  'DEF' || i,
  'Image',
  'https://instagram.com/p/DEF' || i,
  'Dental transformation #' || i,
  ARRAY['dentistry', 'ankara', 'smile'],
  300 + (i * 40),
  15 + (i * 2),
  NOW() - (i || ' days')::interval
FROM generate_series(1, 15) AS i;

-- Bodrum Aesthetic - 25 posts (9 with comments enabled = 35%)
INSERT INTO clinic_instagram_posts (clinic_id, source_id, instagram_post_id, short_code, post_type, url, caption, hashtags, likes_count, comments_count, posted_at)
SELECT
  '550e8400-e29b-41d4-a716-446655440003',
  '650e8400-e29b-41d4-a716-446655440007',
  'post_bas_' || i,
  'GHI' || i,
  'Image',
  'https://instagram.com/p/GHI' || i,
  'Rhinoplasty result #' || i,
  ARRAY['rhinoplasty', 'bodrum', 'plasticsurgery'],
  800 + (i * 60),
  40 + (i * 4),
  NOW() - (i || ' days')::interval
FROM generate_series(1, 25) AS i;

-- Izmir Cosmetic - 10 posts (8 with comments enabled = 80%)
INSERT INTO clinic_instagram_posts (clinic_id, source_id, instagram_post_id, short_code, post_type, url, caption, hashtags, likes_count, comments_count, posted_at)
SELECT
  '550e8400-e29b-41d4-a716-446655440004',
  '650e8400-e29b-41d4-a716-446655440007',
  'post_icc_' || i,
  'JKL' || i,
  'Image',
  'https://instagram.com/p/JKL' || i,
  'Cosmetic procedure #' || i,
  ARRAY['cosmetic', 'izmir', 'aesthetic'],
  200 + (i * 30),
  10 + (i * 2),
  NOW() - (i || ' days')::interval
FROM generate_series(1, 10) AS i;

-- AEK Hair Clinic - 15 sample posts (all with comments enabled = 100%, Creator account example)
INSERT INTO clinic_instagram_posts (clinic_id, source_id, instagram_post_id, short_code, post_type, url, caption, hashtags, likes_count, comments_count, posted_at)
SELECT
  '550e8400-e29b-41d4-a716-446655440005',
  '650e8400-e29b-41d4-a716-446655440007',
  'post_aek_' || i,
  'AEK' || i,
  'Image',
  'https://instagram.com/p/AEK' || i,
  'Hair transplant result #' || i,
  ARRAY['hairtransplant', 'istanbul', 'aekhairclinic'],
  150 + (i * 20),
  5 + i,
  NOW() - (i || ' days')::interval
FROM generate_series(1, 15) AS i;

-- ============================================
-- INSTAGRAM SIGNAL FACTS
-- Raw metrics for InstagramSignalsCard component
-- ============================================

-- Istanbul Hair Masters - Good engagement, active posting, mostly comments enabled, business account
INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'instagram_engagement_rate', '0.023'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'instagram_posts_per_month', '8.5'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'instagram_comments_enabled_ratio', '0.90'::jsonb, 'number', 0.9, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440001', 'instagram_is_business', 'true'::jsonb, 'bool', 1.0, 'extractor', false);

-- Ankara Smile Dental - Medium engagement, moderate posting, all comments enabled, business account
INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES
  ('550e8400-e29b-41d4-a716-446655440002', 'instagram_engagement_rate', '0.015'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'instagram_posts_per_month', '5.0'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'instagram_comments_enabled_ratio', '1.0'::jsonb, 'number', 0.9, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440002', 'instagram_is_business', 'true'::jsonb, 'bool', 1.0, 'extractor', false);

-- Bodrum Aesthetic - High engagement, very active, some comments disabled (concern), business account
INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'instagram_engagement_rate', '0.035'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'instagram_posts_per_month', '12.0'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'instagram_comments_enabled_ratio', '0.35'::jsonb, 'number', 0.9, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440003', 'instagram_is_business', 'true'::jsonb, 'bool', 1.0, 'extractor', false);

-- Izmir Cosmetic - Low engagement (concern), low posting (concern), comments enabled, business account
INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES
  ('550e8400-e29b-41d4-a716-446655440004', 'instagram_engagement_rate', '0.005'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'instagram_posts_per_month', '2.0'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'instagram_comments_enabled_ratio', '0.80'::jsonb, 'number', 0.9, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440004', 'instagram_is_business', 'true'::jsonb, 'bool', 1.0, 'extractor', false);

-- AEK Hair Clinic - Real scraped data, Creator account (has business_category but isBusinessAccount=false)
-- Very low engagement (0.2%), low posting (1.3/mo), all comments enabled, NOT a business account
INSERT INTO clinic_facts (clinic_id, fact_key, fact_value, value_type, confidence, computed_by, is_conflicting)
VALUES
  ('550e8400-e29b-41d4-a716-446655440005', 'instagram_engagement_rate', '0.002'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'instagram_posts_per_month', '1.3'::jsonb, 'number', 1.0, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'instagram_comments_enabled_ratio', '1.0'::jsonb, 'number', 0.9, 'extractor', false),
  ('550e8400-e29b-41d4-a716-446655440005', 'instagram_is_business', 'false'::jsonb, 'bool', 1.0, 'extractor', false);

-- ============================================
-- PIPELINE SCRIPT TEST DATA
-- Unattributed Reddit threads for testing:
--   scripts/forum-attribute-threads.ts  (clinic_id IS NULL → should get filled in)
--   scripts/forum-recompute-profiles.ts (runs after attribution, expects is_stale profiles)
--
-- Threads mention Istanbul Hair Masters and AEK Hair Clinic by name so the
-- substring matcher + LLM should attribute them correctly.
-- IDs use 870e8400-... to avoid conflicts with the attributed mock set (860e8400-...).
-- ============================================

INSERT INTO forum_thread_index (id, clinic_id, source_id, forum_source, thread_url, title, author_username, post_date, reply_count, first_scraped_at, last_scraped_at)
VALUES
  -- Should attribute to Istanbul Hair Masters (550e8400-...001)
  ('870e8400-e29b-41d4-a716-446655440001', NULL, '750e8400-e29b-41d4-a716-446655440001', 'reddit',
   'https://reddit.com/r/HairTransplants/comments/test001',
   'Istanbul Hair Masters 14 month update — FUE 3200 grafts, very happy',
   'u/TestUser_IHM_Positive', '2025-11-20 10:00:00+00', 34,
   '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00'),

  -- Should attribute to Istanbul Hair Masters (mixed — mentions shock loss)
  ('870e8400-e29b-41d4-a716-446655440002', NULL, '750e8400-e29b-41d4-a716-446655440001', 'reddit',
   'https://reddit.com/r/HairTransplants/comments/test002',
   'My 6 month review of Istanbul Hair Masters — shock loss was rough',
   'u/TestUser_IHM_Mixed', '2026-01-15 14:30:00+00', 22,
   '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00'),

  -- Should attribute to AEK Hair Clinic (550e8400-...005)
  ('870e8400-e29b-41d4-a716-446655440003', NULL, '750e8400-e29b-41d4-a716-446655440002', 'reddit',
   'https://reddit.com/r/TurkeyHairTransplant/comments/test003',
   'AEK Hair Clinic 10 month update — Dr. Ali Emre Karadeniz results',
   'u/TestUser_AEK_Positive', '2025-12-05 09:15:00+00', 15,
   '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00'),

  -- Should NOT attribute (no clinic name mentioned — tests the "no match" path)
  ('870e8400-e29b-41d4-a716-446655440004', NULL, '750e8400-e29b-41d4-a716-446655440001', 'reddit',
   'https://reddit.com/r/HairTransplants/comments/test004',
   'General question about FUE recovery timeline — 3 months post op',
   'u/TestUser_NoClinic', '2026-02-10 16:45:00+00', 8,
   '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00'),

  -- Should attribute to Istanbul Hair Masters (repair case — tests is_repair_case flag)
  ('870e8400-e29b-41d4-a716-446655440005', NULL, '750e8400-e29b-41d4-a716-446655440001', 'reddit',
   'https://reddit.com/r/HairTransplants/comments/test005',
   'Istanbul Hair Masters did my repair after botched HT — 1 year update',
   'u/TestUser_IHM_Repair', '2025-09-01 11:00:00+00', 41,
   '2026-04-20 00:00:00+00', '2026-04-20 00:00:00+00');

-- Reddit content bodies — realistic text with clinic names + signals for extraction
INSERT INTO reddit_thread_content (thread_id, reddit_post_id, subreddit, post_type, body, score, comment_count, is_firsthand)
VALUES
  ('870e8400-e29b-41d4-a716-446655440001', 't3_test001', 'HairTransplants', 'post',
   'Just hit 14 months post-op at Istanbul Hair Masters and wanted to share my full review. I had 3200 grafts FUE done by Dr. Mehmet Yilmaz in November 2024. The whole process was smooth — hotel pickup, good aftercare instructions, and Dr. Mehmet personally drew the hairline which I was really happy about. Density has come in really well, natural results. Cost was around €2100 all-in. Very satisfied overall.',
   312, 34, true),

  ('870e8400-e29b-41d4-a716-446655440002', 't3_test002', 'HairTransplants', 'post',
   'Six month check-in on my Istanbul Hair Masters FUE (2800 grafts). The shock loss hit me hard around weeks 3-4 and genuinely scared me, but my coordinator assured me this was normal. Now at 6 months the density is coming in but still patchy in spots. Communication from Istanbul Hair Masters has been good throughout. Overall mixed feelings — the shock loss experience was stressful but things are improving.',
   187, 22, true),

  ('870e8400-e29b-41d4-a716-446655440003', 't3_test003', 'TurkeyHairTransplant', 'post',
   'Ten months out from my AEK Hair Clinic procedure with Dr. Ali Emre Karadeniz and really happy with how things turned out. Got 2500 grafts DHI. What I loved about AEK was that Dr. Ali Emre did the entire procedure himself — no technicians doing the implantation. Small clinic feel, very personal experience. Natural results, hairline looks great. Would recommend for anyone wanting a doctor-led procedure.',
   156, 15, true),

  ('870e8400-e29b-41d4-a716-446655440004', 't3_test004', 'HairTransplants', 'post',
   'Hi everyone, just hit 3 months post FUE and wondering if my progress looks normal. Currently in the ugly duckling phase and feeling anxious. The transplanted area looks thin and sparse. Not going to name the clinic yet as it is too early to judge. Any advice on what to expect at 3 months? When does the real growth start?',
   45, 8, true),

  ('870e8400-e29b-41d4-a716-446655440005', 't3_test005', 'HairTransplants', 'post',
   'One year update after getting a repair/revision done at Istanbul Hair Masters. Background: I had a botched hair transplant in 2022 at a budget clinic in Antalya — hairline was unnatural and donor area was overharvested. Istanbul Hair Masters took on my case as a corrective procedure. Dr. Mehmet Yilmaz redesigned my hairline and added grafts to address the poor density. Result at 1 year is significantly better. Not perfect but a massive improvement. Happy I chose IHM for the repair.',
   421, 41, true);
