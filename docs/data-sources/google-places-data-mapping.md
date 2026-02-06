# Google Places API → Clinic mapping

This guide documents which Google Places **Place Details** fields we pull, and how they map into our clinic record.

## Source

We use the **Place Details (Legacy)** web service endpoint:

- `GET https://maps.googleapis.com/maps/api/place/details/json`

Typical minimal field set (adjust as needed):

- `photos,name,reviews,rating,user_ratings_total,formatted_address,formatted_phone_number,website,geometry,address_components,types,price_level,business_status,url,opening_hours`

## Raw payload storage

- **Store the full Google response** into a JSON column like `payload` for auditability and future re-processing.

## Suggested clinic fields

| Clinic field | Google Places field | Notes |
|---|---|---|
| `place_id` | `place_id` | Primary external identifier |
| `title` | `name` | Clinic display name |
| `address` | `formatted_address` | Full formatted address |
| `lat` / `lng` | `geometry.location.lat` / `geometry.location.lng` | Coordinates |
| `phone` | `formatted_phone_number` | Prefer formatted |
| `website` | `website` | URL |
| `rating` | `rating` | Float 0–5 |
| `reviews_count` | `user_ratings_total` | Total ratings |
| `opening_hours` | `opening_hours` | Keep as JSON |
| `categories` | `types` | Keep as string array |
| `price_range` | `price_level` | Convert 0–4 to a string/tier as desired |
| `image_url` | derived from `photos[0].photo_reference` | Use Photo endpoint to build a URL |

## Address component extraction

Extract structured fields from `address_components`:

- **city**: component whose `types` includes `locality`
- **state**: component whose `types` includes `administrative_area_level_1`
- **country**: component whose `types` includes `country` (also capture `short_name` as `country_code`)

## Reviews and photos

### Reviews

`reviews[]` may contain up to ~5 items (Google limitation per call). Persist as:
- Raw in `payload`
- Optionally normalized into a related table if you need search/analytics

### Photos

Convert `photo_reference` into a fetchable URL:

`https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=...&key=...`

## Example payload

See: `docs/data-sources/google-places-api-response-example.json`

