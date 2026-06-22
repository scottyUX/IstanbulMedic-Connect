## **Data sources we’re scanning and what they produce**

**A. Clinic-owned sources (high detail, lower trust on claims)**

* Clinic website pages, PDFs, brochures, price pages, FAQs  
* Produces: services, techniques, package inclusions, logistics, marketing claims, media

**B. Semi-official / registry sources (high trust, limited detail)**

* Public registry-like datasets (licenses, business registration, accreditations)  
* Produces: legal entity, addresses, registration IDs, accreditation claims (when available)

**C. Review platforms (medium trust, high volume)**

* Google/Trustpilot-like reviews (or simulated equivalents)  
* Produces: sentiment, recurring complaints, service quality signals, timestamps

**D. Community sources (signal-rich, noisy)**

* Medical tourism forums, Reddit, Quora  
* Produces: anecdotal outcomes, operational issues, bait-and-switch signals, coordinator behavior patterns

**E. Social media (trend signal, noisy)**

* Instagram/TikTok/YouTube/X style content  
* Produces: marketing intensity, influencer patterns, complaint clusters, before/after volume (carefully)

**F. IstanbulMedic operational sources (high value, internal)**

* Mystery inquiry results, consultation requests, internal verification notes  
* Produces: response times, quote consistency, package truth, professionalism

This schema separates **“Clinic canonical profile”** from **“Observed facts with evidence”** so we can store disagreements instead of overwriting.

## **2\) Core principle: canonical fields \+ evidence-backed facts**

We keep:

1. **Canonical clinic record** (what we show)  
2. **Facts** (each claim/value) with **evidence \+ confidence \+ timestamps**  
3. **Sources** (where evidence came from)

This is what enables “Explainable comparisons” and scoring.

## **3\) Minimum viable clinic schema (tables)**

### **A) `clinics` (canonical clinic identity)**

* `id` (uuid, pk)  
* `display_name`   
* `legal_name` (nullable)  
* `status` (active / inactive / under\_review) \- ENUM type, write in SQL editor  
* `primary_city`  
* `primary_country`  
* `website_url` (nullable)  
* `whatsapp_contact` (nullable)  
* `email_contact` (nullable)  
* `phone_contact` (nullable)  
* description text  
* short\_description text  
* thumbnail\_url text  
* `created_at`  
* `updated_at`

### **B) `clinic_locations`**

* `id` (uuid)  
* `clinic_id` (fk)  
* `location_name` (e.g., “Main Branch”)  
* `address_line`  
* `city`  
* `country`  
* `postal_code`  
* `latitude`, `longitude` (nullable)  
* `is_primary` (bool)

### **C) `clinic_services` (what they offer, normalized)**

* `id`  
* `clinic_id`  
* `service_category` (e.g., “Medical Tourism”, “Cosmetic”, “Dental”, etc.) \- ENUM  
* `service_name` (e.g., “Hair Transplant”, “Rhinoplasty”) *(you can keep this broad) \-* ENUM  
* `is_primary_service` (bool)

### **D) `clinic_packages` (what patients compare a lot)**

* `id`  
* `clinic_id`  
* `package_name`  
* `includes` (jsonb list: hotel, transfers, translator, meds, aftercare)  
* `excludes` (jsonb list)  
* `nights_included` (int, nullable)  
* `transport_included` (bool)  
* `aftercare_duration_days` (int, nullable)  
* price\_min numeric   
* price\_max numeric nullable  
* currency text 

### **E) `clinic_pricing` (structured, but flexible)**

* `id`  
* `clinic_id`  
* `service_name`  
* `price_min` (numeric, nullable)  
* `price_max` (numeric, nullable)  
* `currency` (text, nullable)  
* `pricing_type` (range / fixed / quote\_only) \- ENUM  
* `notes` (text, nullable)  
* source\_id uuid null (fk to sources)  
* is\_verified boolean default false  
* last\_verified\_at timestamp with time zone null

### **F) `clinic_team` (doctor involvement \+ staffing signals)**

* `id`  
* `clinic_id`  
* `role` (medical\_director / surgeon / coordinator / translator) \- ENUM  
* `name` (nullable)  
* `credentials` (text/jsonb)  
* `years_experience` (nullable)  
* `doctor_involvement_level` (high/medium/low/unknown) *(important for comparisons)*\- ENUM

### **G) `clinic_credentials` (accreditations / registrations)**

* `id`  
* `clinic_id`  
* `credential_type` (license / accreditation / membership / registry\_id) \- ENUM  
* `credential_name`  
* `credential_id` (nullable)  
* `issuing_body` (nullable)  
* `valid_from`, `valid_to` (nullable)

### **H) `clinic_languages`**

* `id`  
* `clinic_id`  
* `language` (('English', 'Arabic', 'Spanish', 'Russian', 'French', 'Portuguese', 'Hungarian', 'Italian', 'German', 'Polish', 'Ukranian', 'Dutch', 'Romanian', 'Hindi', 'Mandarin Chinese', 'Urdu', 'Bengali');)  \- ENUM  
* `support_type` (staff / translator / on\_request) \- ENUM

clinic\_media

* id  
* clinic\_id (fk)  
* media type  
* alt\_text  
* caption   
* is\_primary (bool) default false  
* display\_order integer default 0  
* source\_id (fk) \-\> sources(id)  
* uploaded\_at timestamp  
* created\_at timestamp

