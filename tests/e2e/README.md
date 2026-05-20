# E2E Tests

End-to-end tests using Playwright to verify critical user flows.

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run specific browser
npx playwright test --project=chromium

# Run specific test file
npx playwright test clinic-discovery.spec.ts
```

## Prerequisites

- Local Supabase running with seeded data:
  ```bash
  supabase start
  supabase db reset
  ```

## Test Coverage

### Clinic Discovery (`clinic-discovery.spec.ts`)

Tests the main clinics listing page at `/clinics`.

| Test | Description |
|------|-------------|
| loads the clinics page with clinic cards | Verifies clinic grid and cards render |
| displays clinic count in header | Verifies "X clinics available" header |
| sorts clinics by Highest Rated | Tests sort dropdown → Highest Rated |
| sorts clinics by Lowest Rated | Tests sort dropdown → Lowest Rated |
| sorts clinics alphabetically | Tests sort dropdown → Alphabetical |
| shows empty state when no results | Tests search with non-matching query |

### Clinic Profile (`clinic-profile.spec.ts`)

Tests navigation to and rendering of individual clinic pages.

| Test | Description |
|------|-------------|
| navigates from clinics list to profile | Click card → profile page loads |
| clinic profile page renders key sections | Hero, name, reviews section visible |
| clinic profile shows location information | Location section renders |
| can navigate back to clinics list | Browser back returns to listing |

### Clinic Filters (`clinic-filters.spec.ts`)

Tests the filter dialog and search functionality.

| Test | Description |
|------|-------------|
| opens filter dialog | Clicks Filters button → dialog opens |
| can apply rating filter | Select rating → URL updates with filter |
| can clear all filters | Clear all button resets filters |
| filter dialog closes on apply | Apply button closes dialog |
| search input filters results | Type in search → URL updates |
| location input filters results | Type location → URL updates |
| filter badge shows count | Active filters show badge count |

## Test IDs

Components use `data-testid` attributes for reliable selection:

| Test ID | Component | Location |
|---------|-----------|----------|
| `clinics-grid` | Clinic cards container | ExploreClinicsPage |
| `clinic-card` | Individual clinic card | ClinicCard |
| `clinic-rating` | Rating display on card | ClinicCard |
| `sort-dropdown` | Sort by dropdown | ExploreClinicsPage |
| `search-input` | Clinic name search | UnifiedFilterBar |
| `location-input` | Location filter input | UnifiedFilterBar |
| `filter-button` | Opens filter dialog | UnifiedFilterBar |
| `filter-dialog` | Filter dialog container | FilterDialog |
| `rating-filter` | Rating dropdown in dialog | FilterDialog |
| `filter-apply-button` | "Show results" button | FilterDialog |
| `filter-clear-button` | "Clear all" button | FilterDialog |
| `clinic-profile` | Profile page container | ClinicProfilePage |
| `clinic-name` | Clinic name in hero | HeroSection |

## Adding New Tests

1. Add test IDs to components: `data-testid="your-test-id"`
2. Create or update spec file in `tests/e2e/`
3. Follow existing patterns for page navigation and assertions
4. Run tests to verify: `npm run test:e2e`
