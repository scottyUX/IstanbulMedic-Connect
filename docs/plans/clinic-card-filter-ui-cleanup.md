# Plan: Clinic Card & Filter Bar UI Cleanup

## Context
The clinic dashboard currently shows a city/country location search input and specialty tags (e.g. "Hair Transplant") on each clinic card. These were placeholders for multi-clinic-type functionality that hasn't materialized yet. Cards also have inconsistent vertical spacing when a clinic has no description — the location/reviews row floats up instead of staying anchored to the bottom.

## Changes

### 1. Hide city/country location search
**File:** `components/istanbulmedic-connect/UnifiedFilterBar.tsx`

Remove the Location input block (lines 60–74) and the divider that precedes it (line 58):
- Delete the `<div className="hidden md:block w-px h-8 ..." />` divider before Location
- Delete the entire Location `<div className="flex-1 relative group">` section

The `location` field remains in `FilterState` and the backend query — only the UI input is hidden. This keeps the data model intact for when the filter is re-enabled later.

### 2. Hide specialty tags on clinic cards
**File:** `components/istanbulmedic-connect/ClinicCard.tsx`

Remove the Tags Section (lines 126–138):
```tsx
{/* Tags Section */}
<div className="mt-5 flex flex-wrap items-center gap-2">
  {specialties.slice(0, 4).map(...)}
</div>
```
Delete this block entirely. The `specialties` prop can stay in the interface for future use.

### 3. Fix uniform card spacing

#### 3a. Consistent bottom row when description is absent
**File:** `components/istanbulmedic-connect/ClinicCard.tsx`

**Root cause:** `CardContent` is a block element, so `mt-auto` on the bottom section does not push it to the card bottom — it only adds a top margin relative to the previous sibling. When description is missing, that margin collapses and location/reviews ride up.

**Fix:** Make `CardContent` a flex column so `mt-auto` works as intended:
```tsx
// Before
<CardContent className="p-6">

// After
<CardContent className="p-6 flex flex-col flex-1">
```

With `flex flex-col` on the parent, `mt-auto` on the bottom section will correctly push it to the bottom regardless of whether description or AI insight are present.

#### 3b. Consistent content start position when clinic name is one line vs two

**File:** `components/istanbulmedic-connect/ClinicCard.tsx`

**Problem:** Short clinic names (one line) leave less height than long names (two lines), so the description and bottom row don't align across cards in the same grid row.

**Fix:** Add `min-h-[4.2rem]` to the `<h3>` — derived from `text-2xl` (1.5rem) × `leading-[140%]` (1.4) × 2 lines = 4.2rem. Short names fill the reserved space; long names still clamp at two lines via `line-clamp-2`.

```tsx
// Before
"mt-4 block font-bold text-foreground leading-[140%] text-2xl line-clamp-2"

// After
"mt-4 block font-bold text-foreground leading-[140%] text-2xl line-clamp-2 min-h-[4.2rem]"
```

### 4. Prevent "Clinic" orphan on hero headline

**File:** `components/istanbulmedic-connect/ExploreClinicsPage.tsx`

On large screens the title "Connect with a Trusted Hair Transplant Clinic" could wrap with "Clinic" alone on the second line. Fix by wrapping "Transplant Clinic" in a `whitespace-nowrap` span so the break can only occur before "Transplant", never between the last two words.

```tsx
// Before
Connect with a Trusted Hair Transplant Clinic

// After
Connect with a Trusted Hair <span className="whitespace-nowrap">Transplant Clinic</span>
```

### 5. Replace rating and review count filter dropdowns with sliders

**File:** `components/istanbulmedic-connect/FilterDialog.tsx`

Both filters already map to nullable numbers in `FilterState` (`minRating: number | null`, `minReviews: number | null`). The `Slider` component is already imported and used in the same dialog for budget range — apply the same pattern.

**Minimum Rating slider**
- Range: `0` – `5`, step `0.1`
- Value `0` = "Any" (maps to `null` in state)
- Display label: `"Any"` when 0, otherwise `"{value.toFixed(1)}+"`
- Replace the `<Select>` block with:
```tsx
<div className="px-2">
  <Slider
    value={[localFilters.minRating ?? 0]}
    min={0} max={5} step={0.1}
    onValueChange={([val]) =>
      setLocalFilters({ ...localFilters, minRating: val === 0 ? null : val })
    }
    className="w-full py-4"
  />
  <div className="flex justify-between mt-2 text-sm text-muted-foreground">
    <span>Any</span>
    <span className="font-medium text-foreground">
      {localFilters.minRating == null ? "Any" : `${localFilters.minRating.toFixed(1)}+`}
    </span>
    <span>5.0</span>
  </div>
</div>
```

**Minimum Reviews slider**
- Range: `0` – `500`, step `10`
- Value `0` = "Any" (maps to `null` in state)
- Display label: `"Any"` when 0, otherwise `"{value}+"`
- Same structure as rating slider above, adapted for reviews

Remove the `RATING_OPTIONS` and `REVIEW_OPTIONS` const arrays and the `Select`-related imports (`Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`) if they are no longer used elsewhere in the file.

**Active value badge**

