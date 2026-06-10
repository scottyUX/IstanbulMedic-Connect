# Codebase Overview

**Stack:** Next.js 14 App Router · Supabase (PostgreSQL) · TypeScript · LangChain · CopilotKit  
**What it is:** A medical tourism platform helping patients research and connect with hair transplant clinics in Istanbul. Combines a clinic discovery/comparison product with an AI chat assistant (Leila), backed by several data pipelines.

---

## Directory Tree

```
IstanbulMedic-Connect/
│
├── app/                          ← Next.js App Router (pages + API routes)
│   ├── page.tsx                  ← Landing page
│   ├── layout.tsx                ← Root layout (auth context, fonts, nav)
│   ├── globals.css
│   │
│   ├── clinics/                  ← Clinic discovery
│   │   ├── page.tsx              ← /clinics — listing page (server component)
│   │   ├── [clinicId]/           ← /clinics/:id — individual clinic profile
│   │   └── compare/              ← /clinics/compare — side-by-side comparison
│   │
│   ├── bookmarks/page.tsx        ← /bookmarks — saved clinics
│   ├── profile/                  ← /profile — user onboarding + dashboard
│   │   ├── page.tsx
│   │   └── get-started/          ← Multi-step onboarding wizard
│   │
│   ├── langchain/page.tsx        ← /langchain — ACTIVE AI chat (Leila)
│   ├── leila/page.tsx            ← /leila — LEGACY AI chat (do not develop)
│   ├── methodology/page.tsx      ← /methodology — scoring explainer
│   ├── auth/                     ← Supabase auth callback + login
│   ├── design-system/page.tsx    ← Internal design reference page
│   └── ui-showcase/page.tsx      ← Internal UI showcase page
│
│   └── api/                      ← API routes
│       ├── clinics/route.ts          ← GET /api/clinics (listing + filters)
│       ├── clinics/[id]/registry/    ← Registry records per clinic
│       ├── bookmarks/                ← Bookmark CRUD + guest bookmarks
│       ├── consultations/            ← Consultation CRUD
│       ├── profile/                  ← User profile endpoints (qualification, treatment, photos)
│       ├── user/route.ts             ← User creation on first sign-in
│       ├── cal-com/booking/          ← Cal.com consultation booking webhook
│       │
│       ├── langchain-agent/route.ts  ← ACTIVE: LangChain agent endpoint
│       ├── langchain-tools/route.ts  ← ACTIVE: CopilotKit GenUI tool definitions
│       ├── copilotkit-langchain/     ← ACTIVE: CopilotKit runtime for /langchain
│       │
│       ├── copilotkit-leila/         ← LEGACY: old CopilotKit runtime for /leila
│       ├── copilotkit-a2ui/          ← LEGACY: A2UI experiment
│       ├── copilotkit/               ← LEGACY: GPT-4o weather/calculator demo
│       │
│       ├── hrnPipeline/              ← HRN forum scraper pipeline
│       ├── forumPipeline/            ← Forum thread processing (deterministic + LLM)
│       ├── redditPipeline/           ← Reddit data pipeline
│       ├── instagramPipeline/        ← Instagram data pipeline
│       ├── import/                   ← One-off import routes (google-places, instagram)
│       └── search-knowledge-base/    ← Vector search endpoint for AI chat
│
├── components/
│   ├── istanbulmedic-connect/    ← Main product UI (THE core components)
│   │   ├── ExploreClinicsPage.tsx     ← Clinic listing + filters
│   │   ├── ClinicCard.tsx             ← Card in listing
│   │   ├── UnifiedFilterBar.tsx       ← Filter bar
│   │   ├── FilterDialog.tsx
│   │   ├── BookmarkButton.tsx
│   │   ├── ConsultationConfirmModal.tsx
│   │   ├── SignInPromptModal.tsx
│   │   ├── TopNav.tsx
│   │   ├── profile/                   ← Clinic profile page sections
│   │   │   ├── ClinicProfilePage.tsx  ← Shell + section orchestration
│   │   │   ├── HeroSection.tsx
│   │   │   ├── OverviewSection.tsx
│   │   │   ├── DoctorsSection.tsx + DoctorCard.tsx
│   │   │   ├── PackagesSection.tsx + PricingSection.tsx
│   │   │   ├── ReviewsSection.tsx
│   │   │   ├── CommunitySignalsSection.tsx
│   │   │   │   ├── HRNSignalsCard.tsx
│   │   │   │   ├── RedditSignalsCard.tsx
│   │   │   │   └── InstagramSignalsCard.tsx
│   │   │   ├── AIInsightsSection.tsx
│   │   │   ├── RegistrySection.tsx + TransparencySection.tsx
│   │   │   ├── ScoreBreakdownCard.tsx + SummarySidebar.tsx
│   │   │   ├── LocationInfoSection.tsx
│   │   │   └── SectionNav.tsx
│   │   ├── comparison/                ← /clinics/compare views
│   │   │   ├── CompareClinicPage.tsx
│   │   │   ├── AllSourcesView.tsx
│   │   │   ├── GooglePlacesView.tsx + HRNView.tsx + RedditView.tsx + InstagramView.tsx
│   │   │   └── useClinicCompareSignals.ts
│   │   └── user-profile/              ← /profile dashboard
│   │       ├── ProfileDashboard.tsx
│   │       ├── GetStarted.tsx
│   │       └── sections/
│   │           ├── ProfileHome.tsx + ProfilePersonalInfo.tsx
│   │           ├── ProfileHairLossStatus.tsx + ProfileMedicalHistory.tsx
│   │           └── ProfileConsultations.tsx
│   │
│   ├── langchain/                ← ACTIVE AI chat UI
│   │   ├── LangchainChat.tsx     ← Main chat shell
│   │   ├── LangchainGenUI.tsx    ← GenUI tool renderers (clinic cards, etc.)
│   │   ├── LangchainInput.tsx    ← Input bar
│   │   ├── MessageBubble.tsx
│   │   └── TypingIndicator.tsx
│   │
│   ├── leila/                    ← LEGACY — do not develop (see _LEGACY.md)
│   │
│   ├── landing/                  ← Homepage sections
│   │   ├── HeroBanner.tsx + HeroBanner.tsx.bak (stale backup)
│   │   ├── HowItWorksSection.tsx + StepsSection.tsx
│   │   ├── FAQSection.tsx + StatsSection.tsx
│   │   └── ... (more landing page sections)
│   │
│   ├── common/                   ← Header, Footer, Logo, LanguageSelector
│   ├── clinic/                   ← GoogleMaps.tsx (map embed)
│   ├── icons/                    ← SVG icon components
│   ├── ui/                       ← shadcn/ui primitives + custom design tokens
│   ├── templates/HomeTemplate.tsx
│   │
│   └── [root-level demo files]   ← ⚠️ LIKELY UNUSED (see Dead Code section)
│       ├── A2UIPage.tsx, GeminiChatWrapper.tsx, GeminiInput.tsx
│       ├── Calculator.tsx, NotePad.tsx, TodoList.tsx
│       ├── WeatherCard.tsx, WeatherLoadingState.tsx
│       ├── StaticGenUI.tsx, DeclarativeGenUI.tsx, MCPAppsGenUI.tsx
│
├── lib/                          ← Business logic (imported by app/ and scripts/)
│   ├── agents/langchain/         ← LangChain agent
│   │   ├── agent.ts              ← Agent definition + tool wiring
│   │   ├── adapter.ts            ← CopilotKit ↔ LangChain bridge
│   │   ├── guardrails.ts + guardrails/  ← Input validation
│   │   ├── prompts/leila-system-prompt.ts
│   │   └── tools/                ← Individual LangChain tools
│   │       ├── clinicSummary.ts, clinicComparison.ts
│   │       ├── clinicPackages.ts, clinicReviews.ts
│   │       ├── doctorProfile.ts, databaseLookup.ts
│   │       └── _shared.ts
│   │
│   ├── api/                      ← Data access (read from Supabase)
│   │   ├── clinics.ts            ← Main clinic queries
│   │   ├── hrn.ts + hrn.mock.ts  ← HRN forum data
│   │   ├── reddit.ts, instagram.ts
│   │   ├── clinicRatings.ts, forumSignals.ts
│   │   ├── registry.ts
│   │   └── userProfile.ts
│   │
│   ├── scoring/                  ← Scoring pipeline
│   │   ├── scoreClinic.ts        ← Entry point: score one clinic
│   │   ├── overall.ts            ← Roll up to final score
│   │   ├── pillars/              ← reputation.ts, evidenceTransparency.ts
│   │   ├── sources/              ← google.ts, instagram.ts (raw source scores)
│   │   ├── metrics/              ← credentials.ts, google.ts, instagram.ts, reddit.ts, registry.ts
│   │   └── forum.ts, hrn.ts      ← Forum-specific scoring logic
│   │
│   ├── supabase/                 ← DB clients
│   │   ├── client.ts             ← Browser client
│   │   ├── server.ts             ← Server client (SSR)
│   │   ├── middleware.ts         ← Auth session refresh
│   │   └── database.types.ts     ← Generated types (npm run db:types)
│   │
│   ├── services/googlePlacesService.ts
│   ├── instagram/importInstagramData.ts
│   ├── email/sendConsultationRequest.ts
│   ├── transformers/clinic.ts    ← DB row → frontend type
│   ├── filterConfig.ts           ← Filter definitions
│   ├── a2ui/viewer-theme.ts      ← ⚠️ only used by legacy /leila
│   └── utils.ts, constants.ts, social-icons.tsx, etc.
│
├── types/                        ← Shared TypeScript types
│   ├── clinic.ts                 ← ClinicWithScore, ClinicProfile, etc.
│   ├── user.ts + patient-profile.ts
│   └── langchain.ts              ← Chat message types
│
├── contexts/                     ← React contexts
│   ├── AuthContext.tsx           ← Supabase session
│   ├── BookmarkCountContext.tsx  ← Bookmark count for nav badge
│   └── LanguageContext.tsx       ← i18n (Turkish/English)
│
├── scripts/                      ← One-off admin scripts (run with tsx)
│   ├── forum-attribute-threads.ts     ← Attribute scraped threads to clinics
│   ├── forum-recompute-profiles.ts    ← Recompute clinic_forum_profiles
│   ├── reddit-scrape-subreddits.ts    ← Reddit scraping
│   ├── scoreProduction.ts             ← Re-score all clinics in prod
│   ├── ingest-registry/               ← MOH PDF → registry records
│   ├── reseed-instagram-facts.ts
│   ├── seed-clinics.ts + seedLocalClinics.ts + seedLocalDb.ts
│   └── [debug/test scripts]           ← debugStructure.ts, distCheck.ts, testScoring.ts, etc.
│
├── scraper/                      ← Python package: doctor registry scraper
│   ├── run.py                    ← Entry point
│   ├── sources/                  ← ishrs.py, iahrs.py, tprecd.py (3 medical registries)
│   ├── matcher.py                ← Fuzzy-match scraped doctors to clinic_team rows
│   ├── merger.py + normalize.py + persistence.py
│   └── tests/                   ← pytest suite with fixtures
│
├── supabase/
│   ├── migrations/               ← 26 SQL migration files (Feb → May 2026)
│   └── config.toml
│
├── tests/                        ← Vitest test suite
│   ├── unit/                     ← Scoring, API routes, HRN
│   ├── components/               ← Component render tests
│   ├── api/                      ← API route tests
│   ├── agents/langchain/         ← Agent + guardrails tests
│   ├── integration/              ← CopilotKit runtime integration tests
│   └── e2e/                      ← Playwright E2E specs
│
├── middleware.ts                 ← Supabase auth session middleware
├── next.config.ts
└── package.json
```

