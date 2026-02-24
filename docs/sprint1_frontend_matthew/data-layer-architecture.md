# Data Layer Architecture

## Our Approach: Reusable Functions, Not API Routes

We use **reusable query functions** in `lib/api/` that are called directly from server components, rather than creating API routes in `app/api/`.

```
lib/
  api/
    clinics.ts    # Reusable functions to fetch clinic data
  supabase/
    server.ts     # Supabase server client
    client.ts     # Supabase browser client
    database.types.ts  # Auto-generated types
```

## Why Not API Routes?

### The Kitchen Analogy

**API routes** = Calling a restaurant to place a delivery order
- You're outside, need to describe what you want
- They prepare it and send it back
- Extra steps, extra time

**Direct function calls** = You're already in the kitchen
- Just grab what you need directly
- No middleman, no extra network hop

Next.js server components run on the server, right next to the database. They're "in the kitchen" - no need to call in an order.

### The Technical Reason

With API routes (unnecessary extra hop):
```
Browser Request
    ↓
Server Component
    ↓
fetch('/api/clinics')  ← Extra network request
    ↓
API Route Handler
    ↓
Supabase Query
    ↓
Response back up the chain
```

With direct functions (simpler):
```
Browser Request
    ↓
Server Component
    ↓
getClinics()  ← Direct function call
    ↓
Supabase Query
    ↓
Render HTML → Browser
```

## How It Works

### 1. Define reusable functions
```tsx
// lib/api/clinics.ts
import { createClient } from '@/lib/supabase/server';

export async function getClinics() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clinics')
    .select('*, clinic_scores(*)')
    .eq('status', 'active');

  if (error) throw error;
  return data;
}

export async function getClinicById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clinics')
    .select('*, clinic_scores(*), clinic_services(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}
```

### 2. Call from any server component
```tsx
// app/clinics/page.tsx
import { getClinics } from '@/lib/api/clinics';

async function ClinicsPage() {
  const clinics = await getClinics();
  return <ClinicList clinics={clinics} />;
}

// app/clinics/[id]/page.tsx
import { getClinicById } from '@/lib/api/clinics';

async function ClinicDetailPage({ params }) {
  const clinic = await getClinicById(params.id);
  return <ClinicProfile clinic={clinic} />;
}

// app/compare/page.tsx - same functions, different page
import { getClinics } from '@/lib/api/clinics';

async function ComparePage() {
  const clinics = await getClinics();
  return <CompareView clinics={clinics} />;
}
```

## Benefits

| Benefit | Explanation |
|---------|-------------|
| **Simpler** | No API route boilerplate, just functions |
| **Faster** | No extra HTTP request between server component and API |
| **Type-safe** | Full TypeScript from database to component |
| **DRY** | Write query once, use everywhere |
| **Easy to test** | Mock functions directly in tests |

## When WOULD We Use API Routes?

API routes make sense when something **outside** your Next.js app needs the data:

- **Mobile app** - iOS/Android app calling your backend
- **External partners** - Third-party sites pulling your clinic data
- **Webhooks** - Stripe payment confirmations, calendar callbacks
- **Cron jobs** - External scheduled tasks that need to hit an endpoint
- **Public API** - If you want to offer a developer API

For everything inside the Next.js app, direct function calls are simpler and faster.

## Note on Supabase

Supabase already provides a REST API and client libraries. Creating `/api/clinics` on top of that would be:

```
Browser → Your API Route → Supabase API → Database
```

When you could just:

```
Server Component → Supabase Client → Database
```

We're not avoiding APIs - we're avoiding *redundant* APIs.
