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

---

## 1. Project Overview

**IstanbulMedic-Connect** is a medical tourism platform that connects international patients with healthcare providers in Istanbul, Turkey. It functions as an intelligent marketplace where patients can discover, filter, and compare clinics and get guided through the process by an AI assistant named **Leila**.

**The problem it solves:** International patients researching medical care in Istanbul face a fragmented, trust-deficient information landscape. This platform centralizes clinic discovery, surfaces transparency signals, and wraps the experience in a conversational AI guide.

**Core user flow:**

1. Patient lands on the platform and signs in with Google
2. They interact with **Leila** — an AI assistant that asks about their treatment needs and guides them to relevant clinics
3. They browse, filter, and compare clinics using the discovery interface
4. They view clinic profiles including treatment offers, packages, ratings, and trust scores

---

## 2. What Was Built

| Feature | Notes |
|---|---|
| Google OAuth login (Supabase) | See `TESTING_PHASE1.md` |
| Landing page | |
| Clinic discovery & browse | |
| Clinic detail profiles | |
| AI assistant — Leila (CopilotKit) | Generative UI, three patterns |
| Clinic filtering by treatment category | |
| Instagram embeds | See `docs/features/instagram/` |
| Google Maps integration | |
| Unit & component tests | Vitest + React Testing Library |

---

## 3. How to Expand to More Clinics

The platform was designed with clinic growth in mind. Data pipelines are in place that make adding new clinics relatively straightforward — you do not need to manually author records from scratch.

### Data Sources

Clinic data flows in from two external sources:

**Google Places API** — Provides core clinic metadata including name, address, phone, website, rating, and review count. The field mapping from Google Places to the internal clinic schema is documented in `docs/data-sources/google-places-data-mapping.md`.

**Instagram (via Apify scraper)** — Provides social signals such as follower count, post engagement, and media content. The pipeline is documented in `docs/data-sources/instagram-pipeline-README.md` and `docs/features/instagram/`.

### Adding a New Clinic

1. **Locate the clinic on Google Places** and obtain its Place ID.
2. **Run the Google Places ingestion pipeline** to pull clinic data into the database. The data mapping guide in `docs/data-sources/google-places-data-mapping.md` describes how each field maps to the clinic schema.
3. **Run the Instagram scraper** (Apify) for the clinic's Instagram handle if available. See `docs/data-sources/instagram-pipeline-README.md` for setup.
4. **Apply any missing fields manually** via the Supabase dashboard or a SQL migration — for example, treatment categories, package details, or verification status that cannot be inferred from external sources.
5. **Verify the clinic appears correctly** in the discovery interface and on its detail profile page.

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
| OpenAI API | LLM backbone for Leila |
| Anthropic SDK | Claude integration |

Three UI patterns are implemented in Leila:

**Static Generative UI** — predefined components rendered by AI  
**Declarative Generative UI (A2UI)** — dynamic JSON specs drive UI  
**Open-ended Generative UI (MCP Apps)** — fully open-ended agent output

### Backend & Data

| Tool | Purpose |
|---|---|
| Supabase (PostgreSQL) | Database and auth |
| Google OAuth | User authentication (via Supabase) |
| Google Places API | Clinic location data |

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
├── docs/                         # ← You are here
│   ├── architecture/             # System design decisions
│   ├── data-sources/             # External API integration notes
│   ├── features/                 # Feature specs (Instagram, user profile)
│   ├── plans/                    # Development plans and roadmaps
│   ├── reviews/                  # Code review notes
│   ├── schemas/                  # Database schema docs
│   ├── sessions/                 # Meeting notes
│   └── sprints/                  # Sprint documentation
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
├── QUICKSTART.md                 # Quick start for Leila's three UI patterns
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
Supabase OAuth endpoint
        ↓
Google authenticates user
        ↓
Redirect to /auth/callback
        ↓
Session stored → redirect to /leila
        ↓
middleware.ts validates session on every subsequent request
```

### Critical Configuration

| Setting | Value |
|---|---|
| Google Cloud redirect URI | `http://localhost:3000/auth/callback` (exact match required) |
| Supabase callback URL | Same — set under Authentication > URL Configuration |
| Default post-login redirect | `/leila` (set in `app/auth/callback/route.ts`) |

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

**Schema documentation:** `docs/schemas/patient-profile-architecture.md`

When adding new migrations, name them with a timestamp prefix matching the existing convention (e.g., `20260214_schema_enhancement.sql`).

---

## 9. Testing

### Unit & Component Tests (Vitest)

```bash
npm run test:run        # run once
npm test               # watch mode
npm run test:coverage  # with coverage report
```

Tests live in `tests/unit/` and `tests/components/`.

### End-to-End Tests (Playwright)

```bash
npm run test:e2e
```

Tests live in `tests/e2e/`. See `docs/plans/e2e-testing-implementation.md` for the full strategy.

