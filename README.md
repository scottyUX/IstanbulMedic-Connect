# IstanbulMedic-Connect

A medical tourism platform connecting patients with clinics in Turkey. Built with Next.js, Supabase, and CopilotKit.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS 4
- **AI Integration:** CopilotKit
- **Testing:** Vitest + React Testing Library
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

```bash
# Run tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage (requires @vitest/coverage-v8)
npm run test:coverage
```

Test files are located in `tests/`:
- `tests/unit/` - Unit tests for utilities and transformers
- `tests/components/` - Component tests

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests (watch mode) |
| `npm run test:run` | Run tests once |
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

## Documentation

See the `docs/` folder for detailed documentation:
- `docs/data-layer-architecture.md` - Data fetching patterns
- `docs/data-integrity-refactor.md` - Data display guidelines
- `docs/backend-schema-mapping.md` - Database schema details
