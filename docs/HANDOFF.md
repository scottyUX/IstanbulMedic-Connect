# IstanbulMedic-Connect — Project Hand-Off

**Course:** UCSC CSE 115C  
**Handoff Date:** May 2026  
**Document Type:** Incoming Team Orientation

---

## Acknowledgements

This project was designed, built, and documented by the outgoing UCSC CSE 115C student team. Over the course of the academic year they delivered a full-stack application from scratch — including an AI-powered generative UI assistant, a clinic discovery and filtering platform, Google OAuth authentication, Instagram and Google Maps integrations, and a comprehensive test suite.

The documentation they left behind — architecture decisions, sprint reports, session notes, feature specs, and this hand-off — reflects a genuine commitment to setting up the next team for success.

**To the outgoing team:** thank you for your hard work, your thoughtfulness, and everything you built. This project is in good hands because of the foundation you laid.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [What Was Built](#2-what-was-built)
3. [How to Expand to More Clinics](#3-how-to-expand-to-more-clinics)
4. [Technology Stack](#4-technology-stack)
5. [Repository Structure](#5-repository-structure)
6. [Local Development Setup](#6-local-development-setup)
7. [Authentication Flow](#7-authentication-flow)
8. [Database & Migrations](#8-database--migrations)
9. [Testing](#9-testing)
10. [Known Bugs & Gaps](#10-known-bugs--gaps)
11. [Documentation Index](#11-documentation-index)
12. [Task Tracker](#12-task-tracker)
13. [Release 2 Plan](#13-release-2-plan)
14. [Suggested Next Steps](#14-suggested-next-steps)

---

## 1. Project Overview

**IstanbulMedic-Connect** is a medical tourism platform that connects international patients with healthcare providers in Istanbul, Turkey. It functions as an intelligent marketplace where patients can discover, filter, and compare clinics and get guided through the process by an AI assistant named **Leila**.

**The problem it solves:** International patients researching medical care in Istanbul face a fragmented, trust-deficient information landscape. This platform centralizes clinic discovery, surfaces transparency signals, and wraps the experience in a conversational AI guide.

**Core user flow:**

1. Patient lands on the platform and signs in with Google
2. They navigate to their dashboard to upload personal and medical information that will be shared with clinics they are interested in
3. They interact with **Leila** — an AI assistant that asks about their treatment needs and guides them to relevant clinics
4. They browse, filter, and compare clinics using the discovery interface
5. They view clinic profiles including reviews, ratings, and trust scores
6. They bookmark and schedule free consultations with clinics that match their preferences

---

## 2. What Was Built

| Feature | Notes |
|---|---|
| Google OAuth login (Supabase) | See `TESTING_PHASE1.md` |
| Landing page | |
| Clinic discovery & browse | |
| Clinic detail profiles | |
| AI assistant — Leila (CopilotKit) | Static Generative UI active; two other patterns prototyped only (see §4) |
| Clinic filtering by treatment category | |
| Instagram embeds | See `docs/features/instagram/` |
| Google Maps integration | |
| Unit & component tests | Vitest + React Testing Library |

---

## 3. How to Expand to More Clinics

The platform was designed with clinic growth in mind. Data pipelines are in place that make adding new clinics relatively straightforward — you do not need to manually author records from scratch.

### Data Sources

Clinic data flows in from three external sources:

**Google Places API** — Provides core clinic metadata including name, address, phone, website, rating, and review count. The field mapping from Google Places to the internal clinic schema is documented in `docs/data-sources/google-places-data-mapping.md`.

**Instagram (via Apify scraper)** — Provides social signals such as follower count, post engagement, and media content. The pipeline is documented in `docs/data-sources/instagram-pipeline-README.md` and `docs/features/instagram/`.

**Reddit (public JSON endpoint)** — Provides patient-reported signals from hair transplant subreddits (e.g. r/HairTransplants). The scraper hits `reddit.com/r/<sub>.json` with a User-Agent header — no OAuth app or API credentials required. It extracts post titles, comment text, upvotes, and clinic mentions, which are then attributed to clinics and surfaced as community signals on clinic profiles. The pipeline lives in `app/api/redditPipeline/`. Plans and schema are in `docs/plans/forums/reddit/`.

**Note** The Hair Resotrnation Network (HRN) Forum has a data pipeline built aswell but due to TOS we are not allowed to manually scrape yet. Once Istanbul Medic works out a deal with HRN we can put it into use.

### Adding a New Clinic

1. **Locate the clinic on Google Places** and obtain its Place ID.
2. **Run the Google Places ingestion pipeline** to pull clinic data into the database. The data mapping guide in `docs/data-sources/google-places-data-mapping.md` describes how each field maps to the clinic schema.
3. **Run the Instagram scraper** (Apify) for the clinic's Instagram handle if available. See `docs/data-sources/instagram-pipeline-README.md` for setup.
4. **Rerun Reddit attribution on existing data** — the Reddit pipeline attributes scraped posts to known clinics at scrape time. Any Reddit posts that mentioned the new clinic before it existed in the database will have been left unattributed. After adding the clinic record, re-run the attribution step against the already-scraped posts to retroactively link those historical mentions to the new clinic. See `docs/plans/forums/reddit/` for pipeline details. If new posts are attributed run the recompute clinic profiles script as detailed in the aformentioned pipeline details.
5. **Apply any missing fields manually** via the Supabase dashboard or a SQL migration — for example, treatment categories, package details, or verification status that cannot be inferred from external sources.
6. **Verify the clinic appears correctly** in the discovery interface and on its detail profile page.


### Schema Reference

The clinic schema is defined in the Supabase migrations under `supabase/migrations/`. TypeScript types can be regenerated at any time with:

```bash
npm run supabase:gen-types
```

The forum scraping initiative (Reddit and HRN) was also underway to enrich clinic profiles with patient-reported data. See `docs/plans/forums/` for the MVP plan and current progress.

---

## 4. Technology Stack

### Frontend

| Tool | Version | Purpose |
|---|---|---|
| Next.js | 16 (App Router) | Framework |
| React | 19.2.3 | UI library |
| TypeScript | 5 | Language (97.5% of codebase) |
| Tailwind CSS | 4 | Styling |
| Framer Motion | latest | Animations |
| Radix UI | latest | Accessible component primitives |
| Lucide React | latest | Icons |
| Recharts | latest | Data visualization |

### AI & Generative UI

| Tool | Purpose |
|---|---|
| CopilotKit | Generative UI framework powering Leila |
| LangChain | Agent orchestration layer for Leila |
| OpenAI API | LLM backbone for Leila (gpt-4o-mini) |

Three generative-UI patterns were explored for Leila. **Only the first is currently wired into the live app** — the other two are prototype scaffolding (dependencies and demo components exist but are not rendered on any active page).

**Static Generative UI** ✅ *Active* — predefined React components rendered by the AI via CopilotKit actions. This is what Leila actually uses today: the agent calls server tools and the results render as cards/tables. Implemented in `components/langchain/LangchainGenUI.tsx` (tools include `clinic_summary`, `doctor_profile`, `clinic_reviews`, `clinic_packages`, `clinic_comparison`) and mounted in `app/langchain/page.tsx`.

**Declarative Generative UI (A2UI)** 🚧 *Prototype only* — dynamic JSON specs drive UI. The `@a2ui/lit` dependency and prototype components exist but are not wired into any active page.

**Open-ended Generative UI (MCP Apps)** 🚧 *Prototype only* — fully open-ended agent output via an MCP server. Dependencies exist but no MCP server is configured and the demo route was removed.

> **Note:** `@anthropic-ai/sdk` appears in `package.json` but is never actually imported or used — Leila runs entirely on OpenAI. It can safely be removed as cleanup.

### Backend & Data

| Tool | Purpose |
|---|---|
| Supabase (PostgreSQL) | Database and auth |
| Google OAuth | User authentication (via Supabase) |
| Google Places API | Clinic location data |

### Data Pipelines

The platform enriches clinic profiles with external data through three pipelines. A note on what these actually are, since the names can be misleading:

| Source | What it really is | Implementation |
|---|---|---|
| Google Places | Official Google Places API | Clinic metadata: name, address, phone, website, rating, review count |
| Instagram | **Apify scraper** (not the official Instagram/Meta Graph API) | Runs an Apify Instagram scraper to pull follower count, post engagement, and media. Requires `APIFY_API_TOKEN`. See `app/api/instagramPipeline/`. |
| Reddit | **Public JSON endpoint** (not the official Reddit API with OAuth) | Scrapes subreddit posts/comments from `reddit.com/r/<sub>.json` with just a User-Agent header — no OAuth app, no API credentials. See `app/api/redditPipeline/`. |

> **Why this matters for the next team:** Neither the Instagram nor the Reddit pipeline uses an official, authenticated API. Instagram goes through Apify (a paid third-party scraping service), and Reddit hits Reddit's unauthenticated public JSON endpoint. Both are subject to rate limits, scraper breakage, and terms-of-service risk, and may need to migrate to official APIs if the platform scales.

### Testing

| Tool | Purpose |
|---|---|
| Vitest | Unit and component test runner |
| React Testing Library | Component testing |
| Playwright | End-to-end tests |
| JSDOM 25.0.1 | DOM simulation |

### Deployment

| Tool | Purpose |
|---|---|
| Vercel | Frontend hosting (auto-deploys from `main`) |
| Supabase (hosted) | Production database |

---

## 5. Repository Structure

```
IstanbulMedic-Connect/
├── app/                          # Next.js App Router
│   ├── api/                      # Backend API route handlers
│   ├── auth/callback/            # Google OAuth callback
│   └── clinics/                  # Clinic discovery pages
├── components/
│   ├── clinic-profile/           # Clinic detail view
│   ├── istanbulmedic-connect/    # Core app components
│   ├── landing/                  # Landing page
│   ├── leila/                    # AI assistant UI
│   └── ui/                       # Shared Radix UI components
├── contexts/                     # React context providers
├── docs/
│   ├── architecture/             # System design, data layer, component decisions
│   ├── comparison/               # Scoring and testing comparisons
│   ├── data-sources/             # External API integrations (Google Places & Instagram)
│   ├── features/                 # Per-feature documentation
│   ├── plans/                    # Implementation plans, organized by area
│   │   ├── forums/               # Forum scraping schemas and pipelines
│   │   ├── infrastructure/       # CI/CD and deployment plans
│   │   ├── testing/              # E2E and coverage plans
│   │   └── ui/                   # UI revamp and cleanup plans
│   ├── reviews/                  # Code and PR reviews
│   ├── schemas/                  # Database schemas and data architecture
│   ├── sessions/                 # Session summaries
│   ├── specs/                    # Technical specifications
├── lib/
│   ├── api/                      # Data fetching functions
│   ├── supabase/                 # Supabase client setup
│   └── transformers/             # Data transformation utilities
├── public/                       # Static assets
├── scripts/                      # Utility scripts
├── supabase/
│   ├── migrations/               # Versioned DB migrations
│   └── seed.sql                  # Dev seed data
├── tests/
│   ├── unit/                     # Unit tests
│   ├── components/               # Component tests
│   └── e2e/                      # Playwright E2E tests
├── types/                        # TypeScript type definitions
├── middleware.ts                  # Session management (must live at root)
├── next.config.ts                # Next.js config
├── README.md                     # Project overview
└── TESTING_PHASE1.md             # OAuth login testing guide
```

---

## 6. Local Development Setup

### Prerequisites

* Node.js 18+
* npm or yarn
* [Supabase CLI](https://supabase.com/docs/guides/cli)
* Docker (required for local Supabase)
* Google Cloud project with OAuth 2.0 credentials
* OpenAI API key
* Anthropic API key (optional, for Claude features)

### Step-by-Step

**1. Clone and install**

```bash
git clone https://github.com/scottyUX/IstanbulMedic-Connect.git
cd IstanbulMedic-Connect
npm install
```

**2. Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ANTHROPIC_API_KEY=
```

**3. Start local Supabase**

```bash
supabase start
```

**4. Initialize the database**

```bash
supabase db reset
```

This runs all migrations in `supabase/migrations/` and seeds development data from `supabase/seed.sql`.

**5. Start the dev server**

```bash
npm run dev
# App runs at http://localhost:3000
# If port 3000 is in use:
npm run dev -- -p 3001
```

### npm Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:coverage` | Generate coverage report |
| `npm run supabase:gen-types` | Regenerate TypeScript types from schema |

---

## 7. Authentication Flow

The app uses **Google OAuth via Supabase**. Session management is handled automatically by `middleware.ts`.

```
User clicks "Sign in with Google"
        ↓
loginWithGoogle(next) in AuthContext
  - Saves destination in auth_redirect_next cookie (5-min TTL)
        ↓
Supabase OAuth endpoint → Google authenticates user
        ↓
Redirect to /auth/callback
        ↓
Callback reads auth_redirect_next cookie → determines destination
  - Falls back to /profile if cookie is missing or invalid
        ↓
On first sign-in only:
  - Calls Google People API (birthday, gender, phone, country, language)
  - Writes results to users, user_profiles, user_qualification tables
        ↓
Session stored → redirect to destination (default: /profile)
  - auth_redirect_next cookie cleared
        ↓
middleware.ts validates/refreshes session on every subsequent request
```

### Post-Login Redirect Destination

The destination after login is **dynamic**, not hardcoded. The flow works as follows:

1. The login page reads a `?next=` query param (e.g. `/auth/login?next=/langchain`). If absent, it defaults to `/profile`.
2. Before starting OAuth, `loginWithGoogle()` in `AuthContext.tsx` persists that destination in an `auth_redirect_next` cookie (5-minute TTL, SameSite=Lax). This is necessary because Supabase strips query params from the OAuth `redirectTo` URL.
3. The callback handler in `app/auth/callback/route.ts` reads the cookie, validates it (must start with `/`, must not be a legacy path), and redirects there. If the cookie is missing or invalid, it falls back to `/profile`.

This means any page that triggers a login redirect can control where the user lands after authenticating — for example, the bookmarks page sets the cookie to `/profile?section=consultations` before sending the user to login.

### Critical Configuration

| Setting | Value |
|---|---|
| Google Cloud redirect URI | `http://localhost:3000/auth/callback` (exact match required) |
| Supabase callback URL | Same — set under Authentication > URL Configuration |
| Default post-login redirect | `/profile` (fallback in `app/auth/callback/route.ts` when no valid `auth_redirect_next` cookie is present) |
| OAuth scopes requested | `profile`, `email`, `user.birthday.read`, `user.gender.read`, `user.phonenumbers.read`, `user.addresses.read` |

### First Sign-In Profile Population

On a user's **first** login only, the callback makes an additional call to the **Google People API** using the provider token. It extracts name, email, gender, birthday, country, phone number, and preferred language, then writes them to three tables: `users`, `user_profiles`, and `user_qualification`. This pre-populates the user's profile without requiring them to fill out a form. On subsequent logins this step is skipped — user edits to their profile are never overwritten by Google data.

---

## 8. Database & Migrations

The database is managed via **Supabase** with versioned migrations in `supabase/migrations/`.

**Apply migrations to production:**

```bash
supabase db push --prod
```

**Regenerate TypeScript types after schema changes:**

```bash
npm run supabase:gen-types
```

**Schema documentation:**

`docs/schemas/`
* `database-overview.md` — top-level DB overview
* `api_schema_docs.md` — API schema reference
* `patient-profile-architecture.md` — patient profile data model
* `migration-20260214-schema-enhancements.md` — schema enhancement notes

`docs/architecture/`
* `backend-schema-mapping.md` — full backend schema mapping
* `clinic-scoring-schema.md` — clinic scoring tables and relationships
* `data-layer-architecture.md` — data layer structure

`docs/plans/`
* `Initial Data Sources & Schemas.md` — original data sources
* `forums/forum-scraping-schema.md` — forum scraping schema

docs/data-sources/
* `google-places-data-mapping.md` — Google Places field mapping
* `instagram-pipeline-README.md` — Instagram data pipeline

`docs/features/instagram/data-mapping.md` — Instagram signal schema

`supabase/migrations/` — SQL migration files (ground truth for live schema)

`lib/supabase/database.types.ts` — auto-generated TypeScript types mirroring the live DB

---

## 9. Testing

### Running Tests

```bash
npm run test:run        # run all Vitest tests once
npm test               # watch mode
npm run test:coverage  # with coverage report
npm run test:e2e       # Playwright end-to-end tests
```

### Coverage Summary

| Layer | Files | Approx. test cases | What's covered |
|---|---|---|---|
| Unit | 11 | ~235 | Scoring algorithms, data transformations, API data-fetching functions — all pure logic, no DB or network |
| Component | 48 | ~860 | Every major UI component rendered with React Testing Library against JSDOM |
| API routes | 9 | ~275 | Route handlers for auth, clinics, consultations, profile, and forum/Reddit pipelines — DB and auth mocked |
| Agent | 12 | ~220 | Leila's LangChain agent, all 6 GenUI tools, and input/output guardrails — tested in isolation |
| Integration | 3 | ~35 | Full CopilotKit + LangChain API stack with mocked LLM calls |
| E2E (Playwright) | 3 | ~20 | Clinic discovery, filtering, and profile pages in a real browser against the running dev server |

**Where coverage is thin:**

- **E2E breadth is narrow.** The 3 Playwright specs only cover the clinic browse/discovery/profile flow. There are no automated E2E tests for auth (the login flow was documented as a manual checklist in `TESTING_PHASE1.md`), for Leila, for the user profile pages, or for the consultation flow.
- **Integration tests are limited.** Only the CopilotKit/LangChain API routes have integration-level coverage. Other API routes (Reddit pipeline, Instagram pipeline, Google Places ingestion) are tested at the unit/API layer but not end-to-end.
- **No tests for the Supabase migration scripts themselves.** Schema correctness is verified indirectly through the API and component tests, but the migrations are not run in CI.

### Test Suite Overview

```
tests/
│
├── unit/                          Pure logic — no DB or network
│   ├── clinics-api.test.ts            Clinic data-fetching functions (getClinics, getClinicById, etc.)
│   ├── forum-score.test.ts            Forum scoring algorithm (confidence tiers, recency decay, repair penalty, etc.)
│   ├── hrn-api.test.ts                HRN signal data-fetching
│   ├── hrn-score.test.ts              HRN scoring algorithm
│   ├── hrnEntityFilter.test.ts        HRN entity regex matching and clinic name filtering
│   ├── instagram-api.test.ts          Instagram signal data-fetching
│   ├── reddit-api.test.ts             Reddit signal data-fetching
│   ├── scoring-metrics.test.ts        Per-source metric computations (Google star/review-count, Reddit, credentials)
│   ├── scoring-overall.test.ts        Overall score aggregation (band assignment, rounding, clamping)
│   ├── scoring-pillars.test.ts        Pillar score composition (reputation, evidence/transparency weights)
│   └── transformers.test.ts           Data transformation utilities (formatTime, deriveServices, deriveCommunityTags, etc.)
│
├── api/                           API route handlers — DB and auth mocked
│   ├── authCallback.test.ts           GET /auth/callback: code exchange, cookie-based redirect, legacy path blocking
│   ├── clinics-scraped-data.test.ts   Scraped data field resolution (description, techniques, URL normalisation, feature flag)
│   ├── consultations.test.ts          POST / GET / PATCH /api/consultations
│   ├── profileRoutes.test.ts          GET / POST /api/profile/* (qualification, treatment, status, photos)
│   ├── forumPipeline/
│   │   ├── deterministicExtractor.test.ts   Signal extraction from forum posts (graft count, timeline markers, issues, repair flag)
│   │   ├── llmAttributor.test.ts            LLM-based clinic attribution (substring match, thread attribution logic)
│   │   └── profileAggregator.test.ts        Forum profile recomputation and stale-profile batch updates
│   └── redditPipeline/
│       ├── redditPipeline.test.ts     Full pipeline orchestration (dry-run, comment ingestion, error handling, result shape)
│       └── redditService.test.ts      Reddit fetch layer (fetchSubredditPosts, fetchPostComments)
│
├── agents/langchain/              Leila AI agent internals
│   ├── agent.test.ts                  LangchainAgent: initialisation, state, message handling, tool registration, streaming
│   ├── agent-guardrails.test.ts       Guardrail integration with the agent (input/output blocking, multi-turn enforcement)
│   ├── guardrails.test.ts             Guardrail functions in isolation (checkInputGuardrails, checkOutputGuardrails)
│   ├── adapter.test.ts                CopilotKit ↔ LangChain adapter layer
│   ├── guardrails/
│   │   └── schema-allowlist.test.ts   Tool schema allowlist enforcement in guardrails
│   └── tools/                         Each of Leila's GenUI tools tested in isolation
│       ├── _shared.test.ts                Shared tool utilities
│       ├── clinicComparison.test.ts       clinic_comparison tool
│       ├── clinicPackages.test.ts         clinic_packages tool
│       ├── clinicReviews.test.ts          clinic_reviews tool
│       ├── clinicSummary.test.ts          clinic_summary tool
│       ├── databaseLookup.test.ts         database_lookup tool
│       └── doctorProfile.test.ts          doctor_profile tool
│
├── components/                    React component rendering — React Testing Library + JSDOM
│   ├── AIInsightsSection.test.tsx         AI insights panel on the clinic profile
│   ├── BookmarkButton.test.tsx            Bookmark toggle button state and interaction
│   ├── BookmarksPage.test.tsx             Full bookmarks page
│   ├── ClinicCard.test.tsx                Clinic card (including consultation CTA variant)
│   ├── ClinicProfilePage.test.tsx         Clinic profile page layout and section assembly
│   ├── CommunitySignalsSection.test.tsx   Community signals section (Reddit / HRN / Google / Instagram views)
│   ├── ComparisonViews.test.tsx           Comparison page (score pills, mobile switcher, sorting)
│   ├── DoctorCard.test.tsx                Doctor card component
│   ├── DoctorsSection.test.tsx            Doctors section (loading / empty / populated states)
│   ├── ExploreClinicsPage.test.tsx        Clinic discovery page (rendering, pagination, sorting, filter integration)
│   ├── GetStarted.test.tsx                Landing page Get Started section
│   ├── HeroSection.test.tsx               Landing page hero section
│   ├── LocationInfoSection.test.tsx       Clinic location info section
│   ├── OverviewSection.test.tsx           Clinic overview section
│   ├── PackagesSection.test.tsx           Treatment packages section
│   ├── PricingSection.test.tsx            Pricing section
│   ├── ProfileDashboard.test.tsx          User profile dashboard
│   ├── RegistrySection.test.tsx           Registry/credentials section
│   ├── ReviewsSection.test.tsx            Reviews section (sorting, date parsing, modal search)
│   ├── ScoreBreakdownCard.test.tsx        Trust/transparency score breakdown card
│   ├── SectionNav.test.tsx                Clinic profile section navigation bar
│   ├── SummarySidebar.test.tsx            Summary sidebar (consultation flow, cancellation, trust score block)
│   ├── TransparencySection.test.tsx       Transparency section
│   ├── langchain/
│   │   ├── LangchainChat.test.tsx         Leila chat UI (initial render, message list states)
│   │   └── LangchainInput.test.tsx        Leila chat input field
│   └── sections/
│       ├── ProfileHairLossStatus.test.tsx User profile — hair loss status section
│       ├── ProfileHome.test.tsx           User profile — home/overview section
│       └── ProfilePersonalInfo.test.tsx   User profile — personal info section
│
├── integration/                   Full API route + agent stack — LLM calls mocked
│   ├── copilotkit-langchain.test.ts   /api/copilotkit-langchain route, guardrail integration, conversation history
│   ├── copilotkit-runtime.test.ts     CopilotKit runtime configuration
│   └── langchain-tools-route.test.ts  /api/langchain-tools: database_lookup, clinic_summary, input validation
│
├── e2e/                           Playwright browser tests — requires running dev server
│   ├── clinic-discovery.spec.ts       Browse and navigate the clinic discovery page
│   ├── clinic-filters.spec.ts         Apply, combine, and clear clinic filters
│   └── clinic-profile.spec.ts         View a clinic detail profile page end-to-end
│
├── lib/
│   └── userProfile.test.ts        User profile library functions
│
└── import-google-places.test.ts   Google Places ingestion pipeline (data mapping, URL normalisation)
```

---

## 10. Known Bugs & Gaps

These are documented issues the incoming team should be aware of before making changes.

### Authentication

Session cookie occasionally fails to persist across hard browser refresh. Root cause not confirmed; suspected middleware timing issue.

### Clinic Filtering

The **location filter** accepts free text but does not validate against the list of Istanbul districts — users can enter anything with no error feedback.

The **rating filter** UI is wired up but the backend query does not yet apply the filter — results are unaffected by the slider.

The **review count threshold**, **budget/price range**, and **verified toggle** filters similarly have no backend implementation.

### Trust/Transparency Score

The label "AI Match Score" still appears in several places in the UI. It should be renamed to "Trust/Transparency Score" throughout. See `docs/plans/filters.md`.

### Instagram Integration

Known gaps are documented in `docs/features/instagram/implementation-gaps.md` — several data fields are unsupported in the current UI sections.

### User Profile / Treatment Passport

The onboarding wizard architecture is defined in `docs/features/user-profile/` but the implementation is incomplete. The flow drops off after the initial auth step.

### Forum Scraper (Reddit / HRN)

The scraper MVP plan exists but is not deployed. The database migration for forum tables (`docs/plans/forums/20260409000000_create_forum_scraping_tables.sql`) has not been applied to production.

---

## 11. Documentation Index

All docs live in the `docs/` folder of this repository. See `docs/README.md` for the full structure and quick links.

### Architecture

| Document | Description |
|---|---|
| `docs/architecture/codebase-overview.md` | High-level codebase orientation |
| `docs/architecture/data-layer-architecture.md` | Overall data layer design and patterns |
| `docs/architecture/backend-schema-mapping.md` | Backend data structure and field mapping |
| `docs/architecture/server-vs-client-components.md` | Strategy for Next.js server vs client components |
| `docs/architecture/clinic-scoring-architecture.md` | Clinic scoring system design |
| `docs/architecture/clinic-scoring-schema.md` | Scoring schema reference |
| `docs/architecture/clinic-sorting.md` | Clinic sorting and ranking logic |
| `docs/architecture/metric-normalisation-reference.md` | Metric normalisation reference |

### Features

| Document | Description |
|---|---|
| `docs/features/instagram/README.md` | Instagram integration overview |
| `docs/features/instagram/data-mapping.md` | Backend to frontend view model mapping |
| `docs/features/instagram/implementation-gaps.md` | Known gaps in the Instagram feature |
| `docs/features/instagram/section-data-support.md` | Which data fields are supported per UI section |
| `docs/features/instagram/instagram-signals-implementation.md` | Instagram signals implementation notes |
| `docs/features/user-profile/README.md` | User profile / Treatment Passport spec |
| `docs/features/user-profile/architecture.md` | User profile technical architecture |
| `docs/features/user-profile/testing.md` | User profile testing documentation |
| `docs/features/bookmarks-and-consultations.md` | Bookmarks and consultations feature |
| `docs/features/clinic-comparison.md` | Clinic comparison feature |
| `docs/features/consultation-intent-plan.md` | Consultation intent detection plan |
| `docs/features/copilot-kit-QUICKSTART.md` | Quick start guide for Leila's three Generative UI patterns |

### Plans & Roadmaps

**Forums (HRN & Reddit)**

| Document | Description |
|---|---|
| `docs/plans/forums/forum-scraping-schema.md` | Forum scraping database schema |
| `docs/plans/forums/hrn/hrn-forum-scraping-mvp-plan.md` | HRN forum scraping MVP plan |
| `docs/plans/forums/hrn/hrn-scraper-progress.md` | HRN scraper progress tracking |
| `docs/plans/forums/hrn/hrn-frontend-plan.md` | HRN signals frontend plan |
| `docs/plans/forums/hrn/hrn-implementation.md` | HRN implementation notes |
| `docs/plans/forums/hrn/hrn-score-plan.md` | HRN scoring plan |
| `docs/plans/forums/reddit/reddit-post-scraper.md` | Reddit post scraper plan |
| `docs/plans/forums/reddit/reddit-comments-plan.md` | Reddit comments scraping plan |
| `docs/plans/forums/reddit/reddit-score-plan.md` | Reddit scoring plan |
| `docs/plans/forums/reddit/reddit-ui-hrn-parity.md` | Reddit UI / HRN parity plan |
| `docs/plans/forums/reddit/reddit migration plan.md` | Reddit data migration strategy |
| `docs/plans/forums/reddit/comment-sentiment-toward-clinic.md` | Comment sentiment analysis plan |

**UI**

| Document | Description |
|---|---|
| `docs/plans/ui/filters.md` | Filtering feature plan and label rename work |
| `docs/plans/ui/clinic-card-filter-ui-cleanup.md` | Clinic card and filter UI cleanup |
| `docs/plans/ui/clinic-profile-header-revamp.md` | Clinic profile header revamp |
| `docs/plans/ui/google-reviews-ui-revamp.md` | Google reviews UI revamp |
| `docs/plans/ui/leila-chat-ui-overhaul.md` | Leila chat UI overhaul |

**Testing**

| Document | Description |
|---|---|
| `docs/plans/testing/e2e-testing-implementation.md` | End-to-end testing strategy |
| `docs/plans/testing/test-coverage.md` | Test coverage goals and metrics |

**Infrastructure**

| Document | Description |
|---|---|
| `docs/plans/infrastructure/GithubActionCI_CDSetUp.md` | CI/CD pipeline setup plan |

**Other**

| Document | Description |
|---|---|
| `docs/plans/consultation-cancellation-plan.md` | Consultation cancellation plan |
| `docs/plans/data-integrity-refactor.md` | Data integrity refactor notes |

### Data Sources

| Document | Description |
|---|---|
| `docs/data-sources/README.md` | Overview of all external data integrations |
| `docs/data-sources/google-places-data-mapping.md` | Google Places field mapping to clinic schema |
| `docs/data-sources/instagram-pipeline-README.md` | Instagram data extraction pipeline |

### Schemas

| Document | Description |
|---|---|
| `docs/schemas/database-overview.md` | Database overview |
| `docs/schemas/patient-profile-architecture.md` | Patient profile database schema |
| `docs/schemas/api_schema_docs.md` | API schema specifications |
| `docs/schemas/migration-20260214-schema-enhancements.md` | Feb 2026 schema enhancement migration |

### Session Notes

| Document | Description |
|---|---|
| `docs/sessions/session-summary-2026-02-27.md` | Meeting notes, February 27, 2026 |
| `docs/sessions/session-summary-2026-02-28.md` | Meeting notes, February 28, 2026 |

### Specs

| Document | Description |
|---|---|
| `docs/specs/consultation-cart-spec.md` | Consultation cart technical specification |

### Reviews

| Document | Description |
|---|---|
| `docs/reviews/langchain.md` | Notes on LangChain integration review |

### Root-Level Docs

| Document | Description |
|---|---|
| `README.md` | Project overview and setup |
| `TESTING_PHASE1.md` | Step-by-step OAuth login testing guide |

---

## 12. Task Tracker

The team used a project management tool (similar to Jira) to track sprint tasks, bugs, and user stories.

**Jira Board:** [https://uxly115b.atlassian.net/jira/software/projects/SCRUM/boards/1](https://uxly115b.atlassian.net/jira/software/projects/SCRUM/boards/1)

> **Jira Board URL:** _[https://uxly115b.atlassian.net/jira/software/projects/SCRUM/boards/1]_
**Action required for the incoming team:** Request board access for [ondogulu@ucsc.edu](mailto:ondogulu@ucsc.edu) so the project advisor has visibility going forward.

> **Note:** The GitHub Issues list is **not** the source of truth for task status — it was not kept up to date during development. Use the Jira board to understand what was planned, in progress, and completed.
>
> Be aware that **per-sprint documentation was only written up for Sprint 1** (`docs/sprints/`). Later sprints (Sprint 4 onward) were not individually documented as sprint reports — the **Release 2 Plan in §13 below** is the consolidated record of what was planned across those later sprints.

---

## 13. Release 2 Plan

This is the consolidated plan for **Release 2**, covering the later sprints (Sprint 4 onward) that were not individually written up as sprint reports. It is the best record of what the outgoing team planned and worked toward in the back half of the project.

### Team

| Role | Member |
|---|---|
| Scrum Master | Bhagavan |
| Product Owner | Matthew |
| Team | Mason, Naomi, Mukesh, Arhan |

### High-Level Goals

- Clinic discovery and search
- Structured clinic profiles
- Side-by-side clinic comparison
- Evidence-backed explanations
- AI-assisted guidance (Leila)
- Free consultation request flow
- Internal observability and auditability

**Target end-to-end user flow:** land on platform → browse or search clinics → view clinic profiles → compare clinics side-by-side → request a price estimate / package details / free consultation → submit consultation request → receive confirmation and next-steps explanation.

### Release-Level Themes

- **User Profile Page** — finish the incomplete onboarding/profile flow.
- **Consultation Page** — set up the page and wire the consultation request through to Istanbul Medic.
- **Clinic Comparisons** — decide what is being compared and how that data is structured in the database ahead of time.
- **Scoring** — basic scoring first, then expand (a later "spike sprint" was earmarked for the rest).
- **More data collection** — TikTok, clinic websites, other public registries, Quora, YouTube, Twitter.
- **AI Agent (Leila)** — CopilotKit-based summaries, comparisons, rich UI components; save conversations (lower priority); leave reviews directly on the site (lower priority).

### Sprint Breakdown

**Sprint 4 — Data collection (weeks 1–2).** The priority was sourcing as much data as possible (scraper → endpoint → frontend), knowing the target signals ahead of time. Per-person ownership:
- Reddit — Bhagavan
- Clinic-owned sources (package/pricing, doctors, team members from clinic websites) — Mason
- Doctor information (unified doctor profiles pulled from multiple sources) — Mukesh
- Hair Restoration Network (HRN) forum signals — Matthew
- Public registry / TikTok — Arhan
- Quora — Bhagavan
- YouTube, Twitter — lower priority
- Continue user profile / consultation page plan, data privacy — Naomi

**Sprint 5 — Finish data, start making it useful (weeks 3–4).** Guiding principle: *get the data done as early as possible* so there's enough time left to actually use it — a shallow data layer would undermine the whole product. Work:
- Scoring — Matthew / Mason
- Comparison page design (what and how to compare) — Naomi
- Continue user profile page — Naomi
- Finalize scraping schedules and add signals to the frontend: Reddit (Bhagavan), HRN (Matthew), doctor data (Mukesh), clinic/doctor data (Mason), public registry (Arhan)
- *Backlog:* consultation page, frontend polish for new data/signals, clinic profile page, search/filter (lower priority), AI summarizing with evidence (lower priority)

**Sprint 6 — Scoring, comparison, consultation (weeks 5–6).**
- Continue scoring — Mason / Matthew
- Comparison page — Naomi / Arhan
- Finish consultation/appointment page and connect to Istanbul Medic
- Reddit: UI update (Scott), merge scraping-schedule PR, add basic score to UI, implement comment scraping — Bhagavan
- Leila: guardrails, CopilotKit — Mukesh
- Doctor info — Mukesh
- *Backlog:* AI summarizing with evidence, AI agent comparisons with evidence, Reddit comments, personalized recommendations in the user dashboard

**Sprint 7 — Comparison, source pages, fine-tuning (weeks 7–8).**
- Comparison page — Naomi / Arhan
- Source pages (e.g. Google Places)
- Leila fine-tuning (review progress with Scott; he may give feedback or take it on directly)
- Extensive UI cleanup across homepage, filter page, clinic card, profile page, Instagram/Reddit/Google-reviews sections, score sections, tab behavior, and consultation flow (with confirmation email). Owners spread across Matthew, Bhagavan, Mason.

**Week 9 — Polish, cleanup, documentation.**
- Leila UI — Matthew
- Codebase cleanup: remove legacy code/unused folders (Matthew), docs reorganization (Bhagavan), lint warnings (Arhan)
- Google reviews UI changes, score UI on clinic profile, scores in header — Bhagavan
- Overview section redesign — Mason
- Score placement and a "how scores are calculated" page — Matthew
- Documentation structure and next steps (per Scott's preferred structure)
- Database audit and scalability review, RLS (Arhan), migration parity check between production and local development (Mukesh)
- Scraping cron jobs: Google (Mason), Instagram (Naomi)

> *Note from the plan: priorities were expected to shift after the Saturday demo.*

### Release 2 Backlog

Items planned but not guaranteed within the release:

- Let users leave reviews on the site
- Add a picture check to the Reddit pipeline, then unhide those UI sections
- Add doctors to the comparison page
- Richer AI agent (Leila) UI components
- TikTok and Quora scraping
- Personalized recommendations based on user profiles
- Full consultation loop — internal UI for Istanbul Medic team members to manage consultations and update status, eventually connecting directly to clinics (a more scalable solution may be needed)
- Get pricing directly from clinics

---

## 14. Suggested Next Steps

These are ideas the outgoing team surfaced as promising directions for the next team. They are suggestions, not committed work — prioritize against the Jira board and the known gaps in §10.

### Data & Pipelines

- **Scrape TikTok & Quora** — extend the social/forum data sources beyond Instagram and Reddit to enrich clinic profiles with additional patient-reported signals.
- **Add a picture check to the Reddit pipeline** — detect whether scraped Reddit posts include images, then unhide the corresponding UI sections that are currently hidden when no image data is available.

### Leila (AI Assistant)

Leila is functional today but still early. The most valuable next steps fall into four areas:

- **Provide Leila with more information** — Leila can only be as helpful as the data she can reach. Today she is largely limited to the clinic-level data in the database. Expanding what she has access to (richer clinic detail, doctor/qualification data once it exists, treatment-package specifics, patient-reported signals from the forum/social pipelines) would meaningfully improve the quality and specificity of her answers.

- **Better UI work** — the Static Generative UI components Leila renders (in `components/langchain/LangchainGenUI.tsx`) are functional but basic. There is room to design richer, more polished components and interface — better-formatted clinic and doctor cards, clearer comparison tables, and more visually informative responses — so that Leila's output feels less like raw tool results and more like a guided experience.

- **Better reasoning capabilities** — Leila currently runs on `gpt-4o-mini` via CopilotKit + LangChain. Her reasoning and tool-selection can be improved: better prompting, smarter routing between her available tools, and potentially a stronger model for harder queries. The goal is for Leila to reason more reliably about which clinic/doctor best fits a patient's needs rather than just retrieving data.

- **Past-conversation feature** — Leila currently starts fresh every session with no memory of prior interactions. Building persistent conversation history (so Leila can remember a returning user's treatment needs, prior questions, and shortlisted clinics) was a key piece of intended work that was not completed. This is foundational for the assistant feeling continuous and personalized rather than stateless.

### User-Facing Features

- **User reviews** — allow users to leave reviews of clinics directly on the platform (rather than only surfacing reviews scraped from external sources).
- **User feedback** — add a way for users to submit feedback about the site itself.
- **Compare 3+ clinics** — extend the comparison page to support comparing more than two clinics at once.
- **Add doctors to the comparison page** — surface individual doctor information in the clinic comparison view. A `doctor_profile` tool already exists in Leila's Static Generative UI, so the UI scaffolding is partly in place — but the real blocker here is **data, not UI**. We do not currently have a complete picture of which doctors work at each clinic, and for the doctors we do know about we are usually missing their **qualifications** (specialties, credentials, board certifications, years of experience). Before this feature is meaningful, the next team needs a reliable way to source doctor rosters and qualifications per clinic. Note that the existing data scrapers were **built manually rather than via Apify** — doctor/qualification data was not available through Apify, so any doctor-data ingestion will likely need a similar hand-rolled scraping or manual-entry approach.

### Consultations (larger initiative)

- **Full consultation loop** — implement the end-to-end consultation flow:
  - A UI for Istanbul Medic team members to **manage consultations**.
  - Ability to **update consultation status** for users.
  - Eventually **connect consultations directly to clinics**.
  - **Scalability:** the team flagged that a more scalable architecture may be needed before this grows — worth designing for scale up front rather than retrofitting.

---

*Document maintained in `docs/HANDOFF.md`. Last updated: May 2026.*
