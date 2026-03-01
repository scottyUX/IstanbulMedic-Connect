# Backend Schema Mapping Analysis

This document analyzes how the backend database schema aligns with the current frontend implementation and outlines the changes needed for integration.

**Last Updated:** February 2026
**Backend Branch:** `backendstart`
**Migration File:** `supabase/migrations/20260210211529_create_initial_tables.sql`

---

## Table of Contents

1. [Actual Backend Schema](#actual-backend-schema) ✨ NEW
2. [Alignment Overview](#alignment-overview)
3. [Detailed Field Mapping](#detailed-field-mapping)
4. [Frontend Type Definitions](#frontend-type-definitions)
5. [API Response Types](#api-response-types)
6. [Filter State Alignment](#filter-state-alignment)
7. [Summary & Recommendations](#summary--recommendations)

---

## Actual Backend Schema

The backend team has implemented the full schema. Here are the actual ENUMs and tables:

### ENUMs Defined

```sql
-- Clinic Status
CREATE TYPE clinic_status AS ENUM ('active', 'inactive', 'under_review');

-- Services
CREATE TYPE clinic_service_category AS ENUM ('Medical Tourism', 'Cosmetic', 'Dental', 'Other');
CREATE TYPE clinic_service_name AS ENUM ('Hair Transplant', 'Rhinoplasty', 'Other');

-- Pricing
CREATE TYPE clinic_pricing_type AS ENUM ('range', 'fixed', 'quote_only');

-- Team
CREATE TYPE clinic_roles AS ENUM ('medical_director', 'surgeon', 'coordinator', 'translator', 'nurse', 'doctor', 'other');
CREATE TYPE doctor_involvement_levels AS ENUM ('high', 'medium', 'low');

-- Credentials
CREATE TYPE clinic_credential_types AS ENUM ('license', 'accreditation', 'membership', 'registry_id', 'other');

-- Languages
CREATE TYPE clinic_language_support_types AS ENUM ('staff', 'translator', 'on_request');
CREATE TYPE clinic_language_types AS ENUM (
  'English', 'Arabic', 'Spanish', 'Russian', 'French', 'Portuguese',
  'Hungarian', 'Italian', 'German', 'Polish', 'Ukranian', 'Dutch',
  'Romanian', 'Hindi', 'Mandarin Chinese', 'Urdu', 'Bengali'
);

-- Evidence Layer
CREATE TYPE source_type_enum AS ENUM (
  'clinic_website', 'registry', 'review_platform', 'forum', 'reddit',
  'quora', 'social_media', 'mystery_inquiry', 'internal_note'
);
CREATE TYPE doc_type_enum AS ENUM ('html', 'pdf', 'post', 'comment', 'review');
CREATE TYPE value_type_enum AS ENUM ('string', 'number', 'bool', 'json');
CREATE TYPE computed_by_enum AS ENUM ('extractor', 'human', 'inquiry', 'model');

-- Mentions
CREATE TYPE mention_topic_enum AS ENUM (
  'pricing', 'results', 'staff', 'logistics', 'complaint', 'praise',
  'bait_and_switch', 'coordinator_behavior', 'response_time',
  'package_accuracy', 'before_after'
);
CREATE TYPE sentiment_enum AS ENUM ('negative', 'neutral', 'positive');

-- Scores
CREATE TYPE score_band_enum AS ENUM ('A', 'B', 'C', 'D');
```

### Key Schema Differences from Original Plan

| Original Plan | Actual Implementation | Notes |
|---------------|----------------------|-------|
| `ServiceCategory` had 5 values | 4 values: `Medical Tourism`, `Cosmetic`, `Dental`, `Other` | Simpler categorization |
| Languages had ~10 options | 17 languages supported | More comprehensive |
| Team roles not defined | 7 roles: `medical_director`, `surgeon`, `coordinator`, etc. | Well-structured |
| Evidence layer theoretical | Fully implemented with `sources`, `source_documents`, `clinic_facts`, `fact_evidence` | Excellent provenance tracking |
| `clinic_media` requested | ✅ Created with `media_type` CHECK constraint | Supports `image`, `video`, `before_after`, `certificate` |

---

## Alignment Overview

| Backend Table | Frontend Current | Status |
|---------------|------------------|--------|
| `clinics` | `Clinic` interface | ⚠️ Partial match |
| `clinic_locations` | `location: string` | ❌ Needs expansion |
| `clinic_services` | `specialties: string[]` | ❌ Needs typing |
| `clinic_packages` | Not present | ❌ Missing |
| `clinic_pricing` | Not present | ❌ Missing |
| `clinic_team` | `doctors[]` (inline) | ⚠️ Needs restructure |
| `clinic_credentials` | `accreditations` in filters | ⚠️ Partial |
| `clinic_languages` | `languages` in filters | ⚠️ Partial |
| `clinic_reviews` | `reviews` (inline) | ⚠️ Needs source linkage |
| `clinic_mentions` | `communitySignals.posts` | ⚠️ Close, needs topics |
| `clinic_scores` | `trustScore: number` | ⚠️ Needs components |
| `clinic_media` | images in profile | ⚠️ Needs integration |
| `sources` / `clinic_facts` / `fact_evidence` | Not present | ❌ Missing entirely |

### Legend

- ✅ Full alignment
- ⚠️ Partial match (needs updates)
- ❌ Missing or incompatible

---

## Detailed Field Mapping

### 1. clinics → Clinic

```
Backend: clinics                    Frontend: Clinic
─────────────────────────────────────────────────────
id (uuid)                      →    id (number) ❌ type mismatch
display_name                   →    name ✓
legal_name                     →    (missing)
status                         →    (missing)
primary_city + primary_country →    location (string) ⚠️ flattened
website_url                    →    (missing)
whatsapp_contact              →    (missing)
email_contact                 →    (missing)
phone_contact                 →    (missing)
```

**Issues:**
- ID type mismatch (uuid vs number)
- Location is flattened to a string instead of structured
- Missing contact information fields
- Missing status field for filtering active clinics

---

### 2. clinic_locations → location

```
Backend: clinic_locations           Frontend: location
─────────────────────────────────────────────────────
id (uuid)                      →    (missing)
clinic_id (fk)                 →    (implicit)
location_name                  →    (missing)
address_line                   →    location.address (profile only)
city                           →    (missing - part of string)
country                        →    (missing - part of string)
postal_code                    →    (missing)
latitude, longitude            →    location.lat/lng (profile only)
is_primary                     →    (missing)
```

**Issues:**
- Frontend uses a single string, can't support multi-location clinics
- No structured address components for filtering by city/country
- Coordinates only exist in profile page inline data

---

### 3. clinic_services → specialties

```
Backend: clinic_services            Frontend: specialties
─────────────────────────────────────────────────────
service_category (ENUM)        →    (missing) - no category
service_name (ENUM)            →    specialties[i] (string) ⚠️ untyped
is_primary_service             →    (missing)
```

**Issues:**
- Frontend uses untyped string array
- No service categories for grouping
- Can't distinguish primary vs secondary services

---

### 4. clinic_packages → (missing)

```
Backend: clinic_packages            Frontend: (not present)
─────────────────────────────────────────────────────
package_name                   →    ❌
includes (jsonb)               →    ❌
excludes (jsonb)               →    ❌
nights_included                →    ❌
transport_included             →    ❌
aftercare_duration_days        →    ❌
price_min, price_max           →    ❌
currency                       →    ❌
```

**Issues:**
- Frontend has no concept of packages
- Critical for comparison features
- Users can't compare what's included/excluded

---

### 5. clinic_pricing → (missing)

```
Backend: clinic_pricing             Frontend: (not present)
─────────────────────────────────────────────────────
service_name                   →    ❌
price_min, price_max           →    budgetRange in filters only
currency                       →    ❌
pricing_type                   →    ❌
source_id                      →    ❌
last_verified_at               →    ❌
```

**Issues:**
- Frontend filter has budget range but no actual pricing data
- No price verification timestamps
- No source linkage for price claims

---

### 6. clinic_team → doctors

```
Backend: clinic_team                Frontend: doctors (profile only)
─────────────────────────────────────────────────────
role (ENUM)                    →    specialty (string) ⚠️ different concept
name                           →    name ✓
credentials (jsonb)            →    credentials (string[]) ✓
years_experience               →    yearsOfExperience ✓
doctor_involvement_level       →    (missing) ❌ important field
```

**Issues:**
- `role` and `specialty` are different concepts
- Missing `doctor_involvement_level` - important for comparisons
- Frontend only has doctors in profile, not in list view

---

### 7. clinic_credentials → accreditations

```
Backend: clinic_credentials         Frontend: accreditations
─────────────────────────────────────────────────────
credential_type (ENUM)         →    (missing)
credential_name                →    accreditations keys (JCI, ISO, etc.)
credential_id                  →    (missing)
issuing_body                   →    (missing)
valid_from, valid_to           →    (missing)
```

**Issues:**
- Frontend only has boolean flags for filtering
- No credential details, IDs, or validity dates
- Can't show verification status

---

### 8. clinic_languages → languages

```
Backend: clinic_languages           Frontend: languages
─────────────────────────────────────────────────────
language (ENUM)                →    languages keys ✓
support_type (ENUM)            →    (missing) ❌
```

**Issues:**
- Frontend doesn't distinguish staff vs translator vs on-request
- Important for patient expectations

---

### 9. clinic_reviews → reviews

```
Backend: clinic_reviews             Frontend: reviews (profile only)
─────────────────────────────────────────────────────
id                             →    (missing)
clinic_id                      →    (implicit)
source_id (fk)                 →    (missing) ❌ no source linkage
rating                         →    rating ✓
review_text                    →    text ✓
review_date                    →    date ✓
language                       →    (missing)
```

**Issues:**
- No source linkage (can't show "from Google", "from Trustpilot")
- Reviews only in profile page, not typed interface
- No language field for filtering

---

### 10. clinic_mentions → communitySignals.posts

```
Backend: clinic_mentions            Frontend: communitySignals.posts
─────────────────────────────────────────────────────
source_id → source.source_type →    source ("reddit"|"instagram"|...) ✓
mention_text                   →    snippet ✓
topic (ENUM)                   →    (missing) ❌ valuable filter
sentiment                      →    summary.sentiment (summary level only)
author_handle (from source)    →    author ✓
```

**Issues:**
- Missing `topic` field - can't filter by complaint type
- Sentiment only at summary level, not per-mention
- Topics like "bait_and_switch" are valuable signals

---

### 11. clinic_scores → trustScore

```
Backend: clinic_scores              Frontend: trustScore
─────────────────────────────────────────────────────
overall_score                  →    trustScore ✓ (concept matches)
band (A/B/C/D)                 →    (missing)
computed_at                    →    (missing)

Backend: clinic_score_components    Frontend: (missing entirely)
─────────────────────────────────────────────────────
component_key                  →    Would power explainability
score                          →    (missing)
explanation                    →    aiInsights? (loosely)
```

**Issues:**
- No score band for quick categorization
- No score components - can't explain WHY a clinic scored X
- `aiInsights` is loosely related but not structured

---

### 12. Evidence Layer → (completely missing)

```
Backend: sources, source_documents, clinic_facts, fact_evidence
Frontend: Nothing

This is the biggest gap - the frontend has no concept of:
- Where data came from
- Confidence levels
- Conflicting facts
- Evidence snippets
```

**Issues:**
- Can't show "We say X because we observed it in Y"
- Can't display confidence levels
- Can't highlight conflicting information
- No audit trail for claims

---

## Frontend Type Definitions

The following TypeScript types align with the backend schema:

### Core Identity

```typescript
// types/clinic.ts

export interface Clinic {
  id: string  // uuid
  displayName: string
  legalName?: string
  status: 'active' | 'inactive' | 'under_review'
  primaryCity: string
  primaryCountry: string
  websiteUrl?: string
  contacts: {
    whatsapp?: string
    email?: string
    phone?: string
  }
  createdAt: string
  updatedAt: string
}
```

### Locations

```typescript
// types/location.ts

export interface ClinicLocation {
  id: string
  clinicId: string
  locationName: string  // e.g., "Main Branch"
  addressLine: string
  city: string
  country: string
  postalCode?: string
  coordinates?: {
    lat: number
    lng: number
  }
  isPrimary: boolean
}
```

### Services

```typescript
// types/service.ts

// Matches: clinic_service_category ENUM
export type ServiceCategory =
  | 'Medical Tourism'
  | 'Cosmetic'
  | 'Dental'
  | 'Other'

// Matches: clinic_service_name ENUM
export type ServiceName =
  | 'Hair Transplant'
  | 'Rhinoplasty'
  | 'Other'

export interface ClinicService {
  id: string
  clinicId: string
  serviceCategory: ServiceCategory
  serviceName: ServiceName
  isPrimaryService: boolean
}
```

### Packages

```typescript
// types/package.ts

export interface ClinicPackage {
  id: string
  clinicId: string
  packageName: string
  includes: string[]
  excludes: string[]
  nightsIncluded?: number
  transportIncluded: boolean
  aftercareDurationDays?: number
  priceMin: number
  priceMax?: number
  currency: string
}
```

### Pricing

```typescript
// types/pricing.ts

export type PricingType = 'range' | 'fixed' | 'quote_only'

export interface ClinicPricing {
  id: string
  clinicId: string
  serviceName: string
  priceMin?: number
  priceMax?: number
  currency?: string
  pricingType: PricingType
  notes?: string
  sourceId?: string
  isVerified: boolean
  lastVerifiedAt?: string
}
```

### Team

```typescript
// types/team.ts

// Matches: clinic_roles ENUM
export type TeamRole =
  | 'medical_director'
  | 'surgeon'
  | 'coordinator'
  | 'translator'
  | 'nurse'
  | 'doctor'
  | 'other'

// Matches: doctor_involvement_levels ENUM
export type InvolvementLevel = 'high' | 'medium' | 'low'

export interface ClinicTeamMember {
  id: string
  clinicId: string
  role: TeamRole
  name?: string
  credentials: string  // Note: backend stores as TEXT, not array
  yearsExperience?: number
  doctorInvolvementLevel: InvolvementLevel
}
```

### Credentials

```typescript
// types/credential.ts

// Matches: clinic_credential_types ENUM
export type CredentialType =
  | 'license'
  | 'accreditation'
  | 'membership'
  | 'registry_id'
  | 'other'

export interface ClinicCredential {
  id: string
  clinicId: string
  credentialType: CredentialType
  credentialName: string
  credentialId?: number  // Note: backend uses bigint
  issuingBody?: string
  validFrom?: string  // date
  validTo?: string    // date, nullable (some credentials don't expire)
}
```

### Languages

```typescript
// types/language.ts

// Matches: clinic_language_types ENUM (17 languages)
export type Language =
  | 'English'
  | 'Arabic'
  | 'Spanish'
  | 'Russian'
  | 'French'
  | 'Portuguese'
  | 'Hungarian'
  | 'Italian'
  | 'German'
  | 'Polish'
  | 'Ukranian'  // Note: Backend spelling is "Ukranian" not "Ukrainian"
  | 'Dutch'
  | 'Romanian'
  | 'Hindi'
  | 'Mandarin Chinese'
  | 'Urdu'
  | 'Bengali'

// Matches: clinic_language_support_types ENUM
export type LanguageSupportType = 'staff' | 'translator' | 'on_request'

export interface ClinicLanguage {
  id: string
  clinicId: string
  language: Language
  supportType: LanguageSupportType
}
```

### Reviews

```typescript
// types/review.ts

export interface ClinicReview {
  id: string
  clinicId: string
  sourceId: string  // links to source for provenance
  source?: Source   // joined for display
  rating?: number
  reviewText: string
  reviewDate?: string
  language?: string
  verified?: boolean
}
```

### Community Mentions

```typescript
// types/mention.ts

// Matches: mention_topic_enum ENUM
export type MentionTopic =
  | 'pricing'
  | 'results'
  | 'staff'
  | 'logistics'
  | 'complaint'
  | 'praise'
  | 'bait_and_switch'
  | 'coordinator_behavior'
  | 'response_time'
  | 'package_accuracy'
  | 'before_after'

// Matches: sentiment_enum ENUM
export type Sentiment = 'negative' | 'neutral' | 'positive'

export interface ClinicMention {
  id: string
  clinicId?: string  // nullable - mention might reference clinic without being linked
  sourceId: string
  source?: Source    // joined for display
  mentionText: string
  topic: MentionTopic
  sentiment?: Sentiment
  createdAt: string
}
```

### Scores

```typescript
// types/score.ts

export type ScoreBand = 'A' | 'B' | 'C' | 'D'

export interface ClinicScoreComponent {
  id: string
  clinicId: string
  componentKey: string  // 'transparency' | 'consistency' | 'reputation' | etc.
  score: number         // 0-100
  weight: number        // 0-1
  explanation: string   // human-readable
  computedAt: string
}

export interface ClinicScore {
  clinicId: string
  overallScore: number  // 0-100
  band: ScoreBand
  components: ClinicScoreComponent[]
  computedAt: string
  version: string
}
```

### Evidence Layer

```typescript
// types/evidence.ts

// Matches: source_type_enum ENUM
export type SourceType =
  | 'clinic_website'
  | 'registry'
  | 'review_platform'
  | 'forum'
  | 'reddit'
  | 'quora'
  | 'social_media'
  | 'mystery_inquiry'
  | 'internal_note'

// Matches: doc_type_enum ENUM
export type DocType = 'html' | 'pdf' | 'post' | 'comment' | 'review'

// Matches: value_type_enum ENUM
export type ValueType = 'string' | 'number' | 'bool' | 'json'

// Matches: computed_by_enum ENUM
export type ComputedBy = 'extractor' | 'human' | 'inquiry' | 'model'

export interface Source {
  id: string
  sourceType: SourceType
  sourceName: string
  url?: string
  capturedAt: string
  authorHandle?: string
  contentHash?: string  // unique constraint for deduplication
}

export interface SourceDocument {
  id: string
  sourceId: string
  docType: DocType
  title?: string
  rawText: string
  language?: string
  publishedAt?: string
}

export interface FactEvidence {
  id: string
  clinicFactId: string
  sourceDocumentId: string
  sourceDocument?: SourceDocument  // joined
  source?: Source                   // joined through sourceDocument
  evidenceSnippet?: string
  evidenceLocator?: Record<string, unknown>  // jsonb
}

export interface ClinicFact {
  id: string
  clinicId: string
  factKey: string
  factValue: unknown    // jsonb
  valueType: ValueType
  confidence: number    // 0.0-1.0 (has CHECK constraint)
  computedBy: ComputedBy
  firstSeenAt: string
  lastSeenAt: string
  isConflicting: boolean
  evidence?: FactEvidence[]  // joined
}
```

---

## API Response Types

### Clinic Profile Response

What the API should return for the clinic detail page:

```typescript
// types/api/clinic-profile.ts

export interface ClinicProfileResponse {
  // Identity
  clinic: Clinic
  locations: ClinicLocation[]

  // Services & offerings
  services: ClinicService[]
  packages: ClinicPackage[]
  pricing: ClinicPricing[]

  // Team
  team: ClinicTeamMember[]

  // Credentials & languages
  credentials: ClinicCredential[]
  languages: ClinicLanguage[]

  // Scoring (with explainability)
  score: ClinicScore

  // Social proof
  reviews: {
    summary: {
      averageRating: number
      totalCount: number
      ratingDistribution: Record<1 | 2 | 3 | 4 | 5, number>
    }
    recent: ClinicReview[]
  }

  // Community signals
  mentions: {
    summary: {
      totalMentions: number
      sentiment: Sentiment
      themes: string[]
      topicBreakdown: Record<MentionTopic, number>
    }
    posts: ClinicMention[]
  }

  // Evidence (for "why we say X")
  keyFacts: ClinicFact[]  // high-confidence facts with evidence

  // Provenance summary
  provenance: {
    lastUpdated: string
    sourceTypes: SourceType[]
    documentCount: number
    oldestSource: string
    newestSource: string
  }
}
```

### Clinic List Response

What the API should return for clinic search/browse:

```typescript
// types/api/clinic-list.ts

export interface ClinicSummary {
  id: string
  displayName: string
  primaryLocation: {
    city: string
    country: string
    coordinates?: { lat: number; lng: number }
  }
  thumbnail: string
  primaryServices: string[]
  score: {
    overall: number
    band: ScoreBand
  }
  reviewSummary: {
    rating: number
    count: number
  }
  priceRange?: {
    min: number
    max: number
    currency: string
  }
  topFact?: {
    key: string
    value: string
    confidence: number
  }
  languages: Language[]
  hasVerifiedCredentials: boolean
}

export interface ClinicListResponse {
  clinics: ClinicSummary[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
  facets?: {
    services: { name: string; count: number }[]
    cities: { name: string; count: number }[]
    bands: { band: ScoreBand; count: number }[]
    languages: { language: Language; count: number }[]
    priceRanges: { label: string; min: number; max: number; count: number }[]
  }
}
```

---

## Filter State Alignment

### Current Frontend FilterState

```typescript
// Current implementation in types.ts
interface FilterState {
  searchQuery: string
  location: string
  treatments: Record<TreatmentType, boolean>
  budgetRange: [number, number]
  languages: Record<Language, boolean>
  accreditations: Record<Accreditation, boolean>
  aiMatchScore: number
}
```

### Backend-Aligned Search Params

```typescript
// types/api/search-params.ts

export interface ClinicSearchParams {
  // Text search
  q?: string

  // Location filters
  city?: string
  country?: string
  nearLat?: number
  nearLng?: number
  radiusKm?: number

  // Service filters
  services?: ServiceCategory[]

  // Price filters
  priceMin?: number
  priceMax?: number
  currency?: string

  // Language filters
  languages?: Language[]
  languageSupportType?: LanguageSupportType

  // Credential filters
  credentials?: CredentialType[]
  hasJCI?: boolean
  hasISO?: boolean

  // Score filters
  minScore?: number
  scoreBands?: ScoreBand[]

  // Sorting
  sortBy?: 'score' | 'price_asc' | 'price_desc' | 'rating' | 'reviews' | 'distance'

  // Pagination
  page?: number
  pageSize?: number
}
```

### Mapping Table

| Frontend Filter | Backend Query Param | Notes |
|-----------------|---------------------|-------|
| `searchQuery` | `q` | Full-text search |
| `location` | `city`, `country` | Need to parse or use autocomplete |
| `treatments.*` | `services[]` | Map treatment names to ServiceCategory |
| `budgetRange[0]` | `priceMin` | Direct mapping |
| `budgetRange[1]` | `priceMax` | Direct mapping |
| `languages.*` | `languages[]` | Extract selected languages |
| `accreditations.JCI` | `hasJCI` or `credentials[]` | Either specific flag or generic |
| `accreditations.ISO` | `hasISO` or `credentials[]` | Either specific flag or generic |
| `aiMatchScore` | `minScore` | Direct mapping |

---

## Summary & Recommendations

### Does the Backend Schema Fit?

**Conceptually: Yes** - The backend schema covers everything the frontend needs and more.

**Structurally: Needs significant work** - The frontend types are too simple.

### Key Gaps to Address

| Gap | Impact | Priority |
|-----|--------|----------|
| UUID vs number IDs | Breaking change, affects all components | 🔴 High |
| No packages/pricing types | Can't show comparison data | 🔴 High |
| No evidence layer types | Can't show "why we say this" | 🟡 Medium |
| No score components | Can't explain trustScore | 🟡 Medium |
| No mention topics | Can't filter community signals by topic | 🟡 Medium |
| Flat location string | Can't support multi-location clinics | 🟡 Medium |
| No language support types | Can't distinguish staff vs translator | 🟢 Low |

### Recommended Next Steps

1. **Create new types file** aligned with backend schema (use types in this document)

2. **Create data fetching layer**
   ```
   hooks/
   ├── useClinics.ts      # List/search with filters
   ├── useClinic.ts       # Single clinic detail
   └── useClinicFacts.ts  # Evidence for a clinic
   ```

3. **Refactor components** to accept typed props instead of hardcoded data

4. **Add loading/error states** to all data-dependent components

5. **Update FilterState** to align with backend query params

### What Can Stay the Same

The UI components (cards, sections, layouts) can largely remain unchanged. They just need to receive properly-typed data from a data layer that talks to the backend.

---

## Appendix: File Locations

### Current Frontend Files

- Types: `components/istanbulmedic-connect/types.ts`
- List Page: `components/istanbulmedic-connect/ExploreClinicsPage.tsx`
- Profile Page: `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx`
- Card Component: `components/istanbulmedic-connect/ClinicCard.tsx`
- Filter Bar: `components/istanbulmedic-connect/UnifiedFilterBar.tsx`

### Suggested New Structure

```
lib/
├── api/
│   ├── client.ts           # API client setup
│   └── clinics.ts          # Clinic API functions
├── types/
│   ├── clinic.ts           # Core clinic types
│   ├── location.ts         # Location types
│   ├── service.ts          # Service types
│   ├── package.ts          # Package types
│   ├── pricing.ts          # Pricing types
│   ├── team.ts             # Team member types
│   ├── credential.ts       # Credential types
│   ├── language.ts         # Language types
│   ├── review.ts           # Review types
│   ├── mention.ts          # Community mention types
│   ├── score.ts            # Score types
│   ├── evidence.ts         # Evidence layer types
│   └── api/
│       ├── clinic-profile.ts   # Profile response type
│       ├── clinic-list.ts      # List response type
│       └── search-params.ts    # Search params type
└── hooks/
    ├── useClinics.ts       # Search/list hook
    ├── useClinic.ts        # Single clinic hook
    └── useClinicFacts.ts   # Facts/evidence hook
```
