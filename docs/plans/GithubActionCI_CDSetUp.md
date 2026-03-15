# Plan: Full GitHub Actions CI Workflow

## Context

The project currently has a minimal CI workflow (`.github/workflows/main.yml`) that only installs dependencies and runs `npm test` — which actually invokes `vitest` in **watch mode**, meaning the job would hang indefinitely. The goal is to replace it with a proper full CI pipeline covering linting, type-checking, tests with coverage, security auditing, and a production build check.

**Stack:** Next.js 16 (App Router) + TypeScript + Supabase + CopilotKit/LangChain, tested with Vitest, linted with ESLint.

---

## Implementation Plan

### Files to modify/create
- `.github/workflows/main.yml` — full replacement
- `.github/workflows/codeql.yml` — new file (CodeQL SAST)
- `.github/dependabot.yml` — new file

---

### Workflow Design

**Triggers:**
- `push` to any branch
- `pull_request` targeting any branch

**Node version:** 20 (matches existing config)

**Jobs (run in parallel where possible):**

```
lint ──┐
       ├──► build (only after all 3 pass)
type  ─┤
       │
test  ─┘
```

---

### Job Details

#### 1. `lint`
```yaml
- npm ci
- npm run lint
```
Catches ESLint violations using `eslint-config-next/core-web-vitals` + TypeScript rules.

#### 2. `type-check`
```yaml
- npm ci
- npx tsc --noEmit
```
Validates TypeScript compilation without emitting files. Catches type errors that ESLint may miss.

#### 3. `test`
```yaml
- npm ci
- npm run test:run          # single-pass (not watch mode)
- npm run test:coverage     # generate coverage report
```
Uses `vitest run` instead of `vitest` (watch mode) to avoid hanging. Uploads coverage artifact.

**Env vars needed for tests** (mocked via `env:` block, not real secrets):
```
NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY: placeholder
SUPABASE_SERVICE_ROLE_KEY: placeholder
OPENAI_API_KEY: placeholder
```

#### 4. `build`
```yaml
needs: [lint, type-check, test]
- npm ci
- npm run build
```
Runs `next build` to catch build-time errors. Requires `NEXT_PUBLIC_*` env vars (stored as GitHub Secrets). Caches the Next.js build cache (`.next/cache`) across runs using `actions/cache`.

**Env vars needed for build** (from GitHub Secrets):
- `NEXT_PUBLIC_SUPABASE_URL` → `${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → `${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}`
- `OPENAI_API_KEY` → `${{ secrets.OPENAI_API_KEY }}`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` → `${{ secrets.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY }}`
- `CAL_COM_API_KEY` → `${{ secrets.CAL_COM_API_KEY }}`
- `CAL_COM_EVENT_TYPE_ID` → `${{ secrets.CAL_COM_EVENT_TYPE_ID }}`

---

### Shared Optimizations (all jobs)
- `actions/checkout@v4`
- `actions/setup-node@v4` with `node-version: "20"` and `cache: "npm"`
- `npm ci` (clean install from lock file)

### Security Job (optional, on schedule)
- `npm audit --audit-level=high` — flag high/critical vulnerabilities
- Can be added as a separate `security` job or nightly cron

---

## CodeQL (Static Application Security Testing)

**Compatibility:** ✅ Fully compatible. CodeQL supports JavaScript/TypeScript natively — no build step needed for JS.

**New file:** `.github/workflows/codeql.yml`

CodeQL performs deep static analysis to find security vulnerabilities (XSS, injection flaws, prototype pollution, insecure auth patterns, etc.) directly in source code.

**Triggers:**
- Push to any branch
- PR to any branch
- Weekly schedule (Sunday midnight) — catches new CVEs against unchanged code

**Config highlights:**
```yaml
- uses: github/codeql-action/init@v3
  with:
    languages: javascript-typescript   # covers .ts, .tsx, .js
    queries: security-and-quality      # extended query suite
- uses: github/codeql-action/analyze@v3
```

**Results:** Appear in **Security → Code scanning alerts** tab on GitHub.

**Note on private repos:** CodeQL is free for public repos. For private repos it requires GitHub Advanced Security (GHAS), which is included in GitHub Enterprise or available as an add-on. If the repo is private without GHAS, the workflow will still run but results won't appear in the Security tab — use `npm audit` in the main CI as a fallback.

---

## Dependabot (Security Scanning + Dependency Updates)

**Compatibility:** ✅ Fully compatible. Dependabot natively supports npm and GitHub Actions ecosystems.

**New file:** `.github/dependabot.yml`

Dependabot will:
1. Scan `package-lock.json` weekly and open PRs to update outdated/vulnerable npm dependencies
2. Also keep GitHub Actions versions up to date (e.g. `actions/checkout`, `actions/setup-node`)

**Config:**
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
    groups:
      dev-dependencies:
        dependency-type: "development"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    labels:
      - "ci"
```

**How it works with CI:** Dependabot PRs will automatically trigger the CI workflow (all pushes/PRs), so updates are validated before merging.

---

## GitHub Secrets Required

The user must add these in **Settings → Secrets and variables → Actions**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `CAL_COM_API_KEY`
- `CAL_COM_EVENT_TYPE_ID`

---

## Verification

After implementation:
1. Push to any branch — all 4 CI jobs should appear in the Actions tab
2. Open a PR to any branch — CI triggers again on the PR
3. Intentionally break a type → `type-check` job fails, `build` is skipped
4. Intentionally break a lint rule → `lint` job fails, `build` is skipped
5. Verify `test` job completes (does not hang)
6. Verify coverage report is uploaded as a workflow artifact
7. Check **Insights → Dependency graph → Dependabot** tab appears after pushing `dependabot.yml`; first Dependabot PR should arrive within a week (or can be triggered manually via GitHub UI)
8. Check **Security → Code scanning alerts** tab after CodeQL first run completes (takes ~5–10 min for JS/TS)