---

## The 6 Major Subsystems

### 1. Clinic Discovery Product
**Files:** `app/clinics/`, `components/istanbulmedic-connect/`

The core user-facing product. `ExploreClinicsPage` renders the filterable listing; `ClinicProfilePage` orchestrates the ~12 profile sections. All data flows through `lib/api/clinics.ts` → Supabase, shaped by `lib/transformers/clinic.ts`. The comparison tool at `/clinics/compare` lives in `components/istanbulmedic-connect/comparison/`.

### 2. AI Chat — Leila
**Files:** `app/langchain/`, `components/langchain/`, `lib/agents/langchain/`, `app/api/copilotkit-langchain/`, `app/api/langchain-agent/`, `app/api/langchain-tools/`

The active chat implementation. The page hits `app/api/copilotkit-langchain/` for the CopilotKit runtime, which forwards to `app/api/langchain-agent/` where the LangChain agent runs. The agent has 6 tools in `lib/agents/langchain/tools/` that query the DB to answer questions about clinics. GenUI responses (rendered clinic cards, comparison tables) are defined in `LangchainGenUI.tsx`.

### 3. Data Pipelines
**Files:** `app/api/hrnPipeline/`, `app/api/forumPipeline/`, `app/api/redditPipeline/`, `app/api/instagramPipeline/`, `scraper/`

