# Backend-Frontend Integration Split

This document outlines what changes are needed on each side for full integration, and identifies gaps in the current backend schema.

---

## Summary

| Side | Effort | Description |
|------|--------|-------------|
| **Frontend** | ~85% | Type updates, data layer creation, component refactoring |
| **Backend** | ~15% | Add `clinic_media` table, few fields to `clinics`, clarify operational stats |

---

## Frontend Changes (Adapting to Existing Backend)

The backend schema already covers most of what the frontend needs. These are adaptation tasks:

### Type Updates

| Current Frontend | Change To | Backend Table |
|------------------|-----------|---------------|
| `id: number` | `id: string` (uuid) | `clinics.id` |
| `name: string` | `displayName: string` | `clinics.display_name` |
| `location: string` | `ClinicLocation[]` | `clinic_locations` |
| `specialties: string[]` | `ClinicService[]` | `clinic_services` |
| `trustScore: number` | `ClinicScore` object | `clinic_scores` + `clinic_score_components` |
| `rating?: number` | Part of `reviews.summary` | Aggregated from `clinic_reviews` |
| `aiInsight?: string` | `ClinicFact[]` or derived | `clinic_facts` |

### New Types to Add

| Type | Backend Table | Notes |
|------|---------------|-------|
| `ClinicPackage` | `clinic_packages` | Frontend has no package concept currently |
| `ClinicPricing` | `clinic_pricing` | Frontend only has filter range, no actual data |
| `ClinicTeamMember` | `clinic_team` | Frontend has `doctors[]` but different structure |
| `ClinicCredential` | `clinic_credentials` | Frontend only has filter booleans |
| `ClinicLanguage` | `clinic_languages` | Need to add `supportType` |
| `ClinicMention` | `clinic_mentions` | Need to add `topic` field |
| `ClinicScoreComponent` | `clinic_score_components` | Enables score explainability |
| `Source` | `sources` | Evidence provenance |
| `ClinicFact` | `clinic_facts` | Evidence-backed claims |
| `FactEvidence` | `fact_evidence` | Links facts to source documents |

### Data Layer Creation

New files needed:

```
lib/
├── api/
│   ├── client.ts           # API client (fetch wrapper, error handling)
│   └── clinics.ts          # getClinics(), getClinic(id), searchClinics()
└── hooks/
    ├── useClinics.ts       # List/search hook (SWR or React Query)
    ├── useClinic.ts        # Single clinic detail hook
    └── useClinicFacts.ts   # Facts/evidence hook
```

### Component Refactoring

| Component | Change |
|-----------|--------|
| `ExploreClinicsPage` | Remove hardcoded `CLINICS`, accept data from hook |
| `ClinicProfilePage` | Remove hardcoded `clinicData`, use `useClinic(id)` |
| `ClinicCard` | Update props to match `ClinicSummary` type |
| `FilterDialog` | Update to use typed enums from backend |

---

## Backend Gaps (Needs to be Added)

These are things the frontend currently displays that don't have a clear home in the backend schema:

### 1. Clinic Media/Images

**Problem:** Frontend displays multiple clinic images, but no table exists for this.

**Current frontend usage:**
```typescript
// In ClinicProfilePage
images: [
  "https://...",  // Main image
  "https://...",  // Secondary images
  "https://...",
  "https://...",
]

// In ClinicCard (list view)
image: "https://..."  // Single thumbnail
```

**Suggested backend addition:**

```sql
CREATE TABLE clinic_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'before_after', 'certificate')),
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  source_id UUID REFERENCES sources(id),  -- provenance
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX idx_clinic_media_clinic_id ON clinic_media(clinic_id);

-- Ensure only one primary image per clinic
CREATE UNIQUE INDEX idx_clinic_media_primary
  ON clinic_media(clinic_id)
  WHERE is_primary = true;
```

### 2. Clinic Description

**Problem:** The `clinics` table doesn't have a description field.

