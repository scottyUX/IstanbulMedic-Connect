# Data sources

This folder contains **example payloads** and **mapping guides** for external data sources we use to enrich clinic records.

## Google Places API

- **Example JSON**: `docs/data-sources/google-places-api-response-example.json`
- **Mapping guide**: `docs/data-sources/google-places-data-mapping.md`

## Instagram (Apify)

- **Example JSON**: `docs/data-sources/instagram-api-response-example.json`
- **Mapping guide**: `docs/data-sources/instagram-data-mapping.md`

# Data Sources Documentation

This directory contains documentation and example JSON responses for external data sources used in the clinic data aggregation system.

## Overview

These files document the structure and mapping of data from various sources that can be used to populate clinic records:

- **Google Places API** - Location, contact, ratings, reviews, and business information
- **Instagram (Apify)** - Social media profile data, engagement metrics, and content signals

## Files

### Google Places API

- **`google-places-api-response-example.json`** - Complete example response from Google Places API Details endpoint
- **`google-places-data-mapping.md`** - Documentation mapping Google Places fields to clinic model fields

**Key Fields:**
- Place details (name, address, coordinates)
- Contact information (phone, website, email)
- Ratings and reviews
- Photos
- Opening hours
- Business metadata (price level, types, accessibility)

### Instagram (Apify)

- **`instagram-api-response-example.json`** - Example response from Apify Instagram Profile scraper
- **`instagram-data-mapping.md`** - Documentation for extracting normalized claims from Instagram data

**Key Fields:**
- Profile information (username, bio, verified status)
- Business account details (category, address)
- Engagement metrics (followers, posts, highlights)
- Content signals (hashtags, services, positioning claims)

## Data Structure

Each data source follows a consistent pattern:

1. **Raw Source Data** - Data as returned from the API/scraper (stored as-is)
2. **Extracted Claims** - Normalized fields extracted for clinic records
3. **Metadata** - Confidence scores, timestamps, extraction version

## Usage

These examples serve as:
- **Reference** for implementing data extraction services
- **Golden examples** for testing and validation
- **Documentation** for understanding data structures
- **Mapping guides** for transforming raw data into clinic model fields

## Integration Notes

- Raw data should be stored in `source_profiles` or `clinic_sources` with appropriate `source_type`
- Extracted claims should go into a facts/claims layer that can coexist with multiple sources
- Confidence scores help prioritize data when multiple sources conflict
- Keep raw payloads for audit trails and future re-extraction

## Related Documentation

- See main project README for overall architecture
- See clinic model documentation for target schema
- See API documentation for integration endpoints
