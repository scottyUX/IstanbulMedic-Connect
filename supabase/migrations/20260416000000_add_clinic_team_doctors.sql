-- Add doctor names to clinic_team for all known Hair Transplant Clinics in Turkey
-- Only inserts — no existing data is modified or deleted

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Serkan Aygın', 'Founder and lead dermatology specialist', 'high'
FROM public.clinics WHERE display_name = 'Dr Serkan Aygın Hair Transplant Clinic - Istanbul Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Hamit Göz', 'Aesthetic, Plastic, and Reconstructive Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Emin Gül', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Saim Nedim Ecevit', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Salim Öz Aysu', 'Medical Director', 'high'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Ekrem Ramazan Keskin', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Engin Selamioğlu', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Vera Clinic | Hair Transplant Clinic in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Levent Acar', 'Founder and lead surgeon', 'high'
FROM public.clinics WHERE display_name = 'Cosmedica Hair Transplantation Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Musa Yetim', 'Founder and lead hair transplant specialist', 'high'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Arda Akgün', 'Plastic Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Emrah Kaya', 'Medical Doctor', 'medium'
FROM public.clinics WHERE display_name = 'NIMCLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Mehmet Erdoğan', 'Co-founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Gökay Bilgin', 'Co-founder, Hair Transplant Surgeon', 'high'
FROM public.clinics WHERE display_name = 'Smile Hair Clinic Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Özgür Öztan', 'Assoc. Prof., Founder, Medical Director, and lead surgeon', 'high'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Elif Kuzgun', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Ahmet Cengiz Berk', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Raif Umut Aygoglu', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Tarık Ercan', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'HLC Clinic, Hair Transplant Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Koray Erdogan', 'Founder and lead FUE innovator', 'high'
FROM public.clinics WHERE display_name = 'ASMED Medical Center';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Kaan Pekiner', 'Plastic and Reconstructive Surgeon, lead manual FUE specialist', 'high'
FROM public.clinics WHERE display_name = 'Özel PHR Polikliniği';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Ahmet Murat', 'Lead hair transplant and cardiology specialist', 'high'
FROM public.clinics WHERE display_name = 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Emrah Cinik', 'Founder and lead surgeon', 'high'
FROM public.clinics WHERE display_name = 'Dr. Cinik Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Hakan Doğanay', 'Founder and pioneer of DHI/implanter techniques', 'high'
FROM public.clinics WHERE display_name = 'AHD Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Prof. Dr. Soner Tatlıdede', 'Professor of Plastic, Reconstructive and Aesthetic Surgery', 'high'
FROM public.clinics WHERE display_name = 'Clinicana Hair Transplant & Esthetic Surgeries';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Resul Yaman', 'Lead hair restoration specialist', 'high'
FROM public.clinics WHERE display_name = 'Dr. Resul Yaman Hair Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Bülent Cihantimur', 'Lead, organic hair transplant', 'high'
FROM public.clinics WHERE display_name = 'Estetik International';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Yuşa Aslandağ', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Estetik International';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Barış Arıcı', 'Lead surgeon', 'high'
FROM public.clinics WHERE display_name = 'Sapphire Hair Transplant Clinic Istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Selahattin Tulunay', 'Plastic surgery specialist, lead', 'high'
FROM public.clinics WHERE display_name = 'SULE CLINIC - Hair Transplant Turkey istanbul';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Yasin Ilgaz', 'Medical Director', 'high'
FROM public.clinics WHERE display_name = 'HEVA CLINIC';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Atilla Yıldırım', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Lenus Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Servet Terziler', 'Lead surgeon, 35+ years experience', 'high'
FROM public.clinics WHERE display_name = 'Dr. Servet Terziler';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Ali Emre Karadeniz', 'Plastic surgeon, founder, ABHRS Diplomate', 'high'
FROM public.clinics WHERE display_name = 'AEK Hair Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Mehmet Doğruer', 'Hospital specialist', 'medium'
FROM public.clinics WHERE display_name = 'Memorial Şişli Hastanesi';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'medical_director', 'Dr. Alaaddin Karabacak', '35+ years experience', 'high'
FROM public.clinics WHERE display_name = 'Este Medical - Hair Transplant Clinc Istanbul Türkiye';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Mesut Köroğlu', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Este Medical - Hair Transplant Clinc Istanbul Türkiye';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Derya Köroğlu', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'Este Medical - Hair Transplant Clinc Istanbul Türkiye';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Mehmet', 'Doctor', 'medium'
FROM public.clinics WHERE display_name = 'EsteNove - Best Hair Transplant in Turkey';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Emirali Hamiloğlu', 'Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Doku Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Op. Dr. Engin Öcal', 'Surgeon', 'medium'
FROM public.clinics WHERE display_name = 'Doku Clinic';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'surgeon', 'Dr. Hassan', 'Plastic surgeon and hair restoration specialist', 'high'
FROM public.clinics WHERE display_name = 'Longevita';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Dr. Çağla', 'Hair transplant and medical aesthetics specialist', 'medium'
FROM public.clinics WHERE display_name = 'Longevita';
