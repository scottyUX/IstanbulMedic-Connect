-- Seed the 27 real hair transplant clinics so subsequent migrations can reference them.
-- ON CONFLICT DO NOTHING makes this safe to push to production (clinics already exist there).

INSERT INTO public.clinics (id, display_name, status, primary_city, primary_country) VALUES
  ('fa43da13-5643-4698-ba76-1fd536832067', 'Dr Serkan Aygın Hair Transplant Clinic - Istanbul Turkey',   'active', 'Istanbul', 'Turkey'),
  ('9fda50dd-a946-4f7c-84f5-85ad477e2ae9', 'Vera Clinic | Hair Transplant Clinic in Turkey',             'active', 'Istanbul', 'Turkey'),
  ('1e711136-670e-4040-a09b-6171524edd5a', 'Cosmedica Hair Transplantation Clinic',                       'active', 'Istanbul', 'Turkey'),
  ('5fa37647-3865-448a-8f89-fee61880f787', 'NIMCLINIC',                                                   'active', 'Istanbul', 'Turkey'),
  ('46d175c1-8110-48cb-9594-17224b105ebc', 'Smile Hair Clinic Hair Transplant Turkey Istanbul',           'active', 'Istanbul', 'Turkey'),
  ('e349bf39-9b51-48b2-b1e0-b0ae4912e25a', 'HLC Clinic, Hair Transplant Turkey',                         'active', 'Istanbul', 'Turkey'),
  ('d231c7ee-e48f-4720-93f1-60dee8337be7', 'ASMED Medical Center',                                        'active', 'Istanbul', 'Turkey'),
  ('600647f5-d443-4428-a7fa-c9853110d79f', 'Özel PHR Polikliniği',                                        'active', 'Istanbul', 'Turkey'),
  ('486fc247-21bc-47d5-a8ba-d547dfe13c32', 'Hermest Hair Clinic | Hair Transplant Turkey Istanbul',       'active', 'Istanbul', 'Turkey'),
  ('09e3ea2d-212b-4541-8248-9159d7cabb6c', 'Dr. Cinik Clinic',                                            'active', 'Istanbul', 'Turkey'),
  ('5931b391-2b39-4e7d-a087-40e58eb23a6e', 'AHD Clinic',                                                  'active', 'Istanbul', 'Turkey'),
  ('b02be593-6459-482e-bd75-3208320eeb0e', 'Clinicana Hair Transplant & Esthetic Surgeries',              'active', 'Istanbul', 'Turkey'),
  ('3ea410a8-4fe5-48d7-b191-1761b5b7c089', 'Dr. Resul Yaman Hair Clinic',                                 'active', 'Istanbul', 'Turkey'),
  ('ecfaffbb-3c30-4c1a-8dc2-65b6c59ec3e7', 'Estetik International',                                       'active', 'Istanbul', 'Turkey'),
  ('950e9c50-9de5-42b6-b598-f1ed0441585e', 'Sapphire Hair Transplant Clinic Istanbul',                    'active', 'Istanbul', 'Turkey'),
  ('36475b2e-c911-49d8-8529-f60692b22832', 'Este Favor | Hair Transplant Turkey | Greffe de cheveux en Turquie | Trasplante Capilar Turquia |', 'active', 'Istanbul', 'Turkey'),
  ('ba40f68a-faa2-4d1f-89e0-d5233ff8e314', 'SULE CLINIC - Hair Transplant Turkey istanbul',               'active', 'Istanbul', 'Turkey'),
  ('a0607407-4a15-41d4-b63e-8467cf618754', 'HEVA CLINIC',                                                 'active', 'Istanbul', 'Turkey'),
  ('d7cb050e-bc37-47fe-b333-08729496ee7c', 'Lenus Clinic',                                                'active', 'Istanbul', 'Turkey'),
  ('c30c4bd6-b76c-4817-a001-14f68c029d2d', 'Dr. Servet Terziler',                                         'active', 'Istanbul', 'Turkey'),
  ('1034aed1-9c8a-46c7-815d-26372f40b1d8', 'AEK Hair Clinic',                                             'active', 'Istanbul', 'Turkey'),
  ('74365702-b46e-448d-a79d-797121346e54', 'Memorial Şişli Hastanesi',                                    'active', 'Istanbul', 'Turkey'),
  ('86f1f2c8-ea32-4cf5-a3e8-b054acb6001d', 'Este Medical - Hair Transplant Clinc Istanbul Türkiye',       'active', 'Istanbul', 'Turkey'),
  ('558cc5ea-919a-4203-b4bd-034149593064', 'EsteNove - Best Hair Transplant in Turkey',                   'active', 'Istanbul', 'Turkey'),
  ('7d3bb7da-5c67-4ae5-979d-8b2f484e81c7', 'Doku Clinic',                                                 'active', 'Istanbul', 'Turkey'),
  ('40062cdf-863c-4ce8-b4f8-bae205dad70f', 'Esthetic Hair Turkey',                                        'active', 'Istanbul', 'Turkey'),
  ('b3e33f38-9951-439e-8d38-4602f72b1b07', 'Longevita',                                                   'active', 'Istanbul', 'Turkey')
ON CONFLICT (id) DO NOTHING;
