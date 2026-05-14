"""Merge multiple ScrapedDoctor records (one per source) into a single
MergedDoctor for a seed entry.

Rules:
  * Each scraped qualification becomes one row, keyed on
    (team_member_id, qualification, source). Stored in `MergedDoctor.qualifications`
    as (qualification, source, source_url) tuples.
  * Qualifications are canonicalized so casing/whitespace variants collapse
    to a single row.
  * The full name preferred for the canonical record is the longest scraped
    name — directories that include middle names ("Ali Emre Karadeniz") give
    a more correct identity than the shorter spelling.

Each scraper now emits exactly one qualification (registry presence IS the
credential), so the merger's main job is name selection and external_id
collection.
"""

from __future__ import annotations

from scraper.types import MergedDoctor, ScrapedDoctor, SeedEntry

# Canonical qualification strings, one per registry. Scrapers should emit
# exactly these — the map exists so casing/whitespace variants from older
# rows collapse to the same canonical form on re-scrape.
_CANONICAL: dict[str, str] = {
    "ishrs member": "ISHRS member",
    "iahrs member": "IAHRS member",
    "tprecd member (turkish board-certified plastic surgeon)":
        "TPRECD member (Turkish board-certified plastic surgeon)",
}


def canonicalize(qualification: str) -> str:
    """Map a scraped qualification string to its canonical form."""
    key = qualification.strip().lower()
    return _CANONICAL.get(key, qualification.strip())


def merge(seed: SeedEntry, scrapes: list[ScrapedDoctor]) -> MergedDoctor:
    """Combine scraped records into one MergedDoctor for a seed entry."""
    if not scrapes:
        raise ValueError("merge() called with no scrapes")

    full_name = max((s.full_name for s in scrapes), key=len)

    external_ids: dict[str, str] = {}
    seen: set[tuple[str, str]] = set()
    qualifications: list[tuple[str, str, str]] = []

    for scrape in scrapes:
        external_ids[f"{scrape.source}_id"] = scrape.external_id
        for raw in scrape.qualifications:
            canonical = canonicalize(raw)
            key = (canonical, scrape.source)
            if key in seen:
                continue
            seen.add(key)
            qualifications.append((canonical, scrape.source, scrape.source_url))

    return MergedDoctor(
        clinic_id=seed.clinic_id,
        expected_name=seed.expected_name,
        full_name=full_name,
        external_ids=external_ids,
        qualifications=qualifications,
    )
