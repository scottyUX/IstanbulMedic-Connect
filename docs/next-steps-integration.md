# Next Steps: PR Fixes & Backend Integration

This document summarizes the work needed based on the PR review and backend integration planning session.

---

## Table of Contents

1. [PR Follow-up Fixes](#pr-follow-up-fixes)
2. [Supabase Setup](#supabase-setup)
3. [Frontend Type Updates](#frontend-type-updates)
4. [Data Layer Creation](#data-layer-creation)
5. [Component Refactoring](#component-refactoring)
6. [Backend Team Coordination](#backend-team-coordination)

---

## PR Follow-up Fixes

### 🔴 High Priority (Do First)

#### 1. Replace Hardcoded Colors with CSS Variables

| File | Line(s) | Current | Change To |
|------|---------|---------|-----------|
| `components/istanbulmedic-connect/UnifiedFilterBar.tsx` | 100 | `bg-[#17375B]` | `bg-[var(--im-color-primary)]` |
| `components/istanbulmedic-connect/UnifiedFilterBar.tsx` | 113 | `bg-[#17375B]` | `bg-[var(--im-color-primary)]` |
| `components/istanbulmedic-connect/UnifiedFilterBar.tsx` | 120 | `bg-[#17375B]` | `bg-[var(--im-color-primary)]` |
| `components/common/Footer.tsx` | 47 | `bg-[#0D1E32]` | `bg-[var(--im-color-text-primary)]` |
| `components/common/Footer.tsx` | 82, 132 | `text-[#3EBBB7]` | `text-[var(--im-color-secondary)]` |
| `components/istanbulmedic-connect/FilterDialog.tsx` | 224 | `text-[#3EBBB7]` | `text-[var(--im-color-secondary)]` |

#### 2. Fix Empty onClick Handler

**File:** `components/istanbulmedic-connect/ExploreClinicsPage.tsx:271`

Either implement pagination or remove/disable the button:

```tsx
// Option A: Remove for now
{/* Load More button - TODO: implement pagination */}

// Option B: Disable with message
<Button variant="outline" size="lg" disabled className="min-w-[200px]">
  Load More Clinics (Coming Soon)
</Button>
```

#### 3. Add TODO Comments for Hardcoded Data

**File:** `components/istanbulmedic-connect/ExploreClinicsPage.tsx:13`
```tsx
// TODO: Replace with API call - see docs/backend-schema-mapping.md
const CLINICS: Clinic[] = [...]
```

**File:** `components/istanbulmedic-connect/profile/ClinicProfilePage.tsx:29`
```tsx
// TODO: Fetch from API using clinicId - see docs/backend-schema-mapping.md
const clinicData = {...}
```

### 🟡 Medium Priority (Can Do Later)

- [ ] Differentiate duplicate tag variants in `specialty-tag.tsx` (teal/green, peach/purple)
- [ ] Consider using CSS variable for font in `ClinicCard.tsx` instead of re-importing Merriweather
- [ ] Add `role="link"` or keyboard handling to clickable `ClinicCard`

---

## Supabase Setup

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Create Environment Variables

**File:** `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Create Supabase Client

**File:** `lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
```

### 4. Generate Database Types

After backend team creates tables, generate types:

```bash
npx supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

---

## Frontend Type Updates

Create new types aligned with backend schema. See `docs/backend-schema-mapping.md` for full details.

### New Files to Create

```
lib/
├── types/
│   ├── index.ts              # Re-exports all types
│   ├── clinic.ts             # Clinic, ClinicSummary
│   ├── location.ts           # ClinicLocation
│   ├── service.ts            # ClinicService, ServiceCategory
│   ├── package.ts            # ClinicPackage
│   ├── pricing.ts            # ClinicPricing
│   ├── team.ts               # ClinicTeamMember, TeamRole
│   ├── credential.ts         # ClinicCredential
│   ├── language.ts           # ClinicLanguage, Language
│   ├── review.ts             # ClinicReview
│   ├── mention.ts            # ClinicMention, MentionTopic
│   ├── score.ts              # ClinicScore, ClinicScoreComponent
│   └── evidence.ts           # Source, ClinicFact, FactEvidence
```

### Key Type Changes

| Current | New |
|---------|-----|
| `id: number` | `id: string` (uuid) |
| `name: string` | `displayName: string` |
| `location: string` | `locations: ClinicLocation[]` |
| `specialties: string[]` | `services: ClinicService[]` |
| `trustScore: number` | `score: ClinicScore` (with components) |
| `doctors[]` (inline) | `team: ClinicTeamMember[]` |

---

## Data Layer Creation

### 1. API Functions

**File:** `lib/api/clinics.ts`
```typescript
import { supabase } from '@/lib/supabase/client'
import type { ClinicSummary, ClinicProfileResponse } from '@/lib/types'
import type { ClinicSearchParams } from '@/lib/types/api'

export async function getClinics(params?: ClinicSearchParams): Promise<ClinicSummary[]> {
  let query = supabase
    .from('clinics')
    .select(`
      id,
      display_name,
      primary_city,
      primary_country,
      thumbnail_url,
      clinic_services (service_category, service_name, is_primary),
      clinic_scores (overall_score, band)
    `)
    .eq('status', 'active')

  if (params?.q) {
    query = query.ilike('display_name', `%${params.q}%`)
  }

  if (params?.city) {
    query = query.eq('primary_city', params.city)
  }

  if (params?.minScore) {
    query = query.gte('clinic_scores.overall_score', params.minScore)
  }

  const { data, error } = await query

  if (error) throw error
  return transformToClinicSummaries(data)
}

export async function getClinic(id: string): Promise<ClinicProfileResponse> {
  const { data, error } = await supabase
    .from('clinics')
    .select(`
      *,
      clinic_locations (*),
      clinic_services (*),
      clinic_packages (*),
      clinic_pricing (*),
      clinic_team (*),
      clinic_credentials (*),
      clinic_languages (*),
      clinic_scores (*),
      clinic_score_components (*),
      clinic_reviews (*),
      clinic_mentions (*),
      clinic_media (*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return transformToClinicProfile(data)
}
```

### 2. React Hooks

**File:** `lib/hooks/useClinics.ts`
```typescript
import useSWR from 'swr'
import { getClinics } from '@/lib/api/clinics'
import type { ClinicSearchParams } from '@/lib/types/api'

export function useClinics(params?: ClinicSearchParams) {
  return useSWR(
    ['clinics', params],
    () => getClinics(params),
    {
      revalidateOnFocus: false,
    }
  )
}
```

**File:** `lib/hooks/useClinic.ts`
```typescript
import useSWR from 'swr'
import { getClinic } from '@/lib/api/clinics'

export function useClinic(id: string | null) {
  return useSWR(
    id ? ['clinic', id] : null,
    () => getClinic(id!),
    {
      revalidateOnFocus: false,
    }
  )
}
```

### 3. Install SWR

```bash
npm install swr
```

---

## Component Refactoring

### ExploreClinicsPage

**Before:**
```tsx
const CLINICS: Clinic[] = [/* hardcoded */]

export const ExploreClinicsPage = ({ onSelectClinic }) => {
  const filteredClinics = useMemo(() => CLINICS.filter(...), [filters])
  // ...
}
```

**After:**
```tsx
export const ExploreClinicsPage = ({ onSelectClinic }) => {
  const [filters, setFilters] = useState<ClinicSearchParams>({})
  const { data: clinics, isLoading, error } = useClinics(filters)

  if (isLoading) return <ClinicsLoadingSkeleton />
  if (error) return <ErrorState message="Failed to load clinics" />

  return (
    // ... render clinics from API
  )
}
```

### ClinicProfilePage

**Before:**
```tsx
export const ClinicProfilePage = ({ clinicId, onBack }) => {
  void clinicId  // ignored!
  const clinicData = {/* hardcoded */}
  // ...
}
```

**After:**
```tsx
export const ClinicProfilePage = ({ clinicId, onBack }) => {
  const { data: clinic, isLoading, error } = useClinic(clinicId)

  if (isLoading) return <ProfileLoadingSkeleton />
  if (error) return <ErrorState message="Clinic not found" />

  return (
    // ... render clinic from API
  )
}
```

---

## Backend Team Coordination

### Tables They Need to Add

Per `docs/backend-frontend-integration-split.md`:

1. **`clinic_media`** - For storing image URLs
   ```sql
   CREATE TABLE clinic_media (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     clinic_id UUID NOT NULL REFERENCES clinics(id),
     media_type TEXT NOT NULL,
     url TEXT NOT NULL,
     alt_text TEXT,
     is_primary BOOLEAN DEFAULT false,
     display_order INTEGER DEFAULT 0,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Add columns to `clinics`**
   ```sql
   ALTER TABLE clinics ADD COLUMN description TEXT;
   ALTER TABLE clinics ADD COLUMN short_description TEXT;
   ALTER TABLE clinics ADD COLUMN thumbnail_url TEXT;
   ALTER TABLE clinics ADD COLUMN founded_year INTEGER;
   ```

### Questions to Clarify with Backend

- [ ] What's the Supabase project URL and anon key?
- [ ] Are the tables created yet? Can we generate types?
- [ ] What's the pagination strategy (offset vs cursor)?
- [ ] Will filtering be via query params or RPC functions?
- [ ] How should we handle clinic images - direct URLs or signed URLs?

---

## Implementation Order

```
Phase 1: PR Fixes (This Branch)
├── [ ] Fix hardcoded colors
├── [ ] Fix empty onClick
└── [ ] Add TODO comments

Phase 2: Supabase Setup
├── [ ] Install @supabase/supabase-js
├── [ ] Create .env.local with credentials
├── [ ] Create lib/supabase/client.ts
└── [ ] Test connection

Phase 3: Types & Data Layer
├── [ ] Create lib/types/ folder with all types
├── [ ] Install swr
├── [ ] Create lib/api/clinics.ts
└── [ ] Create lib/hooks/useClinics.ts and useClinic.ts

Phase 4: Component Refactoring
├── [ ] Update ExploreClinicsPage to use useClinics
├── [ ] Update ClinicProfilePage to use useClinic
├── [ ] Add loading skeletons
└── [ ] Add error states

Phase 5: Testing
├── [ ] Test clinic list loads from Supabase
├── [ ] Test filters work
├── [ ] Test clinic profile loads
└── [ ] Test error handling
```

---

## Related Documentation

- `docs/backend-schema-mapping.md` - Full type mapping between backend and frontend
- `docs/backend-frontend-integration-split.md` - What backend needs to add vs frontend changes