---

## **4\) Evidence \+ provenance layer (the key part)**

### **I) `sources` (what we scanned)**

* `id`  
* `source_type`  
  (clinic\_website, registry, review\_platform, forum, reddit, quora, social\_media, mystery\_inquiry, internal\_note) \- ENUM  
* `source_name` (e.g., “Clinic Website”, “Reddit”, “Quora”, “Forum X”)  
* `url` (nullable)  
* `captured_at` (timestamp)  
* `author_handle` (nullable, for community/social)  
* `content_hash` (nullable, to dedupe)

### **J) `source_documents` (raw text/metadata for RAG & audit)**

* `id`  
* `source_id` (fk)  
* `doc_type` (html, pdf, post, comment, review)  
* `title` (nullable)  
* `raw_text` (text or stored externally \+ pointer)  
* `language` (nullable)  
* `published_at` (nullable)

### **K) `clinic_facts` (atomic claims with confidence)**

This is the flexible layer that prevents schema breakage.

* `id`  
* `clinic_id`  
* `fact_key` (e.g., `pricing.hair_transplant_min`, `package.hotel_included`, `doctor_involvement_level`)  
* `fact_value` (jsonb) *(string/number/bool/object)*  
* `value_type` (string/number/bool/json)  
* `confidence` (0.0–1.0)  
* `computed_by` (extractor / human / inquiry / model)  
* `first_seen_at`, `last_seen_at`  
* `is_conflicting` (bool)

### **L) `fact_evidence` (many-to-many fact → evidence)**

* `id`  
* `clinic_fact_id` (fk)  
* `source_document_id` (fk)  
* `evidence_snippet` (text, optional)  
* `evidence_locator` (jsonb: page number, paragraph index, etc.)

This is what enables: “We say X because we observed it in Y.”

---

## **5\) Reviews and community signals (separate from facts)**

### **M) `clinic_reviews`**

* `id`  
* `clinic_id`  
* `source_id` (fk)  
* `rating` (nullable)  
* `review_text`  
* `review_date` (nullable)  
* `language` (nullable)

### **N) `clinic_mentions` (forums/reddit/quora/social)**

* `id`  
* `clinic_id` (nullable if not resolvable yet)  
* `source_id` (fk)  
* `mention_text`  
* `topic` ( 'pricing', 'results', 'staff', 'logistics', 'complaint', 'praise', 'bait\_and\_switch', 'coordinator\_behavior', 'response\_time', 'package\_accuracy', 'before\_after')  
* `sentiment` (neg/neutral/pos, nullable)  
* `created_at`

---

## **6\) Scoring support (for overall score modeling)**

### **O) `clinic_score_components`**

* `id`  
* `clinic_id`  
* `component_key` (transparency, consistency, reputation, responsiveness, etc.)  
* `score` (0–100)  
* `weight` (0–1)  
* `explanation` (text)  
* `computed_at`

### **P) `clinic_scores`**

* `clinic_id` (pk/fk)  
* `overall_score` (0–100)  
* `band` (A/B/C/D)  
* `computed_at`  
* `version` (text)

---

## **7\) Instagram Data**

* Example JSONS  
  * Raw:[https://drive.google.com/file/d/1l2lGYPHTM\_eFE9NjM0j95xNQOdAA6ajS/view?usp=sharing](https://drive.google.com/file/d/1l2lGYPHTM_eFE9NjM0j95xNQOdAA6ajS/view?usp=sharing)  
  * Cleaned:[https://drive.google.com/file/d/1CWxPsxojJIEaVFmmHyU4ZPgCFnzotrkM/view?usp=sharing](https://drive.google.com/file/d/1CWxPsxojJIEaVFmmHyU4ZPgCFnzotrkM/view?usp=sharing) 

clinic\_social\_media 

*  id uuid (pk)  
*  clinic\_id uuid  fk  
*  platform social\_platform\_enum   \-- instagram, tiktok, youtube, etc.  
*  account\_handle varchar             \-- e.g., "istanbulmedic"  
*  follower\_count bigint                   \-- How many followers  
*  verified boolean DEFAULT false             \-- Blue checkmark?  
*  last\_checked\_at timestamp               \-- When we last updated this  
*  created\_at timestamp  
*  UNIQUE(clinic\_id, platform, account\_handle) \-- One record per account

---

## **7\) What you can build immediately with this (Stage 1\)**

* Search/browse clinics from `clinics` \+ `clinic_locations`  
* Clinic profile from canonical tables \+ highest-confidence `clinic_facts`  
* Comparison view using shared `fact_key`s \+ package/pricing/team tables  
* Explainability by showing evidence via `fact_evidence` and `sources`  
* Score-driven ordering using `clinic_scores`

---

## **8\) Optional: “ClinicProfile” API object (what frontend consumes)**

You’ll likely expose a merged view like:

* clinic identity \+ locations  
* services  
* packages/pricing  
* doctor involvement level  
* key comparison facts (with confidence)  
* score band \+ explanation bullets  
* provenance summary

If you want, I can provide a **single JSON shape** for `ClinicProfile` that the frontend and agent tools (LangChain) can rely on.

---

If you paste the **comparison dimensions list** you mentioned from the earlier chat (even rough), I’ll map each dimension into:

* canonical field vs `fact_key`  
* which sources populate it  
* how to compute confidence & conflicts for it

