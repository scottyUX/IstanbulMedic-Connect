# Data Integrity Refactor

This document describes the changes made to remove hardcoded/fake data from the clinic profile pages and integrate real data from the database with proper null handling.

## Motivation

The original implementation used many hardcoded fallback values to make the UI look complete during development. This created a misleading user experience where clinics without data appeared to have ratings, credentials, and statistics they didn't actually have.

**Goal:** Display only real data from the database. When data is missing, show appropriate "not available" messaging rather than fake values.

---

## Database Schema Changes

### Migration: `20260214120000_add_schema_enhancements.sql`

Added new columns to support features that were previously hardcoded:

```sql
-- clinics table
ALTER TABLE clinics ADD COLUMN years_in_operation INTEGER;
ALTER TABLE clinics ADD COLUMN procedures_performed INTEGER;

-- clinic_locations table
ALTER TABLE clinic_locations ADD COLUMN opening_hours JSONB;
ALTER TABLE clinic_locations ADD COLUMN payment_methods TEXT[];

-- clinic_team table
ALTER TABLE clinic_team ADD COLUMN photo_url TEXT;
```

**Opening hours format:**
```json
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "saturday": null,
  "sunday": null
}
```

---

## API Layer Changes

### `lib/api/clinics.ts`

**Added fields to `ClinicDetail` interface:**
```typescript
export interface ClinicDetail {
  // ... existing fields ...
  yearsInOperation: number | null;
  proceduresPerformed: number | null;
}
```

**Updated `getClinicById()` return object:**
```typescript
return {
  // ... existing fields ...
  yearsInOperation: clinic.years_in_operation,
  proceduresPerformed: clinic.procedures_performed,
};
```

---

## Component Changes

### Null-Safe Interfaces

All components were updated to accept `null` values where data might be missing:

| Component | Props Changed |
|-----------|---------------|
| `HeroSection` | `rating: number \| null` |
| `SummarySidebar` | `rating: number \| null` |
| `PriceRatingBlock` | `rating: number \| null` |
| `ReviewsSection` | `averageRating: number \| null` |
| `OverviewSection` | `yearsInOperation: number \| null`, `proceduresPerformed: number \| null` |
| `LocationInfoSection` | `lat: number \| null`, `lng: number \| null`, `services: Services \| null` |
| `DoctorCard` | `name: string \| null`, `yearsOfExperience: number \| null`, `education: string \| null` |

### Fallback UI Patterns

When data is missing, components now show appropriate messaging:

| Data | When Missing Shows |
|------|-------------------|
| Rating | "—" (em dash) |
| Years in operation | "Not available" |
| Procedures performed | "Not available" |
| Languages count | "Not available" |
| Opening hours | "Contact clinic for hours" |
| Payment methods | "Contact clinic for payment options" |
| Services | "Contact clinic for service details" |
| Map coordinates | "Map location not available" (placeholder box) |
| Doctor education | Hidden (section not rendered) |
| Doctor years of experience | Hidden (badge not rendered) |
| AI insights | "No AI insights available yet..." |
| Credentials | "No verified credentials available yet..." |

---

## Hardcoded Data Removed

### ClinicProfilePage.tsx

**Before → After:**

```typescript
// Rating fallbacks
rating={clinic.rating || 4.5}           → rating={clinic.rating ?? null}

// Language fallbacks
languages={languages.length > 0 ? languages : ["English", "Turkish"]}
                                        → languages={languages}

// Coordinate fallbacks
lat={primaryLocation?.latitude || 41.0} → lat={primaryLocation?.latitude ?? null}
lng={primaryLocation?.longitude || 29.0} → lng={primaryLocation?.longitude ?? null}

// Statistics fallbacks
yearsInOperation = toNumber(...) ?? 15  → yearsInOperation = ... ?? null
proceduresPerformed = toNumber(...) ?? 1000 → proceduresPerformed = ... ?? null

// Doctor data
education: "Medical School"             → education: null
yearsOfExperience: t.years_experience || 0 → yearsOfExperience: t.years_experience

// Default transparency items (removed entirely)
if (transparencyItems.length === 0) {
  transparencyItems.push({
    title: "Registered Medical Facility",
    ...
  })
}                                       → (removed)

// Default AI insights (removed entirely)
if (aiInsights.length === 0) {
  aiInsights.push(
    `${clinic.name} offers quality healthcare...`
  )
}                                       → (removed)
```

