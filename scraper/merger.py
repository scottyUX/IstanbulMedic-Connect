"""Merge multiple ScrapedDoctor records (one per source) into a single
MergedDoctor for a seed entry.

Rules:
  * Each scraped qualification becomes one row, keyed on
    (team_member_id, qualification, source). Stored in `MergedDoctor.qualifications`
    as (qualification, source, source_url) tuples.
  * Qualifications are canonicalized (e.g. "Fellow of ISHRS" -> "FISHRS")
    before insert.
  * The full name preferred for the canonical record is the longest scraped
    name — directories that include middle names ("Ali Emre Karadeniz") give
    a more correct identity than the shorter spelling.
"""

from __future__ import annotations

from scraper.types import MergedDoctor, ScrapedDoctor, SeedEntry

# Both directions of canonical -> alternative spellings live here. Add to this
# dict as new variants show up; the upsert is keyed on the canonical form so
# duplicates collapse into one row.
_CANONICAL: dict[str, str] = {
    "fellow of ishrs": "FISHRS",
    "fellow of the ishrs": "FISHRS",
    "fishrs": "FISHRS",
    "ishrs fellow": "FISHRS",
    "ishrs member": "ISHRS Member",
    "ishrs associate member": "ISHRS Associate Member",
    "associate member of ishrs": "ISHRS Associate Member",
    "iahrs member": "IAHRS Member",
    "abhrs": "ABHRS Diplomate",
    "abhrs diplomate": "ABHRS Diplomate",
    "fue europe": "FUE Europe Member",
    "fue europe member": "FUE Europe Member",
    "isaps": "ISAPS Member",
    "isaps member": "ISAPS Member",
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
