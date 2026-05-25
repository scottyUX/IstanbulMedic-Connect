-- Add placeholder clinic_team entries for clinics with no publicly known doctor names

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Unknown', 'Unknown', 'low'
FROM public.clinics WHERE display_name = 'Este Favor | Hair Transplant Turkey | Greffe de cheveux en Turquie | Trasplante Capilar Turquia |';

INSERT INTO public.clinic_team (clinic_id, role, name, credentials, doctor_involvement_level)
SELECT id, 'doctor', 'Unknown', 'Unknown', 'low'
FROM public.clinics WHERE display_name = 'Esthetic Hair Turkey';
