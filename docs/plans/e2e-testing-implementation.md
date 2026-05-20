# E2E Testing Implementation Plan

## Context

This document outlines the plan for implementing end-to-end tests, based on a testing diagnosis conducted on 2026-03-10.

## Current Testing State

### Test Scores by Category

| Category | Score | Notes |
|----------|-------|-------|
| Unit Tests | 7/10 | Business logic well tested |
| API Tests | 8/10 | Instagram import has 106 tests |
| Component Tests | 5/10 | Only ~18/106 components tested |
| Integration Tests | 3/10 | No cross-module tests |
| E2E Tests | 0/10 | **Missing entirely** |

### What's Working Well
- Vitest setup is solid with good configuration
- API routes are thoroughly tested (especially instagram import)
- Good mocking patterns established for Supabase
- Transformers and business logic have good coverage
- 424 tests passing, 46 skipped (for hidden features)

### Critical Gaps
1. **No E2E tests** - No Playwright/Cypress setup
2. **No integration tests** - Can't test full user flows
3. **88 untested components** - FilterDialog, TopNav, profile components
4. **No accessibility testing**

## Decision: Focus on E2E Tests

### Why E2E Over Integration Tests

For this codebase:
- Architecture is simple: `Browser → Next.js → API functions → Supabase`
- Not many complex "modules talking to each other"
- E2E tests provide more coverage with less effort

| Approach | Verdict |
|----------|---------|
| Integration tests only | Still need E2E for UI bugs |
| E2E tests only | Tests everything including UI |
| Both | Overkill for current app size |

**Recommendation:** Implement E2E tests first. They catch backend bugs, UI bugs, and navigation bugs all at once.

## Implementation Plan

### Step 1: Set Up Playwright

```bash
npm init playwright@latest
```

Choose:
- TypeScript
- `tests/e2e/` directory
- GitHub Actions workflow (optional)

### Step 2: Configure for Next.js

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  baseURL: 'http://localhost:3000',
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### Step 3: Core User Journeys to Test

Priority order for initial E2E tests:

#### P0: Critical Paths (implement first)
1. **Clinic Discovery Flow**
   - Load `/clinics` page
   - Verify clinic cards render with data
   - Test sort dropdown (Alphabetical, Highest Rated, Lowest Rated)
   - Verify sort order changes

2. **Clinic Profile Flow**
   - Click on a clinic card
   - Verify profile page loads
   - Verify key sections render (hero, location, reviews)

3. **Filter Flow**
   - Open filter dialog
   - Apply rating filter
   - Verify filtered results

#### P1: Important Paths (implement second)
4. **Search Flow**
   - Enter clinic name in search
   - Verify results filter

5. **Location Filter**
   - Filter by city/country
   - Verify results

6. **Pagination**
   - Navigate between pages
   - Verify different clinics load

#### P2: Nice to Have
7. **Review Modal**
   - Open reviews modal
   - Test sort within modal
   - Test search within modal

8. **Mobile Responsiveness**
   - Test key flows on mobile viewport

### Step 4: Example Test Structure

```typescript
// tests/e2e/clinic-sorting.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Clinic Sorting', () => {
  test('sorts clinics by highest rated', async ({ page }) => {
    await page.goto('/clinics');

    // Open sort dropdown
    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Highest Rated');

    // Wait for results to update
    await page.waitForResponse(resp => resp.url().includes('/clinics'));

    // Verify first clinic has high rating
    const firstRating = await page.locator('.clinic-card').first()
      .locator('[data-testid="rating"]').textContent();

    expect(parseFloat(firstRating)).toBeGreaterThanOrEqual(4.5);
  });

  test('sorts clinics by lowest rated', async ({ page }) => {
    await page.goto('/clinics');

    await page.click('[data-testid="sort-dropdown"]');
    await page.click('text=Lowest Rated');

    await page.waitForResponse(resp => resp.url().includes('/clinics'));

    const firstRating = await page.locator('.clinic-card').first()
      .locator('[data-testid="rating"]').textContent();

    expect(parseFloat(firstRating)).toBeLessThan(4.5);
  });
});
```

### Step 5: Add Test IDs to Components

For reliable E2E tests, add `data-testid` attributes:

```tsx
// Components that need test IDs:
// - Sort dropdown: data-testid="sort-dropdown"
// - Clinic cards: data-testid="clinic-card"
// - Rating display: data-testid="rating"
// - Filter button: data-testid="filter-button"
// - Search input: data-testid="search-input"
```

### Step 6: CI Integration (Optional)

Add to `.github/workflows/`:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## Prerequisites

Before starting E2E tests:

1. **Local Supabase running** with seed data
   ```bash
   supabase start
   supabase db reset
   ```

2. **Environment configured** for local development
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
   ```

3. **App runs successfully**
   ```bash
   npm run dev
   # Verify /clinics loads with data
   ```

## Estimated Effort

| Task | Estimate |
|------|----------|
| Playwright setup | 30 min |
| Add test IDs to components | 1 hour |
| P0 tests (3 flows) | 2-3 hours |
| P1 tests (3 flows) | 2 hours |
| CI integration | 30 min |

**Total:** ~6-7 hours for solid E2E coverage of core flows

## Success Criteria

- [x] Playwright configured and running
- [x] 5-10 E2E tests covering critical paths (17 tests implemented)
- [ ] Tests run in CI (optional but recommended)
- [x] All tests pass on local with seeded data