The selected value next to each slider heading is displayed as a pill badge to make the active state obvious:
- `"Any"` (slider at 0) → grey pill (`bg-muted text-muted-foreground`)
- Active value e.g. `"4.2+"` / `"50+"` → filled teal pill (`bg-[var(--im-color-primary)] text-white`)
- `transition-colors` animates the switch as the slider moves

Requires adding `import { cn } from "@/lib/utils"` to `FilterDialog.tsx`.

### 6. Rename "Alphabetical" sort to "A-Z" and add "Z-A"

**Files:** `lib/filterConfig.ts`, `lib/api/clinics.ts`, `app/clinics/page.tsx`

**`lib/filterConfig.ts`** — rename the key and add Z-A:
```ts
// Before
'Alphabetical': true,

// After
'A-Z': true,
'Z-A': true,
```

**`lib/api/clinics.ts`** — update the `ClinicSortOption` union type and the switch case:
```ts
// Type — rename 'Alphabetical' → 'A-Z', add 'Z-A'
export type ClinicSortOption =
  | 'A-Z'
  | 'Z-A'
  | 'Best Match'
  | ...

// Switch case
case 'A-Z':
  queryBuilder = queryBuilder.order('display_name', { ascending: true });
  break;
case 'Z-A':
  queryBuilder = queryBuilder.order('display_name', { ascending: false });
  break;
```

**`app/clinics/page.tsx`** — update the default fallback in `parseSort`:
```ts
// Before
return "Alphabetical"

// After
return "A-Z"
```

The `ExploreClinicsPage.tsx` derives its default from `SORT_CONFIG` dynamically so no change needed there.

## Files to Modify

| File | Change |
|------|--------|
| `components/istanbulmedic-connect/ExploreClinicsPage.tsx` | Wrap "Transplant Clinic" in `whitespace-nowrap` span to prevent orphan |
| `components/istanbulmedic-connect/UnifiedFilterBar.tsx` | Comment out Location input + its preceding divider |
| `components/istanbulmedic-connect/ClinicCard.tsx` | Comment out Tags Section + unused imports; add `flex flex-col flex-1` to CardContent |
| `components/istanbulmedic-connect/FilterDialog.tsx` | Replace rating/review `Select` dropdowns with `Slider` components; active-value pill badge; remove unused Select imports; add `cn` import |
| `lib/filterConfig.ts` | Rename `'Alphabetical'` → `'A-Z'`, add `'Z-A': true` |
| `lib/api/clinics.ts` | Update `ClinicSortOption` type; add `'Z-A'` sort case; rename `'Alphabetical'` case |
| `app/clinics/page.tsx` | Update `parseSort` default from `"Alphabetical"` to `"A-Z"` |

## Test Changes

### `tests/e2e/clinic-discovery.spec.ts`
- Renamed `sorts clinics alphabetically` → `sorts clinics A-Z`; updated option click from `'Alphabetical'` to `'A-Z'`
- Added `sorts clinics Z-A` test that selects Z-A and asserts URL contains `sort=Z-A`

### `tests/e2e/clinic-filters.spec.ts`
- `can apply rating filter` — rewritten to focus the rating `[role="slider"]` and press ArrowRight 10 times instead of clicking a dropdown; URL assertion changed to `/minRating=/` (any value)
- `can clear all filters` — same slider interaction; added assertion that `minRating` is absent from URL after clearing
- `location input filters results` — changed to `test.skip` with comment explaining the input is hidden until multi-city support is added
- `filter badge shows count when filters active` — replaced with `filter dialog closes on apply without changes` (the original test was already just closing the dialog without asserting badge count)

### `tests/unit/clinics-api.test.ts`
- Added `'A-Z'` case to `applies sorting correctly` asserting `order('display_name', { ascending: true })`
- Added `'Z-A'` case asserting `order('display_name', { ascending: false })`

### `tests/components/ExploreClinicsPage.test.tsx`
- `renders page headline` — changed from `getByText(/.../)` to `getByRole('heading', { name: /.../ })` because wrapping "Transplant Clinic" in a `<span>` splits the text across nodes, breaking single-element text matching

### `tests/components/ClinicCard.test.tsx`
- `renders specialties as tags` and `limits specialties to 4 items` changed to `it.skip` — tags section is commented out until multi-clinic-type support is added

### `tests/setup.tsx`
- Added `global.ResizeObserver` stub — Radix UI's Slider uses `ResizeObserver` internally via `@radix-ui/react-use-size`, which jsdom does not provide

### `app/clinics/compare/page.tsx` (bug fix found via `tsc`)
- Hardcoded `sort: "Alphabetical"` updated to `sort: "A-Z"` to match the renamed type

## Verification

1. Open `/clinics` — the search bar should show only "Clinic name" input + Filters button + Search button (no "City or country" input).
2. Each clinic card should have no colored specialty tags below the image.
3. Compare a card with a description against a card without one — location and rating row should sit at the same vertical position (bottom of card) in both cases.
4. Open the Filters dialog — rating and review filters should be sliders, not dropdowns. Dragging to 0 shows a grey "Any" pill; dragging to a non-zero value shows a filled teal pill e.g. "4.2+" or "50+".
5. Sort dropdown should show "A-Z", "Z-A", "Highest Rated", "Lowest Rated". Selecting Z-A should reverse the clinic list order.