Admin-triggered (not user-facing) ingestion routes. They scrape forum threads (HRN + Reddit), extract signals via deterministic regex and LLM analysis, and write into the forum tables. The Instagram pipeline fetches post data and stores it in `clinic_instagram_posts`. The Python `scraper/` runs separately against ISHRS/IAHRS/TPRECD to populate `clinic_team_qualifications`.

### 4. Scoring
**Files:** `lib/scoring/`, `scripts/scoreProduction.ts`

Pure TS functions — no side effects, no DB writes from within the library itself. `scoreClinic.ts` orchestrates the 3-layer scoring: metrics → pillars → overall. `scripts/scoreProduction.ts` is the admin script that calls this and writes results to the DB.

### 5. User Profile & Consultations
**Files:** `app/profile/`, `components/istanbulmedic-connect/user-profile/`, `app/api/profile/`, `app/api/consultations/`, `app/api/bookmarks/`

User onboarding wizard collects qualification + medical history across several steps. Bookmarks and consultation requests are stored per user. The `cal-com/booking` route handles the Cal.com webhook for scheduled consultations.

### 6. Database
**Files:** `supabase/migrations/`, `lib/supabase/`

Supabase PostgreSQL with 3 client entry points: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (SSR), `lib/supabase/middleware.ts` (session refresh). Type safety from generated `database.types.ts`. See [database-overview.md](schemas/database-overview.md) for the full schema reference.

