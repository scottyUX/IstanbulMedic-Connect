"""ISHRS doctor lookup.

Two entry points:

  * search(name) — primary entry point used by the clinic_team-driven runner.
    Loads the ISHRS doctor directory once per process (cached), filters to
    Turkey, returns the profile URL of the best name match or None.

  * scrape(url, html=None) — legacy URL-driven entry point used by the
    seed pipeline. Parses an /doctor/<id>/ profile page and returns a
    ScrapedDoctor record.

Implementation note: ISHRS does not expose a per-name search endpoint.
Its public Find-A-Doctor table renders client-side from a single ajax JSON
that lists every member worldwide (~600 doctors at time of writing). The
search() function fetches that JSON once via the same nonce the page uses,
caches it, and answers by-name lookups in memory.

Registry presence IS the credential. Each match emits exactly one
"ISHRS member" qualification — no FISHRS / Fellow / tier extraction.
"""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime
from typing import Any

from bs4 import BeautifulSoup

from scraper.httpcache import FetchError, fetch
from scraper.matcher import names_match
from scraper.normalize import normalize_name
from scraper.persistence import RegistryHit
from scraper.types import ScrapedDoctor, ScrapeError

SOURCE = "ishrs"
QUALIFICATION = "ISHRS member"

FIND_A_DOCTOR_URL = "https://ishrs.org/find-a-doctor/"
TARGET_COUNTRY = "Turkey"

_ID_PATTERN = re.compile(r"/doctor/(\d+)")
_NONCE_PATTERN = re.compile(r'ninja_table_public_nonce["\']?\s*[:=]\s*["\']([a-f0-9]+)')

# Tag soup that ISHRS appends to the lastname column ("Karadeniz<br>MD,  FISHRS").
_NAME_NOISE_PATTERN = re.compile(r"<.*?>", re.DOTALL)


def search(name: str) -> RegistryHit | None:
    """Look up a doctor by name in the ISHRS Turkey directory.

    Returns a RegistryHit with the profile URL on a name match, or None when
    no Turkey-listed doctor matches. Multiple Turkey doctors with similar
    names are disambiguated by exact normalized-name equality first; if none
    are exact, the closest fuzzy match (above the matcher threshold) wins.
    """
    if not name or not name.strip():
        return None

    rows = _load_turkey_doctors()
    target = normalize_name(name)

    exact = [r for r in rows if normalize_name(r["full_name"]) == target]
    if exact:
        chosen = exact[0]
    else:
        candidates = [r for r in rows if names_match(r["full_name"], name)]
        if not candidates:
            return None
        # Closest by normalized equality (already empty here) → shortest
        # normalized form wins as a stable tiebreaker.
        chosen = min(candidates, key=lambda r: len(normalize_name(r["full_name"])))

    return RegistryHit(
        source=SOURCE,
        qualification=QUALIFICATION,
        source_url=chosen["profile"],
    )


def _load_turkey_doctors(_cache: dict[str, list[dict[str, Any]]] = {}) -> list[dict[str, Any]]:
    """Fetch and cache the ISHRS Turkey doctor list for the lifetime of the process."""
    if "rows" in _cache:
        return _cache["rows"]

    try:
        page_html = fetch(FIND_A_DOCTOR_URL)
    except FetchError as exc:
        raise ScrapeError(f"ISHRS: cannot load find-a-doctor page: {exc}") from exc

    nonce_match = _NONCE_PATTERN.search(page_html)
    if not nonce_match:
        raise ScrapeError("ISHRS: ninja_table_public_nonce not found on find-a-doctor page")
    nonce = nonce_match.group(1)

    data_url = (
        "https://ishrs.org/wp-admin/admin-ajax.php"
        "?action=wp_ajax_ninja_tables_public_action"
        "&table_id=42231&target_action=get-all-data"
        "&default_sorting=old_first&skip_rows=0&limit_rows=0"
        f"&ninja_table_public_nonce={nonce}"
    )
    try:
        raw = fetch(data_url)
    except FetchError as exc:
        raise ScrapeError(f"ISHRS: cannot load directory data: {exc}") from exc

    try:
        directory = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ScrapeError(f"ISHRS: directory payload is not JSON: {exc}") from exc

    rows: list[dict[str, Any]] = []
    for entry in directory:
        if entry.get("country") != TARGET_COUNTRY:
            continue
        first = _strip_html(entry.get("firstname", ""))
        last = _strip_html(entry.get("lastname", ""))
        full = f"{first} {last}".strip()
        profile = entry.get("profile") or ""
        if not full or not profile:
            continue
        rows.append({"full_name": full, "profile": profile})

    _cache["rows"] = rows
    return rows


def _strip_html(value: str) -> str:
    return _NAME_NOISE_PATTERN.sub(" ", value).strip()


def scrape(url: str, html: str | None = None) -> ScrapedDoctor:
    if html is None:
        try:
            html = fetch(url)
        except FetchError as exc:
            raise ScrapeError(str(exc)) from exc

    soup = BeautifulSoup(html, "html.parser")

    name = _extract_name(soup)
    if not name:
        raise ScrapeError(f"ISHRS: no name found on {url}")

    return ScrapedDoctor(
        source=SOURCE,
        source_url=url,
        external_id=_extract_id(url),
        full_name=name,
        qualifications=(QUALIFICATION,),
        scraped_at=datetime.now(UTC),
    )


def _extract_name(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return _clean_name(h1.get_text(strip=True))

    title = soup.find("title")
    if title:
        text = title.get_text(strip=True)
        return _clean_name(text.split("|")[0].strip())

    return ""


def _clean_name(name: str) -> str:
    """Strip trailing credential suffixes appended by ISHRS h1.

    Example: "Emre Karadeniz, MD, FISHRS" → "Emre Karadeniz"
    """
    if "," in name:
        name = name.split(",")[0].strip()
    return name


def _extract_id(url: str) -> str:
    match = _ID_PATTERN.search(url)
    return match.group(1) if match else url
