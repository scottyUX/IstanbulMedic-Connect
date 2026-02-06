# Instagram (Apify) → Clinic claims mapping

This guide documents the fields we store from the Apify Instagram profile dataset, and the normalized “claims” we extract for clinic enrichment.

## Store raw source snapshot (as-is)

Persist the Apify payload under something like `clinic_sources` with `source_type = "instagram"` (or keep in a JSON `payload` column), including:

- `instagram.inputUrl`
- `instagram.id`
- `instagram.username`
- `instagram.url`
- `instagram.fullName`
- `instagram.biography`
- `instagram.externalUrl`
- `instagram.externalUrls[]`
- `instagram.followersCount`
- `instagram.followsCount`
- `instagram.postsCount`
- `instagram.profilePicUrl`
- `instagram.profilePicUrlHD`
- `instagram.verified`
- `instagram.private`
- `instagram.isBusinessAccount`
- `instagram.businessCategoryName`
- `instagram.businessAddress` (object)
- `instagram.highlightReelCount`
- `instagram.igtvVideoCount`
- `instagram.hasChannel`
- `instagram.joinedRecently`
- `instagram.fbid`

## Extract normalized claims (signals)

These should be stored separately (facts/claims layer) so they can coexist with other sources (Google Places, registries, etc.).

### Identity & linking

- `social.instagram.handle` ← `instagram.username`
- `social.instagram.profile_url` ← `instagram.url`
- `social.instagram.profile_id` ← `instagram.id`
- `identity.display_name_variants[]` ← `instagram.fullName` (+ optional variants from bio)

### Contact & outbound links

- `contact.website_candidates[]` ← `instagram.externalUrl` + `instagram.externalUrls[]`
- `contact.link_aggregator_detected` ← derived from link domains (e.g., linktr.ee, linkin.bio)
- `contact.address_text` ← `instagram.businessAddress.addressString` (if available)

### Account metadata (signals)

- `social.instagram.is_verified` ← `instagram.verified`
- `social.instagram.is_business` ← `instagram.isBusinessAccount`
- `social.instagram.business_category` ← `instagram.businessCategoryName`
- `social.instagram.is_private` ← `instagram.private`
- `social.instagram.joined_recently` ← `instagram.joinedRecently`

### Activity / presence (signals)

- `social.instagram.followers_count` ← `instagram.followersCount`
- `social.instagram.follows_count` ← `instagram.followsCount`
- `social.instagram.posts_count` ← `instagram.postsCount`
- `social.instagram.highlights_count` ← `instagram.highlightReelCount`
- `social.instagram.igtv_count` ← `instagram.igtvVideoCount`

### Content-derived signals (low confidence)

Derived from `instagram.biography` (and optionally posts):

- `services.claimed[]` ← keywords/hashtags (e.g., hair transplant, FUE, DHI)
- `positioning.claims[]` ← “leading”, “#1”, “best”, “accredited” (treat as unverified)
- `languages.claimed[]` ← EN/TR/AR indicators
- `geography.claimed[]` ← city/country mentions

## Example payload

See: `docs/data-sources/instagram-api-response-example.json`

