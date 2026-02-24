# Test Coverage Plan

## Current State

### Testing Framework
- **Vitest** v4.0.18 with jsdom environment
- **React Testing Library** for component tests
- Config: `vitest.config.ts`
- Setup: `tests/setup.tsx`

### Running Tests
```bash
npm test          # Watch mode
npm run test:run  # Single run (CI)
npm run test:coverage  # With coverage report
```

### Current Test Files (19 files, 294 tests)

| File | Tests | Coverage |
|------|-------|----------|
| `tests/unit/transformers.test.ts` | 27 | `lib/transformers/clinic.ts` - 100% function coverage |
| `tests/unit/clinics-api.test.ts` | 36 | `lib/api/clinics.ts` - getClinics, getClinicById, getClinicCities, getServiceCategories |
| `tests/components/OverviewSection.test.tsx` | 5 | Rendering, null handling |
| `tests/components/LocationInfoSection.test.tsx` | 7 | Rendering, null handling, map display |
| `tests/components/DoctorCard.test.tsx` | 6 | Rendering, credentials, experience |
| `tests/components/AIInsightsSection.test.tsx` | 2 | Rendering, empty state |
| `tests/components/TransparencySection.test.tsx` | 2 | Rendering, accreditations |
| `tests/components/ClinicCard.test.tsx` | 16 | Rendering, interactions, null handling |
| `tests/components/ExploreClinicsPage.test.tsx` | 22 | Grid, pagination, sorting, empty state |
| `tests/components/ClinicProfilePage.test.tsx` | 24 | Data transformation, section rendering |
| `tests/components/HeroSection.test.tsx` | 15 | Images, rating, Patient Favorite badge |
| `tests/components/PricingSection.test.tsx` | 14 | Price formatting, currencies, empty state |
| `tests/components/ReviewsSection.test.tsx` | 16 | Reviews, ratings, grammar handling |
| `tests/components/PackagesSection.test.tsx` | 23 | Package cards, pricing, inclusions/exclusions, badges |
| `tests/components/DoctorsSection.test.tsx` | 14 | Doctor list, credentials, initials, photos |
| `tests/components/CommunitySignalsSection.test.tsx` | 21 | Post rendering, sentiment, themes, tabs, expand/collapse |
| `tests/components/InstagramIntelligenceSection.test.tsx` | 11 | Platform tabs, Instagram data display |
| `tests/components/SummarySidebar.test.tsx` | 23 | Pricing, actions, modals, callbacks |
| `tests/components/SectionNav.test.tsx` | 9 | Tab rendering, navigation, sticky positioning |

### What's Well Tested

#### `lib/transformers/clinic.ts` (100%)
- `toNumber()` - type coercion, edge cases
- `formatTime()` - 24h to 12h conversion
- `transformOpeningHours()` - grouping consecutive days
- `deriveServicesFromPackages()` - service detection
- `deriveCommunityTags()` - tag extraction from mentions
- `isPatientFavorite()` - rating/review threshold logic

#### `lib/api/clinics.ts` (✅ COMPLETED)
- `getClinics()` - filtering, pagination, sorting, error handling
- `getClinicById()` - data transformation, null handling, 404 handling
- `getClinicCities()` - deduplication, error handling
- `getServiceCategories()` - deduplication, error handling
- `mapClinicRow()` - data transformation, media sorting, specialty limiting

#### Core Page Components (✅ COMPLETED)
- `ExploreClinicsPage.tsx` - clinic grid, pagination, sorting, empty state, filter integration
- `ClinicProfilePage.tsx` - data transformation, section rendering, missing data handling
- `ClinicCard.tsx` - rendering, interactions, null handling

#### Profile Sections (✅ COMPLETED)
| Component | Status | Tests |
|-----------|--------|-------|
| `OverviewSection.tsx` | ✅ Tested | 5 |
| `LocationInfoSection.tsx` | ✅ Tested | 7 |
| `DoctorCard.tsx` | ✅ Tested | 6 |
| `AIInsightsSection.tsx` | ✅ Tested | 2 |
| `TransparencySection.tsx` | ✅ Tested | 2 |
| `HeroSection.tsx` | ✅ Tested | 15 |
| `PricingSection.tsx` | ✅ Tested | 14 |
| `ReviewsSection.tsx` | ✅ Tested | 16 |
| `PackagesSection.tsx` | ✅ Tested | 23 |
| `DoctorsSection.tsx` | ✅ Tested | 14 |
| `CommunitySignalsSection.tsx` | ✅ Tested | 21 |
| `InstagramIntelligenceSection.tsx` | ✅ Tested | 11 |
| `SummarySidebar.tsx` | ✅ Tested | 23 |
| `SectionNav.tsx` | ✅ Tested | 9 |

---

## Coverage Gaps

### ~~Priority 1: Remaining Profile Sections~~ ✅ COMPLETED

All profile sections now have test coverage.

### Priority 1: Filter Components (Previously Priority 2)

#### `components/istanbulmedic-connect/FilterDialog.tsx` (0%)
- [ ] Filter selection
- [ ] Apply/clear filters
- [ ] Filter state management

#### `components/istanbulmedic-connect/UnifiedFilterBar.tsx` (0%)
- [ ] Search input
- [ ] Filter dropdown interactions

### Priority 2: Supabase Infrastructure

#### `lib/supabase/` (0%)
- [ ] `server.ts` - client creation
- [ ] `client.ts` - browser client
- [ ] `middleware.ts` - session refresh

**Approach:** Integration tests or mock environment variables.

### Priority 3: UI Components

#### `components/ui/` (0%)
These are mostly Radix-based, low priority but could add:
- [ ] `button.tsx` - variant rendering
- [ ] `card.tsx` - composition
- [ ] `badge.tsx` - variant rendering
- [ ] Custom components: `price-rating-block.tsx`, `verification-badge.tsx`

### Priority 4: Landing Page Components

#### `components/landing/` (0%)
Lower priority since mostly static content:
- [ ] `FAQSection.tsx` - accordion behavior
- [ ] `CategoryPillsSection.tsx` - pill selection
- [ ] Other sections - basic render tests

### Priority 5: Leila (AI Chat) Components

#### `components/leila/` (0%)
- [ ] `LeilaChat.tsx` - message rendering
- [ ] `ConsultationScheduler.tsx` - form submission
- [ ] `UserContextProvider.tsx` - context provision

---

## Testing Infrastructure

### Coverage Tool
Already configured with v8 provider. Run:
```bash
npm run test:coverage
```

### Integration Tests (Future)
Consider adding:
- [ ] API route tests (`app/api/`)
- [ ] Full page render tests with MSW for mocking

### E2E Tests (Future)
Consider Playwright or Cypress for:
- [ ] User flows (browse clinics → view profile → contact)
- [ ] Filter interactions
- [ ] Auth flows

---

## Suggested Next Steps

1. ~~**Remaining profile sections** - PackagesSection, DoctorsSection, etc.~~ ✅ COMPLETED
2. **Filter components** - FilterDialog, UnifiedFilterBar
3. **Supabase infrastructure** - server/client creation, middleware
4. **UI components** - As needed
5. **Landing/Leila** - Lower priority

---

## Notes

- Current tests use mocked Next.js router and Image component (see `tests/setup.tsx`)
- Tests verify both happy path and null/missing data scenarios
- DoctorCard/HeroSection tests have console warnings about `fill`/`priority` attributes (minor, Lucide/Next.js Image issue)
- Some Dialog components show accessibility warnings in tests (can be fixed by adding DialogTitle)
