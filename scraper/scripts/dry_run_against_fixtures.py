"""Offline dry-run of the new aggregation runner.

Drives ISHRS / IAHRS / TPRECD search() against the captured search-page
fixtures (no network) using doctor names parsed from the
20260514093830_refresh_clinic_team_from_verified_sources.sql migration
(no Supabase). Prints what the runner WOULD upsert for each doctor.

This script exists so a developer can confirm the search-and-match logic
end-to-end without touching production Supabase or hammering the
registries with N live POSTs. It is read-only and never connects anywhere.

Usage:
    python scripts/dry_run_against_fixtures.py
"""

from __future__ import annotations

import re
import sys
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent.parent
SCRAPER_PARENT = ROOT  # scraper package lives at <ROOT>/scraper/
if str(SCRAPER_PARENT) not in sys.path:
    sys.path.insert(0, str(SCRAPER_PARENT))

FIXTURES = ROOT / "scraper" / "tests" / "fixtures" / "search"
MIGRATION = ROOT / "supabase" / "migrations" / (
    "20260514093830_refresh_clinic_team_from_verified_sources.sql"
)


def _load_fixture(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def parse_doctor_names() -> list[str]:
    """Parse doctor names from the curated-roster migration's INSERT statements."""
    text = MIGRATION.read_text(encoding="utf-8")
    pattern = re.compile(
        r"SELECT id,\s*'(?:[^']+)',\s*'([^']+)',\s*'(?:[^']+)',\s*'(?:[^']+)'",
        re.IGNORECASE,
    )
    return pattern.findall(text)


def install_fixture_stubs() -> None:
    from scraper.sources import iahrs, ishrs, tprecd

    def ishrs_fetch(url, *, use_cache=True):
        if "find-a-doctor" in url:
            return _load_fixture("ishrs_find_a_doctor_page.html")
        if "admin-ajax.php" in url:
            return _load_fixture("ishrs_table_data.json")
        raise AssertionError(f"unexpected ISHRS fetch: {url}")

    def iahrs_fetch(url, *, use_cache=True):
        if "/hair-transplant/turkey" in url:
            return _load_fixture("iahrs_turkey_page.html")
        raise AssertionError(f"unexpected IAHRS fetch: {url}")

    def tprecd_fetch(url, *, use_cache=True):
        if url == tprecd.SEARCH_URL:
            return _load_fixture("tprecd_doktor_arama_form.html")
        raise AssertionError(f"unexpected TPRECD fetch: {url}")

    by_lastname = {
        "Karadeniz": _load_fixture("tprecd_results_karadeniz.html"),
        "Yılmaz": _load_fixture("tprecd_results_yilmaz.html"),
        "Yilmaz": _load_fixture("tprecd_results_yilmaz.html"),
    }
    no_result_html = _load_fixture("tprecd_results_noresult.html")

    def tprecd_post(url, data, *, referer=None, use_cache=True):
        last_name = data.get("ctl00$ctl00$ContentPlaceHolder1$Content3$TextBox2", "")
        return by_lastname.get(last_name, no_result_html)

    patch.object(ishrs, "fetch", ishrs_fetch).start()
    patch.object(iahrs, "fetch", iahrs_fetch).start()
    patch.object(tprecd, "fetch", tprecd_fetch).start()
    patch.object(tprecd, "post", tprecd_post).start()


def main() -> int:
    install_fixture_stubs()

    # Import after stubs so module-level cache state is fresh.
    from scraper.run import _lookup_all

    names = parse_doctor_names()
    print(f"Doctors to verify: {len(names)}\n")

    total_hits = 0
    by_source: dict[str, int] = {}
    for name in names:
        hits = _lookup_all(name)
        if hits:
            total_hits += len(hits)
            for h in hits:
                by_source[h.source] = by_source.get(h.source, 0) + 1
            badges = ", ".join(f"{h.source}→{h.source_url}" for h in hits)
            print(f"  HIT  {name}: {badges}")
        else:
            print(f"  miss {name}")

    print(f"\nTotal: {len(names)} doctors, {total_hits} qualification rows")
    print(f"By source: {by_source}")
    print(
        "\nCaveats:\n"
        "  - ISHRS / IAHRS coverage is REAL: the captured fixtures contain the\n"
        "    full Turkey list at fixture-capture time, so a miss here means\n"
        "    the doctor is genuinely not on that registry's Turkey list.\n"
        "  - TPRECD coverage is UNDER-counted: the only TPRECD result fixtures\n"
        "    captured were Karadeniz, Yılmaz, and a no-result probe. Doctors\n"
        "    whose last name is anything else fall through to the no-result\n"
        "    fixture by design. Run against the live registry to see true\n"
        "    TPRECD coverage.\n"
        "  - Op. Dr. Ali Emre Karadeniz is missed on ISHRS because his ISHRS\n"
        "    profile is listed as 'Emre Karadeniz' (no middle name); per the\n"
        "    matcher's threshold-88 rule, that's intentionally rejected to\n"
        "    prevent false-positive merges across people who share a surname.\n"
        "    The TPRECD hit captures this doctor."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
