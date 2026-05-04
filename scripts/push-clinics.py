"""
push-clinics.py
---------------
STEP 2 OF 2 in the clinic data pipeline.

What this does:
  Reads a clinics JSON file (output from clinic-website-scraper.py) and upserts
  each entry into the clinic_scraped_data table in Supabase, resolving the
  clinic_id FK by matching on website_url from the clinics table.

Usage:
  python push-clinics.py output/clinics.json

.env needs to be set up

Requirements:
    pip install supabase python-dotenv
"""

import json
import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")  # use service role key for upserts

if not SUPABASE_URL or not SUPABASE_KEY:
    sys.exit("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def load_clinics(path: str) -> list[dict]:
    with open(path, "r") as f:
        return json.load(f)


def normalize_url(url: str) -> str:
    """Lowercase and strip query params for consistent matching."""
    return url.split("?")[0].lower()


def fetch_clinic_id_map(supabase: Client) -> dict[str, str]:
    """
    Returns a dict of { normalized_url -> clinic uuid }
    fetched from the clinics table.
    """
    result = supabase.table("clinics").select("id, website_url").execute()
    if not result.data:
        return {}
    return {
        normalize_url(row["website_url"]): row["id"]
        for row in result.data
        if row.get("website_url")
    }


def build_row(clinic: dict, clinic_id: str) -> dict:
    """
    Build the clinic_scraped_data row from a clinic JSON entry.
    """
    return {
        "clinic_id": clinic_id,
        "url": clinic["url"],
        "name": clinic.get("name"),
        "slug": clinic.get("slug"),
        "address": clinic.get("address"),
        "city": clinic.get("city"),
        "country": clinic.get("country"),
        "google_place_id": clinic.get("google_place_id") or None,
        "description": clinic.get("description"),
        "techniques": clinic.get("techniques") or [],
        "services": clinic.get("services") or [],
        "body_areas": clinic.get("body_areas") or [],
        "languages_spoken": clinic.get("languages_spoken") or [],
        "price_range_raw": clinic.get("price_range_raw"),
        "price_per_graft_usd": clinic.get("price_per_graft_usd"),
        "price_min_usd": clinic.get("price_min_usd"),
        "price_max_usd": clinic.get("price_max_usd"),
        "currency_noted": clinic.get("currency_noted"),
        "financing_available": clinic.get("financing_available", False),
        "price_confidence": clinic.get("price_confidence"),
        "doctors": clinic.get("doctors") or [],
        "certifications": clinic.get("certifications") or [],
        "memberships": clinic.get("memberships") or [],
        "accreditations": clinic.get("accreditations") or [],
        "years_experience": clinic.get("years_experience"),
        "years_established": clinic.get("years_established"),
        "cases_performed": clinic.get("cases_performed"),
        "success_rate_pct": clinic.get("success_rate_pct"),
        "has_online_booking": clinic.get("has_online_booking", False),
        "offers_free_consultation": clinic.get("offers_free_consultation", False),
        "offers_virtual_consultation": clinic.get("offers_virtual_consultation", False),
        "booking_url": clinic.get("booking_url") or None,
        "has_before_after": clinic.get("has_before_after", False),
        "data_quality": clinic.get("data_quality"),
        "scraped_at": clinic.get("scraped_at"),
        "cleaned_at": clinic.get("cleaned_at"),
        "pages_scraped": clinic.get("pages_scraped"),
        "scrape_ok": clinic.get("scrape_ok", False),
        "error": clinic.get("error") or None,
    }


def push_clinics(json_path: str):
    print(f"Loading clinics from {json_path}...")
    clinics = load_clinics(json_path)
    print(f"  {len(clinics)} entries found.")

    print("Fetching clinic IDs from Supabase...")
    clinic_id_map = fetch_clinic_id_map(supabase)
    print(f"  {len(clinic_id_map)} clinics found in DB.")

    rows_to_upsert = []
    skipped = []

    for clinic in clinics:
        raw_url = clinic.get("url", "")
        norm_url = normalize_url(raw_url)
        clinic_id = clinic_id_map.get(norm_url)

        if not clinic_id:
            skipped.append(raw_url)
            continue

        rows_to_upsert.append(build_row(clinic, clinic_id))

    if skipped:
        print(f"\n⚠️  {len(skipped)} clinics had no matching row in the clinics table:")
        for url in skipped:
            print(f"    {url}")

    if not rows_to_upsert:
        print("\nNothing to upsert. Exiting.")
        return

    print(f"\nUpserting {len(rows_to_upsert)} rows into clinic_scraped_data...")
    result = (
        supabase.table("clinic_scraped_data")
        .upsert(rows_to_upsert, on_conflict="url")
        .execute()
    )

    inserted = len(result.data) if result.data else 0
    print(f"✅ Done. {inserted} rows upserted.")


if __name__ == "__main__":
    json_path = sys.argv[1] if len(sys.argv) > 1 else "output/clinics.json"
    push_clinics(json_path)