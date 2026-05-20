# Clinic Sorting Architecture

## Overview

Clinic sorting uses a **database view** (`clinics_with_scores`) to enable efficient ORDER BY operations on columns from related tables. This avoids the limitations of Supabase/PostgREST which cannot sort parent rows by child table columns.

## The Problem

We need to sort clinics by:
- **Rating** (from `clinic_google_places` table)
- **Overall Score** (from `clinic_scores` table)

But Supabase's `referencedTable` ordering doesn't work for this:

```typescript
// This does NOT reorder parent rows - only nested results
queryBuilder.order('rating', {
  referencedTable: 'clinic_google_places',  // Doesn't work as expected
  ascending: false,
});
```

### Previous Workaround (Inefficient)

The old approach fetched ALL clinics, sorted in JavaScript, then paginated:

```typescript
const { data: allClinics } = await queryBuilder; // No pagination
const sorted = allClinics.sort((a, b) => b.rating - a.rating);
return sorted.slice(from, to); // Manual pagination
```

This doesn't scale and wastes bandwidth.

## The Solution: Database View

### View Definition

```sql
-- supabase/migrations/20260310120000_create_clinics_with_scores_view.sql

CREATE OR REPLACE VIEW clinics_with_scores AS
SELECT
  c.*,
  cs.overall_score,
  cs.band AS score_band,
  cs.computed_at AS score_computed_at,
  cgp.rating AS google_rating,
  cgp.user_ratings_total AS google_review_count,
  cgp.place_id AS google_place_id
FROM clinics c
LEFT JOIN clinic_scores cs ON cs.clinic_id = c.id
LEFT JOIN clinic_google_places cgp ON cgp.clinic_id = c.id;
```

### Why a View?

| Approach | Pros | Cons |
|----------|------|------|
| **View** | Single source of truth, always fresh, no sync logic | Minor join overhead |
| **Denormalize** | Fastest queries | Data duplication, sync logic needed |
| **JS sorting** | No migration needed | Fetches all rows, doesn't scale |

For ~30-200 clinics, the view approach is ideal - clean architecture with negligible performance difference.

## Implementation

### Two-Query Pattern

When sorting by rating or score, we use two queries:

```typescript
// 1. Query view for sorted, paginated IDs
const { data: sortedRows } = await supabase
  .from('clinics_with_scores')
  .select('id')
  .eq('status', 'active')
  .order('google_rating', { ascending: false, nullsFirst: false })
  .range(from, to);

const sortedIds = sortedRows.map(r => r.id);

// 2. Fetch full clinic data with relations for those IDs
const { data: clinics } = await supabase
  .from('clinics')
  .select(`*, clinic_services(*), clinic_media(*), ...`)
  .in('id', sortedIds);

// 3. Reorder results to match view sort order
const idOrder = new Map(sortedIds.map((id, i) => [id, i]));
clinics.sort((a, b) => idOrder.get(a.id) - idOrder.get(b.id));
```

### Why Two Queries?

The view doesn't have foreign key relationships defined, so Supabase can't embed related tables (`clinic_services`, `clinic_media`, etc.) directly. The two-query approach:

1. Gets correctly sorted/paginated IDs from the view
2. Fetches full relational data from the base table
3. Preserves sort order

### Sort Options Using the View

| Sort Option | ORDER BY |
|-------------|----------|
| Highest Rated | `google_rating DESC, google_review_count DESC` |
| Lowest Rated | `google_rating ASC, google_review_count ASC` |
| Best Match | `overall_score DESC` |
| Most Transparent | `overall_score DESC` |

### Sort Options NOT Using the View

| Sort Option | ORDER BY |
|-------------|----------|
| Alphabetical | `display_name ASC` (direct on clinics table) |
| Price: Low/High | Not yet implemented (needs pricing data) |

## Code Location

- **Migration**: `supabase/migrations/20260310120000_create_clinics_with_scores_view.sql`
- **API Logic**: `lib/api/clinics.ts` - `getClinics()` function
- **Sort Config**: `lib/filterConfig.ts` - `SORT_CONFIG`

## Adding New Sort Options

1. Add to `ClinicSortOption` type in `lib/api/clinics.ts`
2. Add case in the view query switch statement
3. Add to `needsViewSort` check if it requires score/rating columns
4. Enable in `SORT_CONFIG` in `lib/filterConfig.ts`

Example for a new "Most Reviewed" sort:

```typescript
// In getClinics()
case 'Most Reviewed':
  viewQuery = viewQuery
    .order('google_review_count', { ascending: false, nullsFirst: false })
    .order('google_rating', { ascending: false, nullsFirst: false });
  break;
```

## Future Considerations

### Adding More Rating Sources

When adding Trustpilot, WhatClinic, etc.:

1. Create tables like `clinic_trustpilot`, `clinic_whatclinic`
2. Add aggregate columns to the view:
   ```sql
   CREATE OR REPLACE VIEW clinics_with_scores AS
   SELECT
     c.*,
     -- Existing columns...
     cgp.rating AS google_rating,
     ctp.rating AS trustpilot_rating,
     -- Computed aggregate
     COALESCE(cgp.rating * 0.5 + ctp.rating * 0.5, cgp.rating, ctp.rating) AS aggregate_rating
   FROM clinics c
   LEFT JOIN clinic_google_places cgp ON cgp.clinic_id = c.id
   LEFT JOIN clinic_trustpilot ctp ON ctp.clinic_id = c.id;
   ```

3. Update sort to use `aggregate_rating`

### Performance at Scale

If clinic count grows significantly (10,000+):
- Consider a **materialized view** with periodic refresh
- Add indexes on sort columns
- Monitor query performance

For current scale (~30 clinics), the regular view is more than sufficient.
