# Doctor Credential Scraper

Pulls doctor names and qualifications from the public **ISHRS** (`ishrs.org`) and
**IAHRS** (`iahrs.org`) directories and writes them into the `clinic_team` and
`clinic_team_qualifications` tables in Supabase.

This is a one-off CLI run on demand by a developer, not a service.

## Setup

```bash
cd scraper
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

Environment variables (read from the project root `.env.local`):

- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`)
- `SUPABASE_SERVICE_ROLE_KEY` — required; the scraper writes to `clinic_team` and `clinic_team_qualifications`

## Running

```bash
# Edit seeds.json first — every entry must have a real clinic_id from
# the local Supabase clinics table.
python -m scraper.run
```

Re-running is safe and idempotent: rows are upserted on
`(team_member_id, qualification, source)`.

## Tests

```bash
pytest
```

Tests are deterministic — they use saved HTML fixtures under `tests/fixtures/`
and never hit the network.

## Scope and out-of-scope

In scope:
- Two sources: ISHRS, IAHRS.
- Match doctors from both sources to existing `clinic_team` rows by
  `(clinic_id, normalized name)`. Insert new `clinic_team` rows for doctors
  that don't exist yet.
- Sanity-check every scrape with the seed entry's `expected_name`.

Out of scope (deferred):
- Tescil numarası / Doktor Bilgi Bankası verification — gated behind e-Devlet login.
- Surgeon-performs-vs-supervises — no public data source.
- Scheduled / cron scrape runs.
- Auto-deletion of removed qualifications.
