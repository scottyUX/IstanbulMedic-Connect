# IstanbulMedic-Connect API & Schema Documentation

## Table of Contents
- [Overview](#overview)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Data Flow](#data-flow)
- [Examples](#examples)

---

## Overview

IstanbulMedic-Connect is a clinic comparison platform that collects and analyzes data from multiple sources to provide evidence-based clinic ratings. The system uses a fact-based architecture where all claims about clinics are backed by verifiable sources.

### Key Principles

1. **Evidence-Based**: Every fact has a source and confidence score
2. **Temporal Tracking**: Track when facts were first seen and last updated
3. **Conflict Detection**: Identify when different sources contradict each other
4. **Provenance Chain**: Source → Document → Fact → Evidence

---

## Database Schema

### Core Tables

#### **clinics**
The canonical clinic profile.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| display_name | varchar | Public-facing clinic name |
| legal_name | varchar | Official registered name |
| status | enum | `active`, `inactive`, `under_review` |
| primary_city | varchar | Main city of operation |
| primary_country | varchar | Country |
| website_url | text | Official website |
| whatsapp_contact | text | WhatsApp contact |
| email_contact | text | Email address |
| phone_contact | varchar(20) | Phone number |
| description | text | Full description |
| short_description | text | Brief description |
| thumbnail_url | text | Main image URL |
| years_in_operation | integer | Number of years the clinic has been operating (≥ 0) |
| procedures_performed | integer | Total number of procedures performed (≥ 0) |
| created_at | timestamptz | Record creation time |
| updated_at | timestamptz | Last update time |

**Enums:**
- `clinic_status`: `active`, `inactive`, `under_review`

---

#### **clinic_locations**
Physical locations of clinics.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| location_name | varchar | Branch name |
| address_line | text | Street address |
| city | varchar | City |
| country | varchar | Country |
| postal_code | varchar | Postal code |
| latitude | double | GPS latitude |
| longitude | double | GPS longitude |
| is_primary | boolean | Primary location flag |
| opening_hours | jsonb | Day-based hours, e.g. `{"monday": {"open": "09:00", "close": "18:00"}}` |
| payment_methods | text[] | Accepted payment methods, e.g. `{"Cash", "Credit Card", "Bank Transfer"}` |

---

#### **clinic_services**
Services offered by clinics.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| service_category | enum | Category of service |
| service_name | enum | Specific service |
| is_primary_service | boolean | Main service flag |

**Enums:**
- `clinic_service_category`: `Medical Tourism`, `Cosmetic`, `Dental`, `Other`
- `clinic_service_name`: `Hair Transplant`, `Rhinoplasty`, `Other`

---

#### **clinic_team**
Team members and staff.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| role | enum | Staff role |
| name | varchar | Person's name |
| credentials | text | Qualifications |
| years_experience | bigint | Years of experience |
| doctor_involvement_level | enum | Doctor involvement |
| photo_url | text | URL to doctor/staff photo |

**Enums:**
- `clinic_roles`: `medical_director`, `surgeon`, `coordinator`, `translator`, `nurse`, `doctor`, `other`
- `doctor_involvement_levels`: `high`, `medium`, `low`

---

#### **clinic_pricing**
Service pricing information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| service_name | varchar | Service being priced |
| price_min | numeric | Minimum price |
| price_max | numeric | Maximum price |
| currency | text | Currency code |
| pricing_type | enum | Type of pricing |
| notes | text | Additional notes |
| source_id | uuid | FK to sources (provenance) |
| is_verified | boolean | Manually verified |
| last_verified_at | timestamptz | Verification date |

**Enums:**
- `clinic_pricing_type`: `range`, `fixed`, `quote_only`

**Constraints:**
- If `pricing_type = 'quote_only'`, prices must be NULL
- Otherwise, at least one price must be provided

---

#### **clinic_packages**
All-inclusive packages.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| package_name | varchar | Package name |
| includes | jsonb | Array of inclusions |
| excludes | jsonb | Array of exclusions |
| nights_included | int | Hotel nights |
| transport_included | boolean | Transport included |
| aftercare_duration_days | int | Aftercare period |
| price_min | numeric | Minimum price |
| price_max | numeric | Maximum price |
| currency | text | Currency code |

**Constraints:**
- `nights_included >= 0`
- `aftercare_duration_days >= 0`

---

#### **clinic_credentials**
Accreditations and licenses.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| credential_type | enum | Type of credential |
| credential_name | varchar | Credential name |
| credential_id | bigint | ID number |
| issuing_body | varchar | Issuing organization |
| valid_from | date | Start date |
| valid_to | date | End date |

**Enums:**
- `clinic_credential_types`: `license`, `accreditation`, `membership`, `registry_id`, `other`

---

#### **clinic_languages**
Language support.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| language | enum | Language |
| support_type | enum | How support is provided |

**Enums:**
- `clinic_language_types`: `English`, `Arabic`, `Spanish`, `Russian`, `French`, `Portuguese`, `Hungarian`, `Italian`, `German`, `Polish`, `Ukranian`, `Dutch`, `Romanian`, `Hindi`, `Mandarin Chinese`, `Urdu`, `Bengali`
- `clinic_language_support_types`: `staff`, `translator`, `on_request`

---

#### **clinic_media**
Images and videos.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| media_type | text | Type of media |
| url | text | Media URL |
| alt_text | text | Alt text |
| caption | text | Caption |
| is_primary | boolean | Primary image flag (unique per clinic) |
| display_order | integer | Display order |
| source_id | uuid | FK to sources |
| uploaded_at | timestamptz | Upload timestamp |
| created_at | timestamptz | Record creation |

**Types:**
- `media_type`: `image`, `video`, `before_after`, `certificate`

**Constraints:**
- `(clinic_id, url)` unique — prevents duplicate media per clinic
- Only one `is_primary = true` record per clinic (partial unique index)

---

### Evidence & Provenance Tables

#### **sources**
Where data came from.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| source_type | enum | Type of source |
| source_name | varchar | Source name |
| url | text | Source URL |
| captured_at | timestamptz | When data was captured |
| author_handle | varchar | Author/username |
| content_hash | varchar | Unique hash (prevents duplicates) |

**Enums:**
- `source_type_enum`: `clinic_website`, `registry`, `review_platform`, `forum`, `reddit`, `quora`, `social_media`, `mystery_inquiry`, `internal_note`

**Unique Constraint:** `content_hash`

---

#### **source_documents**
Raw documents from sources.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| source_id | uuid | FK to sources |
| doc_type | enum | Document type |
| title | varchar | Document title |
| raw_text | text | Full text content |
| language | varchar | Language |
| published_at | timestamptz | Publication date |

**Enums:**
- `doc_type_enum`: `html`, `pdf`, `post`, `comment`, `review`

---

#### **clinic_facts**
Individual claims about clinics.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| fact_key | varchar | Fact identifier |
| fact_value | jsonb | Fact value (flexible type) |
| value_type | enum | Data type |
| confidence | real | Confidence score (0.0–1.0) |
| computed_by | enum | How fact was derived |
| first_seen_at | timestamptz | When first observed |
| last_seen_at | timestamptz | When last observed |
| is_conflicting | boolean | Conflicts with other facts |

**Enums:**
- `value_type_enum`: `string`, `number`, `bool`, `json`
- `computed_by_enum`: `extractor`, `human`, `inquiry`, `model`

**Unique Constraint:** `(clinic_id, fact_key)` — enables safe upserts via `upsert_clinic_facts()`

**Constraints:**
- `confidence >= 0.0 AND confidence <= 1.0`

**Example Facts:**
- `instagram_followers_count`: 2140 (confidence: 1.0)
- `instagram_verified`: false (confidence: 1.0)
- `website_url_from_instagram`: "https://..." (confidence: 0.90)
- `services_claimed_instagram`: ["medical travel"] (confidence: 0.80)
- `instagram_avg_likes_per_post`: 142 (confidence: 1.0)
- `instagram_top_hashtags`: [{"tag": "hairtransplant", "count": 18}, ...] (confidence: 0.9)
- `instagram_inferred_services`: ["hair_transplant"] (confidence: 0.7)
- `instagram_top_commented_posts_sample`: [{postUrl, commentsCount, comments: [...]}] (confidence: 1.0)

---

#### **fact_evidence**
Links facts to their sources.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_fact_id | uuid | FK to clinic_facts |
| source_document_id | uuid | FK to source_documents |
| evidence_snippet | text | Relevant text excerpt |
| evidence_locator | jsonb | Location in document |

**Evidence Chain:**
```
sources → source_documents → fact_evidence → clinic_facts → clinics
```

---

### Social Media Tables

#### **clinic_social_media**
Social media accounts.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| platform | enum | Social platform |
| account_handle | varchar | Username/handle |
| follower_count | bigint | Follower count |
| follows_count | bigint | Number of accounts this profile follows |
| posts_count | integer | Total posts at time of last check |
| highlights_count | integer | Number of story highlights |
| is_private | boolean | Whether the account is private |
| business_category | varchar | e.g. "Medical & health" |
| verified | boolean | Verified account |
| last_checked_at | timestamptz | Last update |
| created_at | timestamptz | Record creation |

**Enums:**
- `social_platform_enum`: `instagram`, `tiktok`, `x`, `reddit`, `youtube`, `facebook`

**Unique Constraint:** `(clinic_id, platform, account_handle)`

---

#### **clinic_instagram_posts**
Snapshot of Instagram posts at time of scrape. Engagement counts are point-in-time, not live.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| source_id | uuid | FK to sources |
| instagram_post_id | varchar | Instagram's internal post ID — used for deduplication |
| short_code | varchar | Used to reconstruct URL: `instagram.com/p/{short_code}` |
| post_type | enum | `Image`, `Video`, or `Sidecar` (carousel) |
| url | text | Full post URL |
| caption | text | Post caption text |
| hashtags | text[] | Hashtags without `#` prefix, lowercased |
| first_comment_text | text | Text of the `firstComment` field returned by the scraper (may be own account). Null if no comments. |
| comments_data | jsonb | Sanitised `latestComments` array — profile pic URLs are stripped. Shape: `[{id, text, ownerUsername, timestamp, likesCount, repliesCount, replies: [{id, text, ownerUsername, timestamp, likesCount}]}]` |
| likes_count | integer | Snapshot at time of capture |
| comments_count | integer | Snapshot at time of capture |
| posted_at | timestamptz | When the post was originally published |
| captured_at | timestamptz | When this data was scraped |

**Enums:**
- `instagram_post_type`: `Image`, `Video`, `Sidecar`

**Unique Constraint:** `(clinic_id, instagram_post_id)`

**Indexes:**
- `idx_instagram_posts_clinic_id` — lookups by clinic
- `idx_instagram_posts_posted_at` — chronological ordering per clinic
- `idx_instagram_posts_hashtags` — GIN index for hashtag array queries
- `idx_instagram_posts_source_id` — provenance lookups
- `idx_instagram_posts_comments` — GIN index for JSONB comment queries

> **Note on comment sanitisation:** `ownerProfilePicUrl` fields are stripped before storage. These are short-lived CDN-signed URLs with no analytical value. All other comment fields are preserved.

---

#### **clinic_google_places**
Google Places data for clinics.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| place_id | varchar | Google's unique place ID |
| rating | numeric | Current rating |
| user_ratings_total | bigint | Total review count |
| last_checked_at | timestamptz | When last synced |
| created_at | timestamptz | Record creation |
| updated_at | timestamptz | Last update |

**Unique Constraint:** `(clinic_id, place_id)`

---

### Review & Mention Tables

#### **clinic_reviews**
Reviews from various platforms.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| source_id | uuid | FK to sources |
| rating | varchar | Rating (e.g., "5/5") |
| review_text | text | Review content |
| review_date | date | Review date |
| language | varchar | Language |

**Unique Constraint:** `(clinic_id, source_id, review_text, review_date)` — prevents duplicate reviews

---

#### **clinic_mentions**
Mentions in forums/social media.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics (nullable) |
| source_id | uuid | FK to sources |
| mention_text | text | Mention content |
| topic | enum | Topic category |
| sentiment | enum | Sentiment analysis |
| created_at | timestamptz | Record creation |

**Enums:**
- `mention_topic_enum`: `pricing`, `results`, `staff`, `logistics`, `complaint`, `praise`, `bait_and_switch`, `coordinator_behavior`, `response_time`, `package_accuracy`, `before_after`
- `sentiment_enum`: `negative`, `neutral`, `positive`

---

### Scoring Tables

#### **clinic_score_components**
Individual scoring factors.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| clinic_id | uuid | FK to clinics |
| component_key | varchar | Component name |
| score | int | Score (0–100) |
| weight | real | Weight (0.0–1.0) |
| explanation | text | Why this score |
| computed_at | timestamptz | Computation time |

**Constraints:**
- `score >= 0 AND score <= 100`
- `weight >= 0.0 AND weight <= 1.0`

---

#### **clinic_scores**
Overall clinic scores.

| Column | Type | Description |
|--------|------|-------------|
| clinic_id | uuid | Primary key, FK to clinics |
| overall_score | int | Overall score (0–100) |
| band | enum | Score band |
| computed_at | timestamptz | Computation time |
| version | text | Scoring algorithm version |

**Enums:**
- `score_band_enum`: `A`, `B`, `C`, `D`

**Constraints:**
- `overall_score >= 0 AND overall_score <= 100`

---

## Database Functions

### **upsert_clinic_facts(facts_data jsonb)**

Batch-upserts clinic facts while preserving `first_seen_at`.

```sql
SELECT * FROM upsert_clinic_facts('[
  {
    "clinic_id": "...",
    "fact_key": "instagram_followers_count",
    "fact_value": 2140,
    "value_type": "number",
    "confidence": 1.0,
    "computed_by": "extractor",
    "is_conflicting": false,
    "first_seen_at": "2026-02-15T00:00:00Z",
    "last_seen_at": "2026-02-22T00:00:00Z"
  }
]'::jsonb);
```

On conflict, `first_seen_at` is preserved and `last_seen_at` is updated to the new value.

---

## API Endpoints

### **POST /api/import/instagram**

Import Instagram profile and post data for a single clinic.

#### Request

```json
{
  "clinicId": "550e8400-e29b-41d4-a716-446655440001",
  "instagramData": {
    "instagram": {
      "inputUrl": "https://www.instagram.com/istanbulmedic",
      "id": "7770751797",
      "username": "istanbulmedic",
      "fullName": "IstanbulMedic",
      "biography": "IstanbulMedic is accredited medical travel expert in Turkey.",
      "externalUrls": ["https://linktr.ee/istanbulmedic"],
      "followersCount": 2140,
      "postsCount": 100,
      "verified": false,
      "isBusinessAccount": true,
      "businessCategoryName": "None,Medical & health"
    },
    "extracted_claims": {
      "identity": { "display_name_variants": ["IstanbulMedic"] },
      "social": {
        "instagram": {
          "follows_count": 312,
          "posts_count": 100,
          "highlights_count": 8,
          "is_private": false
        }
      },
      "positioning": { "claims": ["accredited"] },
      "contact": {
        "address_text": "Caferağa Mahallesi, Moda Caddesi No: 72 Daire:5, Kadıköy",
        "link_aggregator_detected": "https://linktr.ee/istanbulmedic",
        "website_candidates": ["https://istanbulmedic.com"]
      },
      "services": { "claimed": ["medical travel"] },
      "geography": { "claimed": ["Kadıköy"] },
      "languages": { "claimed": ["English", "Arabic"] }
    },
    "posts": [
      {
        "id": "abc123",
        "type": "image",
        "shortCode": "Cxyz",
        "url": "https://www.instagram.com/p/Cxyz/",
        "caption": "New hair transplant results! #hairtransplant #istanbul",
        "hashtags": ["hairtransplant", "istanbul"],
        "mentions": [],
        "likesCount": 210,
        "commentsCount": 14,
        "firstComment": "Amazing results!",
        "latestComments": [
          {
            "id": "17895795231365091",
            "text": "Amazing results!",
            "ownerUsername": "someuser",
            "ownerProfilePicUrl": "https://...",
            "timestamp": "2026-01-16T09:00:00Z",
            "likesCount": 2,
            "repliesCount": 1,
            "replies": [
              {
                "id": "17895795231365092",
                "text": "Thank you!",
                "ownerUsername": "istanbulmedic",
                "timestamp": "2026-01-16T10:00:00Z",
                "likesCount": 0,
                "repliesCount": 0,
                "replies": []
              }
            ]
          }
        ],
        "timestamp": "2026-01-15T10:30:00Z",
        "displayUrl": "https://..."
      }
    ]
  }
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "message": "Instagram data imported successfully",
  "summary": {
    "sourceCreated": true,
    "documentCreated": true,
    "socialMediaUpdated": true,
    "factsCreated": 17,
    "postFactsCreated": 8,
    "postsUpserted": 1,
    "evidenceLinked": 17
  },
  "results": {
    "source": {
      "id": "abc-123-def",
      "source_type": "social_media",
      "source_name": "Instagram"
    },
    "socialMedia": {
      "id": "xyz-789",
      "account_handle": "istanbulmedic",
      "follower_count": 2140,
      "follows_count": 312,
      "posts_count": 100,
      "highlights_count": 8,
      "is_private": false,
      "business_category": "Medical & health"
    },
    "posts": [
      {
        "id": "...",
        "instagram_post_id": "abc123",
        "first_comment_text": "Amazing results!",
        "comments_data": [
          {
            "id": "17895795231365091",
            "text": "Amazing results!",
            "ownerUsername": "someuser",
            "timestamp": "2026-01-16T09:00:00Z",
            "likesCount": 2,
            "repliesCount": 1,
            "replies": [
              {
                "id": "17895795231365092",
                "text": "Thank you!",
                "ownerUsername": "istanbulmedic",
                "timestamp": "2026-01-16T10:00:00Z",
                "likesCount": 0
              }
            ]
          }
        ]
      }
    ],
    "facts": [
      {
        "id": "fact-1",
        "fact_key": "instagram_followers_count",
        "fact_value": 2140,
        "confidence": 1.0
      }
    ]
  }
}
```

#### Facts Extracted

**Profile facts:**

| Fact Key | Confidence | Type | Description |
|----------|------------|------|-------------|
| `instagram_followers_count` | 1.0 | number | Follower count |
| `instagram_posts_count` | 1.0 | number | Post count |
| `instagram_verified` | 1.0 | bool | Verification status |
| `instagram_is_business` | 1.0 | bool | Business account |
| `instagram_positioning_claims` | 0.85 | json | Claims like "accredited" |
| `website_url_from_instagram` | 0.90 | string | First external URL |
| `services_claimed_instagram` | 0.80 | json | Services mentioned |
| `geographic_location_instagram` | 0.75 | json | Location mentions |
| `address_from_instagram` | 0.85 | string | Physical address text |
| `link_aggregator_detected_instagram` | 1.0 | string | Link aggregator URL (e.g. Linktree) |
| `display_name_variants_instagram` | 0.9 | json | Name variants from identity claims |

**Post-derived facts (when `posts` array is provided):**

| Fact Key | Confidence | Type | Description |
|----------|------------|------|-------------|
| `instagram_avg_likes_per_post` | 1.0 | number | Average likes across posts |
| `instagram_avg_comments_per_post` | 1.0 | number | Average comments across posts |
| `instagram_top_hashtags` | 0.9 | json | Top 20 hashtags by frequency |
| `instagram_inferred_services` | 0.7 | json | Services inferred from hashtags |
| `instagram_last_post_at` | 1.0 | string | Most recent post timestamp |
| `instagram_website_mentions_in_posts` | 0.75 | json | URLs mentioned in captions |
| `instagram_top_posts_sample` | 1.0 | json | Top 5 posts by likes (caption capped at 300 chars) |
| `instagram_top_commented_posts_sample` | 1.0 | json | Top 5 posts by comment count with full sanitised comment threads — intended for downstream LLM sentiment analysis |

#### What Happens

1. ✅ Creates or upserts `source` record (keyed on `content_hash`)
2. ✅ Creates `source_document` with full raw JSON
3. ✅ Upserts `clinic_social_media` record (including Instagram-specific fields)
4. ✅ Upserts `clinic_instagram_posts` records including `first_comment_text` and sanitised `comments_data`
5. ✅ Extracts profile facts and post-derived facts with confidence scores
6. ✅ Links evidence to each fact via `fact_evidence`
7. ✅ Updates clinic `website_url` if currently empty

#### Comment Sanitisation

`ownerProfilePicUrl` is stripped from all comment and reply objects before storage. These are short-lived CDN-signed URLs with no analytical value. All other comment fields (`id`, `text`, `ownerUsername`, `timestamp`, `likesCount`, `repliesCount`, `replies`) are preserved.

#### Temporal Tracking

- First import: `first_seen_at = now`, `last_seen_at = now`
- Subsequent imports: `first_seen_at` preserved, `last_seen_at = now`

---

### **POST /api/import/instagram/bulk**

Import Instagram data for multiple clinics.

#### Request

```json
{
  "imports": [
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440001",
      "instagramData": { }
    },
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440002",
      "instagramData": { }
    }
  ]
}
```

#### Response (200 OK)

```json
{
  "success": true,
  "totalImports": 2,
  "successfulImports": 2,
  "failedImports": 0,
  "results": [
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440001",
      "username": "istanbulmedic",
      "success": true,
      "summary": { "factsCreated": 17, "postsUpserted": 100 }
    },
    {
      "clinicId": "550e8400-e29b-41d4-a716-446655440002",
      "username": "ankarasmile",
      "success": true,
      "summary": { "factsCreated": 15, "postsUpserted": 60 }
    }
  ]
}
```

#### Features

- ✅ Sequential processing
- ✅ 100ms delay between imports (rate limiting)
- ✅ Continues on individual failures
- ✅ Progress logging to console
- ✅ Detailed error reporting

---

## Data Flow

### Instagram Import Flow

```
1. External Instagram Data (JSON)
   ↓
2. POST /api/import/instagram
   ↓
3. Create/Update Database Records:
   ├── sources (audit trail)
   ├── source_documents (raw JSON)
   ├── clinic_social_media (current state + Instagram-specific fields)
   ├── clinic_instagram_posts (post snapshots + comments)
   ├── clinic_facts (profile facts + post-derived facts with confidence scores)
   └── fact_evidence (links to sources)
   ↓
4. Response with summary
```

### Evidence Chain

```
User sees: "Clinic has 2,140 Instagram followers"
   ↓
Backed by: clinic_facts.fact_value = 2140
   ↓
Evidence: fact_evidence.evidence_snippet = "Followers: 2140"
   ↓
From: source_documents.raw_text = {full JSON}
   ↓
Source: sources.url = "https://instagram.com/istanbulmedic"
```

---

## Examples

### Query Facts with Evidence

```sql
SELECT 
  cf.fact_key,
  cf.fact_value,
  cf.confidence,
  fe.evidence_snippet,
  sd.title as source_doc,
  s.source_name,
  s.url,
  cf.first_seen_at,
  cf.last_seen_at
FROM clinic_facts cf
JOIN fact_evidence fe ON fe.clinic_fact_id = cf.id
JOIN source_documents sd ON sd.id = fe.source_document_id
JOIN sources s ON s.id = sd.source_id
WHERE cf.clinic_id = '550e8400-e29b-41d4-a716-446655440001'
ORDER BY cf.confidence DESC, cf.last_seen_at DESC;
```

### Get Clinic with All Data

```typescript
const { data } = await supabase
  .from('clinics')
  .select(`
    *,
    clinic_locations(*),
    clinic_services(*),
    clinic_team(*),
    clinic_pricing(*),
    clinic_packages(*),
    clinic_credentials(*),
    clinic_social_media(*),
    clinic_instagram_posts(*),
    clinic_google_places(*),
    clinic_scores(*)
  `)
  .eq('id', clinicId)
  .single()
```

### Track Follower Growth

```sql
SELECT 
  cf.fact_key,
  cf.fact_value::text::int as followers,
  cf.first_seen_at,
  cf.last_seen_at,
  (cf.last_seen_at - cf.first_seen_at) as tracking_duration
FROM clinic_facts cf
WHERE cf.clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND cf.fact_key = 'instagram_followers_count';
```

### Get Top Hashtags for a Clinic

```sql
SELECT 
  cf.fact_value
FROM clinic_facts cf
WHERE cf.clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND cf.fact_key = 'instagram_top_hashtags';
```

### Query Posts by Hashtag

```sql
SELECT url, caption, likes_count, comments_count, posted_at
FROM clinic_instagram_posts
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND hashtags @> ARRAY['hairtransplant']
ORDER BY posted_at DESC;
```

### Search Comment Text Across Posts

```sql
-- Find posts where any comment mentions a keyword
SELECT url, caption, comments_count
FROM clinic_instagram_posts
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND comments_data @> '[{"text": "great results"}]';

-- Extract all comment texts for a clinic (for LLM processing)
SELECT
  url,
  jsonb_path_query_array(comments_data, '$[*].text') AS comment_texts,
  jsonb_path_query_array(comments_data, '$[*].replies[*].text') AS reply_texts
FROM clinic_instagram_posts
WHERE clinic_id = '550e8400-e29b-41d4-a716-446655440001'
  AND jsonb_array_length(comments_data) > 0;
```

---

## Migrations

| Migration | Date | Description |
|-----------|------|-------------|
| `20260210211529_create_initial_tables` | 2026-02-10 | Initial schema: clinics, locations, services, packages, pricing, team, credentials, languages, sources, documents, facts, evidence, reviews, mentions, scoring, media, social media, Google Places |
| `20260214120000_add_schema_enhancements` | 2026-02-14 | Added `opening_hours` and `payment_methods` to `clinic_locations`; `photo_url` to `clinic_team`; `years_in_operation` and `procedures_performed` to `clinics` |
| `20260215042850_upsert_clinic_facts_function` | 2026-02-15 | Added `upsert_clinic_facts(facts_data jsonb)` PL/pgSQL function |
| `20260220192408_update_for_new_insta_endpoint` | 2026-02-22 | Added `follows_count`, `posts_count`, `highlights_count`, `is_private`, `business_category` to `clinic_social_media`; Added `clinic_instagram_posts` table with `instagram_post_type` enum, 5 indexes including GIN indexes on `hashtags` and `comments_data`; updated `first_comment_text` and `comments_data` columns to `clinic_instagram_posts`; added `idx_instagram_posts_comments` GIN index; added `instagram_top_commented_posts_sample` fact |

### Migration Management

```bash
# Create a new migration
supabase migration new migration_name

# Apply locally
supabase db reset

# Apply to remote
supabase db push

# View status
supabase status
```

---

## Development Setup

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Start Services

```bash
# Start Supabase
supabase start

# Start Next.js
npm run dev
```

### Test Import

```bash
curl -X POST http://localhost:3000/api/import/instagram \
  -H "Content-Type: application/json" \
  -d @test-import.json
```

---

## Best Practices

### Confidence Scores

- **1.0**: Direct platform data (follower counts, verification, computed engagement stats, comment snapshots)
- **0.90**: Structured external links
- **0.85**: Extracted structured claims (positioning, address)
- **0.80**: Claimed services from text
- **0.75**: Geographic signals (loose mentions), website mentions in captions
- **0.70**: Inferred services from hashtag patterns

### Evidence Chain

Always maintain a complete chain:
1. Create `source` record
2. Create `source_document` with raw data
3. Extract `clinic_facts`
4. Link via `fact_evidence`

### Temporal Tracking

- Use SQL function `upsert_clinic_facts` to preserve `first_seen_at`
- Always update `last_seen_at` on import
- Track changes over time for trend analysis

### Comment Storage

- Store comments as JSONB in `clinic_instagram_posts.comments_data` for flexible querying
- Always sanitise before storage — strip `ownerProfilePicUrl` from all comment and reply objects
- Use `first_comment_text` for quick text access without parsing JSONB
- Use the GIN index on `comments_data` for `@>` containment queries
- The `instagram_top_commented_posts_sample` fact provides a pre-aggregated view for LLM sentiment pipelines without requiring a table scan

---

## Future Enhancements

- [ ] Reddit scraping endpoint
- [ ] Review platform integration
- [ ] Mystery inquiry tracking
- [ ] Automated scoring algorithm
- [ ] Conflict detection and resolution
- [ ] Real-time data refresh webhooks
- [ ] LLM-powered comment sentiment analysis using `instagram_top_commented_posts_sample`

---

**Last Updated:** February 2026  
**Version:** 1.2.0  
**Database:** PostgreSQL via Supabase  
**Framework:** Next.js 14 with TypeScript