### ReviewsSection.tsx

**Removed hardcoded category ratings:**
```typescript
// REMOVED - these were completely fabricated
<div>Hygiene: 5.0</div>
<div>Outcome: 4.9</div>
<div>Process: 4.8</div>
<div>Communication: 5.0</div>
<div>Facilities: 4.9</div>
<div>Value: 4.9</div>
```

---

## Conditional "Patient Favorite" Badge

The "Patient Favorite" badge was showing for ALL clinics regardless of actual performance. Now it only appears when the clinic qualifies.

**Criteria:**
```typescript
rating !== null && rating >= 4.5 && totalReviews >= 5
```

**Affected areas:**
- `HeroSection`: Patient Favorite banner (entire section conditional)
- `ReviewsSection`: Trophy icon, "Patient Favorite" heading, modal sidebar

**When clinic doesn't qualify:**
- HeroSection: Banner hidden entirely
- ReviewsSection: Shows "Patient Reviews" heading with actual review count
- Modal: Shows neutral star icon instead of trophy, generic "Patient Reviews" messaging

---

## Data Derivation

Some UI elements are derived from existing database tables rather than stored directly:

### Services (accommodation, airport transfer)
Derived from `clinic_packages` table:
```typescript
const services = {
  accommodation: packages.some(p => p.nights_included > 0),
  airportTransfer: packages.some(p => p.transport_included === true),
};
```

### Community Tags
Derived from positive `clinic_mentions`:
```typescript
const communityTags = mentions
  .filter(m => m.sentiment === "positive")
  .map(m => topicLabels[m.topic])
  .filter(unique)
  .slice(0, 4);
```

### Opening Hours Transformation
Converts JSONB to display format with day grouping:
```typescript
// Input: { monday: {open: "09:00", close: "18:00"}, tuesday: {...} }
// Output: [{ day: "Monday - Friday", hours: "9:00 AM - 6:00 PM" }]
```

---

## Acceptable Placeholders

Some placeholders are acceptable because they don't misrepresent clinic data:

| Item | Reasoning |
|------|-----------|
| Hero placeholder images | Visual placeholder, clearly not claiming to be real clinic photos |
| Doctor photo placeholder | Generic avatar, doesn't claim specific identity |
| "Patient" for anonymous reviews | Truthful - it is a patient, just anonymous |

---

## Files Modified

```
lib/api/clinics.ts
components/istanbulmedic-connect/profile/ClinicProfilePage.tsx
components/istanbulmedic-connect/profile/HeroSection.tsx
components/istanbulmedic-connect/profile/ReviewsSection.tsx
components/istanbulmedic-connect/profile/OverviewSection.tsx
components/istanbulmedic-connect/profile/LocationInfoSection.tsx
components/istanbulmedic-connect/profile/DoctorsSection.tsx
components/istanbulmedic-connect/profile/DoctorCard.tsx
components/istanbulmedic-connect/profile/AIInsightsSection.tsx
components/istanbulmedic-connect/profile/TransparencySection.tsx
components/istanbulmedic-connect/profile/SummarySidebar.tsx
components/ui/price-rating-block.tsx
```

---

## Testing Checklist

1. **Clinic with full data** (e.g., Istanbul Hair Masters with seed data):
   - [ ] Rating displays correctly
   - [ ] Years in operation shows real value
   - [ ] Procedures performed shows real value
   - [ ] Opening hours display from database
   - [ ] Payment methods include seeded values
   - [ ] Doctor photos from database
   - [ ] Patient Favorite badge shows (if qualified)

2. **Clinic with minimal/no data**:
   - [ ] Rating shows "—"
   - [ ] Stats show "Not available"
   - [ ] Opening hours show "Contact clinic for hours"
   - [ ] Payment methods show "Contact clinic"
   - [ ] Map shows placeholder if no coordinates
   - [ ] Patient Favorite badge hidden
   - [ ] No fake credentials displayed
   - [ ] No fake AI insights displayed

---

## Future Improvements

- [ ] Add category ratings to database schema (Hygiene, Outcome, etc.)
- [ ] Add doctor education field to `clinic_team` table
- [ ] Consider adding `is_patient_favorite` computed column or flag
- [ ] Add review author names to `clinic_reviews` table
