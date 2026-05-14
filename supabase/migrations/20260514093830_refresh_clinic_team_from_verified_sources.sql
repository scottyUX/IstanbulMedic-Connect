-- Refresh clinic_team rosters from the 2026-05-14 verified-sources audit.
-- Source: hair_transplant_clinics_lead_doctors.md (clinic-owned websites or
-- clinic-controlled channels only; no third-party aggregators).
--
-- This migration replaces existing clinic_team rows for the 27 real clinics
-- (the placeholder/draft data added in 20260416000000 and 20260416000001)
-- with the curated roster of 47 doctors across 24 clinics. Three clinics
-- (Esthetic Hair Turkey, Lenus Clinic, Memorial Şişli) have no publicly
-- named staff, so they get no clinic_team rows — the DoctorsSection UI
-- handles the "not-disclosed" state.
--
-- Clinic display_names are NOT modified.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Clear existing doctor rows for these 27 clinics so this migration is
--    idempotent and the curated roster is authoritative.
--    Scoped by clinic display_name to avoid touching unrelated rows.
-- ─────────────────────────────────────────────────────────────────────────────

DELETE FROM public.clinic_team
WHERE clinic_id IN (
  SELECT id FROM public.clinics WHERE display_name IN (
    'AEK Hair Clinic',
    'AHD Clinic',
    'ASMED Medical Center',
    'Clinicana Hair Transplant & Esthetic Surgeries',
    'Cosmedica Hair Transplantation Clinic',
    'Doku Clinic',
    'Dr. Cinik Clinic',
    'Dr. Resul Yaman Hair Clinic',
    'Dr Serkan Aygın Hair Transplant Clinic - Istanbul Turkey',
    'Dr. Servet Terziler',
    'Este Favor | Hair Transplant Turkey | Greffe de cheveux en Turquie | Trasplante Capilar Turquia |',
    'Este Medical - Hair Transplant Clinc Istanbul Türkiye',
    'EsteNove - Best Hair Transplant in Turkey',
    'Estetik International',
    'Esthetic Hair Turkey',
    'Hermest Hair Clinic | Hair Transplant Turkey Istanbul',
    'HEVA CLINIC',
    'HLC Clinic, Hair Transplant Turkey',
    'Lenus Clinic',
    'Longevita',
    'Memorial Şişli Hastanesi',
    'NIMCLINIC',
    'Özel PHR Polikliniği',
    'Sapphire Hair Transplant Clinic Istanbul',
    'Smile Hair Clinic Hair Transplant Turkey Istanbul',
    'SULE CLINIC - Hair Transplant Turkey istanbul',
    'Vera Clinic | Hair Transplant Clinic in Turkey'
  )
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Insert curated roster.
-- ─────────────────────────────────────────────────────────────────────────────

-- AEK Hair Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Op. Dr. Ali Emre Karadeniz', 'Founder, Plastic Surgeon, Head Surgeon', 'high'
FROM public.clinics WHERE display_name = 'AEK Hair Clinic';

-- AHD Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Hakan Doğanay', 'Founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'AHD Clinic';

-- ASMED Medical Center
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Koray Erdoğan', 'Founder, Medical Director, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'ASMED Medical Center';

-- Clinicana
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Prof. Dr. Soner Tatlıdede', 'Lead Surgeon (Plastic, Reconstructive & Aesthetic Surgery)', 'high'
FROM public.clinics WHERE display_name = 'Clinicana Hair Transplant & Esthetic Surgeries';

-- Cosmedica
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Levent Acar', 'Founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Cosmedica Hair Transplantation Clinic';

-- Doku Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Uzm. Dr. M. Serkan Aygın', 'Founding Partner', 'high'
FROM public.clinics WHERE display_name = 'Doku Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Engin Öcal', 'Aesthetic Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Doku Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Bülent Çığşar', 'Aesthetic Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Doku Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Emirali Hamiloğlu', 'Aesthetic Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Doku Clinic';

-- Dr. Cinik Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Emrah Cinik', 'Founder, Lead Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Dr. Cinik Clinic';

-- Dr. Resul Yaman Hair Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Resul Yaman', 'Founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Dr. Resul Yaman Hair Clinic';

-- Dr. Serkan Aygın Hair Transplant Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Serkan Aygın', 'Founder, Lead Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Dr Serkan Aygın Hair Transplant Clinic - Istanbul Turkey';

-- Dr. Servet Terziler Exclusive Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Servet Terziler', 'Founder, Medical Aesthetics Doctor', 'high'
FROM public.clinics WHERE display_name = 'Dr. Servet Terziler';

-- Este Favor
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Md. Merve Kaya', 'Medical Director, Lead Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Este Favor | Hair Transplant Turkey | Greffe de cheveux en Turquie | Trasplante Capilar Turquia |';

-- Este Medical Group (Istanbul)
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Alaaddin Karabacak, MD', 'Expert Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Este Medical - Hair Transplant Clinc Istanbul Türkiye';

-- EsteNove
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Zafer Çetinkaya, MD', 'Hair Transplant Surgeon, Surgical Team Lead', 'high'
FROM public.clinics WHERE display_name = 'EsteNove - Best Hair Transplant in Turkey';

-- Estetik International
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Op. Dr. Bülent Cihantimur', 'Founder, Aesthetic Plastic & Reconstructive Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Estetik International';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Selçuk Aytaç, MD', 'Aesthetic Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Estetik International';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Fevzi Kunter Erten, MD', 'Aesthetic Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Estetik International';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Ali Ekber Yürekli, MD', 'Hair Transplant Specialist', 'medium'
FROM public.clinics WHERE display_name = 'Estetik International';

-- Hermest Hair Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Ahmet Murat', 'Chief Medical Officer (cardiac surgeon)', 'high'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Nesim Tüğen', 'Medical Director', 'high'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Ezgi Kaygusuz', 'Plastic Surgeon (Aesthetic Medicine)', 'medium'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Mahir Özer', 'Head FUE Surgical Practitioner', 'medium'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Furkan Sütçü', 'Head DHI Surgical Practitioner', 'medium'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Oğuzhan Gül', 'Head DHI Surgical Practitioner', 'medium'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Sevim Yılmaz', 'Head FUE Surgical Practitioner', 'medium'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

-- HEVA Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Yasin Ilgaz', 'Medical Director', 'high'
FROM public.clinics WHERE display_name = 'HEVA CLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Seda Oleroglu', 'Head Surgeon (Hair Transplant)', 'high'
FROM public.clinics WHERE display_name = 'HEVA CLINIC';

-- HLC Clinic (Ankara)
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Özgür Öztan', 'Medical Director, Founder (FUE pioneer)', 'high'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Elif Kuzgun', 'Hair Transplant Physician (FUE)', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Ahmet Cengiz Berk', 'Hair Transplant Physician (FUE)', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Raif Umut Aygoglu', 'Hair Transplant Physician', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

-- Longevita (Istanbul)
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Çağla', 'Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Longevita';

-- NIMCLINIC
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Arda Akgün', 'Plastic, Reconstructive & Aesthetic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Emrah Kaya', 'Hair Transplant Doctor', 'medium'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Musa Yetim', 'General Director & Hair Transplant Specialist', 'high'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

-- Özel PHR Polikliniği (Ankara)
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Kaan Pekiner', 'Founder, Hair Transplant Doctor', 'high'
FROM public.clinics WHERE display_name = 'Özel PHR Polikliniği';

-- Sapphire Hair Transplant Clinic Istanbul
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Büşra Yakupoğlu, MD', 'Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Sapphire Hair Transplant Clinic Istanbul';

-- Smile Hair Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Mehmet Erdoğan', 'Co-founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Gökay Bilgin', 'Co-founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Firdavs Ahmedov', 'Hair Transplant Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Ali Osman Soluk', 'Hair Transplant Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. M. Reşat Arpacı', 'Hair Transplant Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

-- SULE Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Selahattin Tulunay', 'Plastic Surgeon (Aesthetic & Plastic Surgery)', 'high'
FROM public.clinics WHERE display_name = 'SULE CLINIC - Hair Transplant Turkey istanbul';

-- Vera Clinic
INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Salim Öz Aysu', 'Medical Director', 'high'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Hamit Göz', 'Aesthetic, Plastic & Reconstructive Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Ekrem Ramazan Keskin', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Engin Selamioğlu', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Gökhan Mersinlioğlu', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';
