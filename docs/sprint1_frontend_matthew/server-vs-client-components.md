# Server Components vs Client Components in Next.js

## The Core Difference

| | Server Component | Client Component |
|---|---|---|
| Directive | None (default) | `"use client"` at top of file |
| Runs where | On the server only | In the browser (after initial server render) |
| Can use hooks | No (`useState`, `useEffect`, etc.) | Yes |
| Can use event handlers | No (`onClick`, `onChange`, etc.) | Yes |
| Can fetch data directly | Yes (`async/await`) | No (needs `useEffect` or libraries) |
| Sent to browser | HTML only | HTML + JavaScript |

## When to Use Each

### Use Server Components (default) for:
- Displaying data from a database
- Static content that doesn't change based on user interaction
- Pages where SEO matters (Google needs to see the content)
- Anything that doesn't need `useState`, `useEffect`, or event handlers

### Use Client Components (`"use client"`) for:
- Interactive elements (buttons, forms, toggles)
- Anything using React hooks
- Features that respond to user input
- Real-time updates or animations

## Code Examples

### Server Component (no directive needed)
```tsx
// app/clinics/page.tsx
import { getClinics } from '@/lib/api/clinics';

// This function runs on the server
async function ClinicsPage() {
  const clinics = await getClinics(); // Direct database fetch

  return (
    <ul>
      {clinics.map(clinic => (
        <li key={clinic.id}>{clinic.name}</li>
      ))}
    </ul>
  );
}

export default ClinicsPage;
```

### Client Component (needs "use client")
```tsx
// components/SearchBox.tsx
"use client"

import { useState } from 'react';

function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState("");

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && onSearch(query)}
      placeholder="Search clinics..."
    />
  );
}

export default SearchBox;
```

### Mixing Both (common pattern)
```tsx
// app/clinics/page.tsx (Server Component)
import { getClinics } from '@/lib/api/clinics';
import SearchBox from '@/components/SearchBox';    // Client component
import ClinicCard from '@/components/ClinicCard';  // Can be server component

async function ClinicsPage() {
  const clinics = await getClinics(); // Fetch on server

  return (
    <div>
      <SearchBox />  {/* Interactive - client */}

      <div className="grid">
        {clinics.map(clinic => (
          <ClinicCard key={clinic.id} clinic={clinic} />
        ))}
      </div>
    </div>
  );
}
```

## Why Server Components?

### 1. Performance
Less JavaScript sent to the browser = faster page loads.

```
Server component page: ~50KB
Same page as client components: ~200KB+ (includes React code to hydrate)
```

### 2. Simpler Data Fetching
No loading states, no `useEffect`, no race conditions.

```tsx
// Server: Simple and clean
async function Page() {
  const data = await fetchData();
  return <div>{data.title}</div>;
}

// Client: More complex
"use client"
function Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <Error />;
  return <div>{data.title}</div>;
}
```

### 3. SEO
Search engines see fully rendered content, not loading spinners.

### 4. Security
Database queries and API keys stay on the server, never exposed to browser.

## Common Mistakes

### Mistake 1: Adding "use client" unnecessarily
```tsx
// DON'T do this - no interactivity needed
"use client"
function ClinicCard({ name, location }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{location}</p>
    </div>
  );
}

// DO this - let it be a server component
function ClinicCard({ name, location }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{location}</p>
    </div>
  );
}
```

### Mistake 2: Trying to use hooks in server components
```tsx
// This will ERROR - no hooks in server components
async function Page() {
  const [count, setCount] = useState(0);  // Error!
  const data = await fetchData();
  return <div>{data.title}</div>;
}

// Extract the interactive part to a client component instead
```

## Rule of Thumb

**Start with server components. Add `"use client"` only when you need interactivity.**

The component needs `useState`, `useEffect`, `onClick`, or similar? → Client component.
Otherwise? → Keep it as a server component.
