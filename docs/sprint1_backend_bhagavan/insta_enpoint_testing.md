# Testing — Instagram Import Endpoint

## Overview

This document covers automated and manual testing for the Instagram import endpoint at:

```
POST /api/import/instagram
```

---

## Automated Tests

### Location

```
app/api/import/instagram/route.test.ts
```

### Setup

Ensure dependencies are installed:

```bash
npm i -D vitest @vitejs/plugin-react
```

The `vitest.config.ts` at the project root must include the `app/` directory:

```ts
test: {
  include: [
    'tests/**/*.test.{ts,tsx}',
    'app/**/*.test.{ts,tsx}',
  ],
}
```

### Running the Tests

Run just the Instagram import tests:

```bash
npx vitest run app/api/import/instagram/route.test.ts
```

Run the full test suite once:

```bash
npm run test:run
```

Run in watch mode (reruns on file save):

```bash
npm test
```

### What Is Tested

| Category | Tests | Description |
|---|---|---|
| Request validation | 4 | Missing `clinicId`, missing `instagramData`, missing both, empty body |
| Successful import | 6 | 200 response, summary counts, posts upserted, clinic website update (both branches) |
| Fact generation | 7 | Correct facts written to DB, values, confidence scores, omission when no posts |
| Comment sanitisation | 8 | Empty/null/undefined `latestComments`, whitespace `firstComment`, mixed posts, fact exclusion |
| Post upsert shape | 2 | Hashtag lowercasing, field mapping |
| Error handling | 5 | DB failure at each stage, error message in response, malformed JSON body |
| Edge cases | 5 | No external URLs, sparse claims, no hashtags, zero engagement, avg likes calculation |

### Expected Output

```
Test Files  1 passed (1)
     Tests  38 passed (38)
```

---

## Manual Testing with curl

### Prerequisites

- Dev server running: `npm run dev`
- supabase running locally: `supabase start` & `supabase db reset`
- `jq` installed for pretty-printed responses: `sudo apt install jq`
- A valid `clinicId` from your Supabase database

### Prepare the Payload

The endpoint expects a `clinicId` and `instagramData` wrapper around the raw scraped JSON. Run this once to create the payload file:

```bash
echo '{
  "clinicId": "your-clinic-id-here",
  "instagramData": '"$(cat 'instagram-extracted-claims (1).json')"'
}' > payload.json
```

Replace `your-clinic-id-here` with a real clinic ID, otherwise Supabase will reject it on the foreign key constraint.

### Send the Request

```bash
curl -X POST http://localhost:3000/api/import/instagram \
  -H "Content-Type: application/json" \
  -d @payload.json \
  | jq .
```

### Expected Success Response

```json
{
  "success": true,
  "message": "Instagram data imported successfully",
  "summary": {
    "sourceCreated": true,
    "documentCreated": true,
    "socialMediaUpdated": true,
    "factsCreated": 15,
    "postFactsCreated": 7,
    "postsUpserted": 50,
    "evidenceLinked": 15
  }
}
```

### Common Error Responses

**Missing fields (400)**
```json
{
  "error": "Missing required fields: clinicId, instagramData"
}
```
Fix: ensure both `clinicId` and `instagramData` are present in the request body.

**Database error (500)**
```json
{
  "error": "insert or update on table violates foreign key constraint"
}
```
Fix: check that the `clinicId` exists in your Supabase `clinics` table.

**Supabase not reachable (500)**
```json
{
  "error": "connection refused"
}
```
Fix: check your `.env` file has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set correctly.