### Testing Phases

| Phase | Status | Coverage |
|---|---|---|
| Phase 1 | ✅ Complete | Google OAuth login — see `TESTING_PHASE1.md` |
| Phase 2 | 📋 Planned | Database user data integration |
| Phase 3 | 📋 Planned | CopilotKit / Leila agent integration |

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

All docs live in the `docs/` folder of this repository.

### Architecture

| Document | Description |
|---|---|
| `docs/architecture/data-layer-architecture.md` | Overall data layer design and patterns |
| `docs/architecture/server-vs-client-components.md` | Strategy for Next.js server vs client components |
| `docs/architecture/backend-schema-mapping.md` | Backend data structure and field mapping |
| `docs/architecture/clinic-sorting.md` | Clinic sorting and ranking logic |

### Features

| Document | Description |
|---|---|
| `docs/features/instagram/README.md` | Instagram integration overview |
| `docs/features/instagram/data-mapping.md` | Backend to frontend view model mapping |
| `docs/features/instagram/implementation-gaps.md` | Known gaps in the Instagram feature |
| `docs/features/instagram/section-data-support.md` | Which data fields are supported per UI section |
| `docs/features/user-profile/README.md` | User profile / Treatment Passport spec |
| `docs/features/user-profile/architecture.md` | User profile technical architecture |
| `docs/features/user-profile/testing.md` | User profile testing documentation |

### Plans & Roadmaps

| Document | Description |
|---|---|
| `docs/plans/filters.md` | Filtering feature plan and label rename work |
| `docs/plans/e2e-testing-implementation.md` | End-to-end testing strategy |
| `docs/plans/test-coverage.md` | Test coverage goals and metrics |
| `docs/plans/GithubActionCI_CDSetUp.md` | CI/CD pipeline setup plan |
| `docs/plans/reddit-post-scraper.md` | Reddit scraper development plan |
| `docs/plans/forums/hrn-forum-scraping-mvp-plan.md` | HRN forum scraping MVP plan |
| `docs/plans/forums/hrn-scraper-progress.md` | HRN scraper progress tracking |
| `docs/plans/forums/forum-scraping-schema.md` | Forum scraping database schema |
| `docs/plans/forums/reddit-migration-plan.md` | Reddit data migration strategy |

### Sprints

| Document | Description |
|---|---|
| `docs/sprints/sprint1-backend/api_schema_docs.md` | Sprint 1 API schema specifications |
| `docs/sprints/sprint1-backend/insta_endpoint_testing.md` | Sprint 1 Instagram endpoint testing |
| `docs/sprints/sprint1-frontend/README.md` | Sprint 1 frontend overview |
| `docs/sprints/sprint1-frontend/backend-frontend-integration-split.md` | Backend/frontend integration split |
| `docs/sprints/sprint1-frontend/data-integrity-refactor.md` | Data integrity refactoring notes |
| `docs/sprints/sprint1-frontend/migration-20260214-schema-enhancements.md` | Feb 2026 schema enhancement migration |
| `docs/sprints/sprint1-frontend/next-steps-integration.md` | Integration next steps |

### Session Notes

| Document | Description |
|---|---|
| `docs/sessions/session-summary-2026-02-27.md` | Meeting notes, February 27, 2026 |
| `docs/sessions/session-summary-2026-02-28.md` | Meeting notes, February 28, 2026 |

### Data Sources

| Document | Description |
|---|---|
| `docs/data-sources/README.md` | Overview of all external data integrations |
| `docs/data-sources/google-places-data-mapping.md` | Google Places field mapping to clinic schema |
| `docs/data-sources/instagram-pipeline-README.md` | Instagram data extraction pipeline |

### Schema

| Document | Description |
|---|---|
| `docs/schemas/patient-profile-architecture.md` | Patient profile database schema |

### Reviews

| Document | Description |
|---|---|
| `docs/reviews/langchain.md` | Notes on LangChain integration review |

### Root-Level Docs

| Document | Description |
|---|---|
| `README.md` | Project overview and setup |
| `QUICKSTART.md` | Quick start for Leila's three Generative UI patterns |
| `TESTING_PHASE1.md` | Step-by-step OAuth login testing guide |

---

## 12. Task Tracker

The team used a project management tool (similar to Jira) to track sprint tasks, bugs, and user stories.

**Action required for the incoming team:** Add the Jira board URL below, and request access for [ondogulu@ucsc.edu](mailto:ondogulu@ucsc.edu) so the project advisor has visibility going forward.

> **Jira Board URL:** _[add link here]_

> **Note:** The GitHub Issues list is **not** the source of truth for task status — it was not kept up to date during development. Use the task board and the sprint docs in `docs/sprints/` to understand what was planned, in progress, and completed.

---

*Document maintained in `docs/HANDOFF.md`. Last updated: May 2026.*
