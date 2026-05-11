# Clinic Comparison Feature

Lets users pick two clinics and view them side by side, filtered by data source (Instagram, Reddit, Google Places, or all sources combined).

---

## Routes

| URL | Source shown |
|-----|-------------|
| `/clinics/compare` | All sources (default) |
| `/clinics/compare/instagram` | Instagram intelligence |
| `/clinics/compare/reddit` | Reddit signals |
| `/clinics/compare/google-places` | Google Places data |

Each route is a server component that fetches up to 50 clinics alphabetically and passes them to `CompareClinicPage` with the appropriate `source` prop.

Left/right clinic selections are synced to the URL as `?left=<id>&right=<id>` so comparisons are shareable.

---

## File Locations

**App routes** — `app/clinics/compare/`
- `page.tsx` — all sources
- `instagram/page.tsx`
- `reddit/page.tsx`
- `google-places/page.tsx`

**Components** — `components/istanbulmedic-connect/comparison/`
- `CompareClinicPage.tsx` — main shell: source pill navigation, two-pane layout, clinic selection list (`ClinicRow`), URL sync
- `AllSourcesView.tsx` — generic clinic card shown in "All Sources" mode
- `InstagramView.tsx` — Instagram-specific card
- `RedditView.tsx` — Reddit-specific card
- `GooglePlacesView.tsx` — Google Places-specific card

**Entry point** — `components/istanbulmedic-connect/ExploreClinicsPage.tsx`
A "Compare clinics side by side" banner above the clinic grid links to `/clinics/compare`.

---

## Source Views — Placeholder Status

All four source view components are **scaffolds only**. They display the clinic's basic info (name, location, rating, trust score) and show the structure of what each source will eventually display. None of the source-specific data is wired to the backend yet.

| View | What it will show | Status |
|------|------------------|--------|
| `AllSourcesView` | General clinic info, trust score, specialties | Basic data connected |
| `InstagramView` | Follower count, posts, bio claims, verified status, external links | Placeholder |
| `RedditView` | Mention count, subreddit spread, sentiment breakdown, common topics | Placeholder |
| `GooglePlacesView` | Star rating, per-star breakdown, review count | Rating/count connected; breakdown placeholder |

Once the compare page fetches `ClinicDetail` (or a purpose-built compare endpoint) for selected clinics, the source views can be filled in with real data from `instagramSignals`, `redditSignals`, and `reviews`.
