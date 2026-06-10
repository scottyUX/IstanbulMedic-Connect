# IstanbulMedic-Connect Documentation

## Warning
- Documents may be out of date

## Structure

```
docs/
├── architecture/          # System design, data layer, component decisions
├── comparison/            # Scoring and testing comparisons
├── data-sources/          # External API integrations (Google Places & Instagram)
├── features/              # Per-feature documentation
│   ├── instagram/         # Instagram signals (pipeline, data mapping, API examples)
│   └── user-profile/      # User profile architecture and testing
├── plans/                 # Implementation plans, organized by area
│   ├── forums/            # Forum scraping schema and pipeline
│   │   ├── hrn/           # HRN score, frontend, and implementation plans
│   │   └── reddit/        # Reddit scraping and UI plans
│   ├── infrastructure/    # CI/CD and deployment plans
│   ├── testing/           # E2E and coverage plans
│   └── ui/                # UI revamp and cleanup plans
├── reviews/               # Code and PR reviews
├── schemas/               # Database schemas and data architecture
├── sessions/              # Session summaries
├── specs/                 # Technical specifications
```

## Quick Links

### Architecture
- [Codebase Overview](./architecture/codebase-overview.md)
- [Data Layer Architecture](./architecture/data-layer-architecture.md)
- [Backend Schema Mapping](./architecture/backend-schema-mapping.md)
- [Server vs Client Components](./architecture/server-vs-client-components.md)
- [Clinic Scoring Architecture](./architecture/clinic-scoring-architecture.md)

### Features
- [Instagram Integration](./features/instagram/README.md)
- [User Profile](./features/user-profile/README.md)
- [Bookmarks & Consultations](./features/bookmarks-and-consultations.md)
- [Clinic Comparison](./features/clinic-comparison.md)

### Data Sources
- [Overview](./data-sources/README.md)
- [Google Places Mapping](./data-sources/google-places-data-mapping.md)
- [Instagram Pipeline](./data-sources/instagram-pipeline-README.md)

### Plans
- [Forum Scraping Schema](./plans/forums/forum-scraping-schema.md)
- [HRN Scraper Progress](./plans/forums/hrn/hrn-scraper-progress.md)
- [HRN Frontend Plan](./plans/forums/hrn/hrn-frontend-plan.md)
- [Reddit Score Plan](./plans/forums/reddit/reddit-score-plan.md)
- [E2E Testing](./plans/testing/e2e-testing-implementation.md)
- [Test Coverage](./plans/testing/test-coverage.md)
- [CI/CD Setup](./plans/infrastructure/GithubActionCI_CDSetUp.md)

### Schemas
- [Database Overview](./schemas/database-overview.md)
- [Patient Profile Architecture](./schemas/patient-profile-architecture.md)

### Reviews
- [Reddit Integration PR](./reviews/reddit-integration-pr-review.md)
- [LangChain Issues](./reviews/langchain-chat-issues.md)