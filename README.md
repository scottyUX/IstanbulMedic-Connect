# IstanbulMedic-Connect

A medical tourism platform connecting patients with clinics in Turkey. Built with Next.js, Supabase, and CopilotKit.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **AI Integration:** CopilotKit
- **Testing:** Vitest + React Testing Library + Playwright
- **Language:** TypeScript

## Prerequisites

- Node.js 18+
- npm
- [Supabase CLI](https://supabase.com/docs/guides/cli) (for local development)
- Docker (required by Supabase CLI)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example env file and configure:

```bash
cp .env.example .env.local
```

Required variables:
```env
# Supabase (local)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key

# OpenAI (for CopilotKit)
OPENAI_API_KEY=your-openai-key
```

### 3. Start Supabase locally

```bash
# Start Supabase services (Postgres, Auth, Storage, etc.)
supabase start

# This will output your local credentials including the anon key
```

After `supabase start`, copy the `anon key` from the output into your `.env.local`.

### 4. Run migrations and seed data

```bash
# Apply database migrations
supabase db reset
```

This runs all migrations in `supabase/migrations/` and seeds the database with test data from `supabase/seed.sql`.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Testing

### Unit & Component Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Run E2E tests (starts dev server automatically)
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run specific browser only
npx playwright test --project=chromium
```

**Prerequisites:** Local Supabase must be running with seeded data (`supabase start && supabase db reset`)

Test files are located in `tests/`:
- `tests/unit/` - Unit tests for utilities and transformers
- `tests/components/` - Component tests
- `tests/e2e/` - End-to-end tests (Playwright)

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit/component tests (watch mode) |
| `npm run test:run` | Run unit/component tests once |
| `npm run test:e2e` | Run E2E tests with Playwright |
| `npm run test:e2e:ui` | Run E2E tests with interactive UI |
| `npm run db:types` | Regenerate Supabase TypeScript types |

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── clinics/           # Clinic pages
├── components/
│   ├── clinic-profile/    # Clinic profile components
│   ├── istanbulmedic-connect/  # Main app components
│   ├── landing/           # Landing page sections
│   ├── leila/             # AI assistant components
│   └── ui/                # Shared UI components
├── lib/
│   ├── api/               # Data fetching functions
│   ├── supabase/          # Supabase client setup
│   └── transformers/      # Data transformation utilities
├── supabase/
│   ├── migrations/        # Database migrations
│   └── seed.sql           # Seed data for development
├── tests/                 # Test files
└── docs/                  # Documentation
```

## Database

### Regenerate TypeScript types

After modifying the database schema:

```bash
npm run db:types
```

### Reset database

To reset to a clean state with seed data:

```bash
supabase db reset
```

## Deployment (Vercel + Production Supabase)

### 1. Set Vercel environment variables

In your Vercel project settings → Environment Variables, add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
OPENAI_API_KEY=your-openai-key
```

Get these from your Supabase dashboard: Project Settings → API

### 2. Apply migrations to production database

Link your local CLI to the production project and push migrations:

```bash
# Link to your production Supabase project
supabase link --project-ref your-project-ref

# Push migrations to production
supabase db push
```

**Note:** Without these steps, the app will deploy but show "No clinics found" (empty database) or error if tables don't exist.

## Documentation

See the `docs/` folder for detailed documentation:
- `docs/data-layer-architecture.md` - Data fetching patterns
- `docs/data-integrity-refactor.md` - Data display guidelines
- `docs/backend-schema-mapping.md` - Database schema details
## Learn More

- [CopilotKit Documentation](https://docs.copilotkit.ai)
- [Generative UI Article](https://dev.to/copilotkit/the-developers-guide-to-generative-ui-in-2026-1bh3)
- [AG-UI Protocol](https://docs.copilotkit.ai)
- [A2UI Specification](https://ai.google.dev/a2ui)

## Next Steps

- Configure MCP Apps middleware for open-ended Generative UI
- Add more example components for Static Generative UI
- Experiment with different A2UI templates
- Customize the A2UI theme

# Supabase
## Getting Set Up for local development

### Prerequisites

- updated npm
- a container runtime compatible with Docker APIs (Docker Desktop)

### Installation & Set UP
- follow this guide: https://supabase.com/docs/guides/local-development?queryGroups=package-manager&package-manager=npm
- update .env with (from running supabase start or supabase status)
  - SUPABASE_URL=http://...(project url under APIs)
  - SUPABASE_ANON_KEY=sb_publishable_...
  - SUPABASE_SERVICE_ROLE_KEY=sb_secret_....
  - DATABASE_URL=postgresql://postgres:postgres@...
- Login to supabase using - supabase login
- apply migrations(basis for schemas) and seed.sql(mock data) - supabase db reset