---

## Legacy & Dead Code

| File(s) | Status | Notes |
|---|---|---|
| `app/leila/`, `components/leila/`, `app/api/copilotkit-leila/` | **Legacy** | Explicitly marked `_LEGACY.md` — old CopilotKit-based chat, superseded by `/langchain` |
| `app/api/copilotkit-a2ui/`, `app/api/copilotkit/`, `lib/a2ui/viewer-theme.ts` | **Legacy** | A2UI/GPT-4o demo experiments, only wired into the legacy `/leila` page |
| `components/A2UIPage.tsx`, `GeminiChatWrapper.tsx`, `GeminiInput.tsx` | **Likely unused** | Prototype components from early experimentation — not imported by any active page |
| `components/Calculator.tsx`, `NotePad.tsx`, `TodoList.tsx`, `WeatherCard.tsx`, `WeatherLoadingState.tsx`, `StaticGenUI.tsx`, `DeclarativeGenUI.tsx`, `MCPAppsGenUI.tsx` | **Likely unused** | CopilotKit demo GenUI components for the old `/api/copilotkit` weather/calculator route |
| `components/landing/HeroBanner.tsx.bak` | **Stale** | `.bak` backup file — safe to delete |
| `hello.txt`, `pr-body.md` | **Stray** | Leftover files at repo root |

> Before deleting anything, run a quick grep to confirm nothing imports them: `grep -r "from.*leila\|from.*A2UIPage\|GeminiChat" app/ components/ --include="*.tsx" --include="*.ts"`