**Current frontend usage:**
```typescript
overview: {
  description: "Istanbul Hair Center is a leading hair restoration facility..."
}
```

**Suggested backend addition:**

```sql
ALTER TABLE clinics ADD COLUMN description TEXT;
ALTER TABLE clinics ADD COLUMN short_description TEXT;  -- for list view cards
```

**Alternative:** Store as `clinic_facts` with key `profile.description`, allowing multiple versions with confidence scores.

### 3. Thumbnail URL

**Problem:** List view needs a single thumbnail image for each clinic.

**Suggested backend addition:**

```sql
ALTER TABLE clinics ADD COLUMN thumbnail_url TEXT;
```

**Alternative:** Derive from `clinic_media` where `is_primary = true`.

### 4. Founded Year / Years in Operation

**Problem:** Frontend displays "15 years in operation" but no field exists.

**Current frontend usage:**
```typescript
overview: {
  yearsInOperation: 15
}
```

**Options:**

**Option A: Add to clinics table**
```sql
ALTER TABLE clinics ADD COLUMN founded_year INTEGER;
-- Frontend calculates: yearsInOperation = currentYear - founded_year
```

**Option B: Store in clinic_facts (recommended)**
```sql
-- fact_key: 'stats.founded_year'
-- fact_value: 2009
-- confidence: 0.95
-- This allows evidence linkage (e.g., "from business registration")
```

### 5. Procedures Performed Count

**Problem:** Frontend displays "12,000+ procedures" but no field exists.

**Current frontend usage:**
```typescript
overview: {
  proceduresPerformed: 12000
}
```

**Recommendation:** Store in `clinic_facts`

```sql
-- fact_key: 'stats.procedures_performed'
-- fact_value: 12000
-- confidence: 0.7  -- self-reported, lower confidence
-- source_id: links to clinic website where claim was found
```

This is better than a dedicated column because:
- Procedure counts are often self-reported (confidence matters)
- Can track where the claim came from (evidence)
- Can flag conflicting claims if different sources say different numbers

### 6. AI Insights

**Problem:** Frontend shows AI-generated insights, unclear where these come from.

**Current frontend usage:**
```typescript
aiInsights: [
  "Strong documentation of surgical procedures...",
  "Well-suited for patients seeking minimally invasive...",
  "High patient satisfaction scores in follow-up care...",
]
```

**Recommendation:** These should be `clinic_facts` with `computed_by: 'model'`

```sql
-- fact_key: 'ai_insight.documentation_quality'
-- fact_value: "Strong documentation of surgical procedures with comprehensive pre-operative planning"
-- confidence: 0.85
-- computed_by: 'model'
```

Or create a dedicated view/query that aggregates high-confidence facts into insight bullets.

---

## Backend Schema Additions Summary

### New Table

```sql
-- clinic_media (required)
CREATE TABLE clinic_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video', 'before_after', 'certificate')),
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  source_id UUID REFERENCES sources(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_clinic_media_clinic_id ON clinic_media(clinic_id);
```

### Columns to Add to `clinics`

```sql
ALTER TABLE clinics ADD COLUMN description TEXT;
ALTER TABLE clinics ADD COLUMN short_description TEXT;
ALTER TABLE clinics ADD COLUMN thumbnail_url TEXT;  -- or derive from clinic_media
ALTER TABLE clinics ADD COLUMN founded_year INTEGER;  -- optional, can use clinic_facts
```

### Recommended `clinic_facts` Keys

| fact_key | value_type | Notes |
|----------|------------|-------|
| `stats.founded_year` | number | Year clinic was established |
| `stats.procedures_performed` | number | Total procedure count |
| `stats.patient_count` | number | Total patients treated |
| `profile.description` | string | Full clinic description |
| `profile.short_description` | string | Tagline for cards |
| `ai_insight.*` | string | Model-generated insights |

---

## API Contract Suggestion

To bridge the gap, the backend should expose a merged `ClinicProfile` endpoint:

### GET /api/clinics/:id

```json
{
  "clinic": {
    "id": "uuid",
    "displayName": "Istanbul Hair Center",
    "description": "Leading hair restoration facility...",
    "shortDescription": "Award-winning hair transplant clinic",
    "thumbnailUrl": "https://...",
    "status": "active",
    "primaryCity": "Istanbul",
    "primaryCountry": "Turkey",
    "websiteUrl": "https://istanbulhaircenter.com",
    "contacts": {
      "whatsapp": "+90...",
      "email": "info@...",
      "phone": "+90..."
    }
  },
  "locations": [...],
  "media": [
    { "url": "...", "isPrimary": true, "altText": "..." },
    { "url": "...", "isPrimary": false, "displayOrder": 1 }
  ],
  "services": [...],
  "packages": [...],
  "pricing": [...],
  "team": [...],
  "credentials": [...],
  "languages": [...],
  "score": {
    "overall": 96,
    "band": "A",
    "components": [
      { "key": "transparency", "score": 98, "explanation": "..." },
      { "key": "reputation", "score": 94, "explanation": "..." }
    ]
  },
  "reviews": {
    "summary": { "averageRating": 4.8, "totalCount": 347 },
    "recent": [...]
  },
  "mentions": {
    "summary": { "totalMentions": 142, "sentiment": "positive", "themes": [...] },
    "posts": [...]
  },
  "facts": {
    "stats.founded_year": { "value": 2009, "confidence": 0.95 },
    "stats.procedures_performed": { "value": 12000, "confidence": 0.7 }
  },
  "provenance": {
    "lastUpdated": "2026-02-10T...",
    "sourceCount": 23
  }
}
```

### GET /api/clinics

```json
{
  "clinics": [
    {
      "id": "uuid",
      "displayName": "Istanbul Hair Center",
      "shortDescription": "Award-winning hair transplant clinic",
      "thumbnail": "https://...",
      "primaryLocation": { "city": "Şişli", "country": "Turkey" },
      "primaryServices": ["Hair Transplant", "FUE", "DHI"],
      "score": { "overall": 96, "band": "A" },
      "reviewSummary": { "rating": 4.8, "count": 347 },
      "priceRange": { "min": 2500, "max": 5000, "currency": "USD" }
    }
  ],
  "pagination": { "total": 42, "page": 1, "pageSize": 20 },
  "facets": { ... }
}
```

---

## Action Items

### Backend Team

- [ ] Create `clinic_media` table
- [ ] Add `description`, `short_description` to `clinics` table
- [ ] Decide: `thumbnail_url` column vs derive from `clinic_media.is_primary`
- [ ] Decide: `founded_year` column vs `clinic_facts` entry
- [ ] Define standard `fact_key` patterns for stats and AI insights
- [ ] Expose merged `/api/clinics/:id` endpoint
- [ ] Expose `/api/clinics` list endpoint with filters

### Frontend Team

- [ ] Create new type definitions (see `backend-schema-mapping.md`)
- [ ] Build API client and data fetching hooks
- [ ] Refactor `ExploreClinicsPage` to use hooks instead of hardcoded data
- [ ] Refactor `ClinicProfilePage` to use hooks instead of hardcoded data
- [ ] Update `ClinicCard` props to match `ClinicSummary`
- [ ] Add loading and error states to all pages
- [ ] Update `FilterState` to align with backend query params

---

## Questions for Backend Team

1. **Media storage:** Where will images be hosted? (S3, Cloudinary, etc.) Should `clinic_media.url` be a full URL or a key that frontend constructs?

2. **Fact keys:** Can we get a canonical list of `fact_key` patterns? e.g., `pricing.*`, `stats.*`, `ai_insight.*`

3. **Pagination:** What's the default/max page size for clinic list?

4. **Filtering:** Will filtering happen via query params or POST body for complex filters?

5. **Real-time:** Any plans for WebSocket updates when clinic data changes, or polling-based?
