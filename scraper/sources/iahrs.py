"""IAHRS doctor lookup.

Two entry points:

  * search(name) — primary entry point used by the clinic_team-driven runner.
    Loads the IAHRS Turkey country page once per process (cached), parses
    its 6-or-so doctor anchors, returns the profile URL of the best name
    match or None.

  * scrape(url, html=None) — legacy URL-driven entry point used by the
    seed pipeline.

The Turkey page is the canonical IAHRS-Turkey list; everyone listed there
has /hair-transplant/<slug> profile URLs in plain anchors. No JS rendering,
no ajax — one HTTP fetch covers every Turkish doctor.

Registry presence IS the credential. Each match emits exactly one
"IAHRS member" qualification.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from bs4 import BeautifulSoup

from scraper.httpcache import FetchError, fetch
from scraper.matcher import names_match
from scraper.normalize import normalize_name
from scraper.persistence import RegistryHit
from scraper.types import ScrapedDoctor, ScrapeError

SOURCE = "iahrs"
QUALIFICATION = "IAHRS member"

TURKEY_URL = "https://www.iahrs.org/hair-transplant/turkey"

_SLUG_PATTERN = re.compile(r"(?:^|/)hair-transplant/([a-z0-9\-]+)")
# Country/region slugs that appear under /hair-transplant/* but are NOT
# doctor profiles. Anything else is treated as a doctor profile slug.
_NON_DOCTOR_SLUGS = frozenset({
    "turkey", "usa", "uk", "germany", "spain", "mexico", "canada",
    "australia", "italy", "greece", "india", "singapore", "south-korea",
    "brazil", "argentina", "egypt", "iran",
})


def search(name: str) -> RegistryHit | None:
    """Look up a doctor by name in the IAHRS Turkey directory.

    Returns a RegistryHit on a name match, or None if no Turkey-listed
    doctor matches.
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
        chosen = min(candidates, key=lambda r: len(normalize_name(r["full_name"])))

    return RegistryHit(
        source=SOURCE,
        qualification=QUALIFICATION,
        source_url=chosen["profile"],
    )


def _load_turkey_doctors(_cache: dict[str, list[dict[str, str]]] = {}) -> list[dict[str, str]]:
    if "rows" in _cache:
        return _cache["rows"]

    try:
        html = fetch(TURKEY_URL)
    except FetchError as exc:
        raise ScrapeError(f"IAHRS: cannot load Turkey directory: {exc}") from exc

    _cache["rows"] = _parse_turkey_directory(html)
    return _cache["rows"]


def _parse_turkey_directory(html: str) -> list[dict[str, str]]:
    soup = BeautifulSoup(html, "html.parser")
    seen: dict[str, dict[str, str]] = {}
    for anchor in soup.find_all("a", href=True):
        href = anchor["href"]
        match = _SLUG_PATTERN.search(href)
        if not match:
            continue
        slug = match.group(1)
        if slug.lower() in _NON_DOCTOR_SLUGS:
            continue
        text = anchor.get_text(strip=True)
        full = _clean_name(text)
        if not full:
            continue
        # Resolve relative URLs to absolute. The Turkey page emits both forms:
        # bare ("hair-transplant/koray-erdogan") and absolute.
        if href.startswith("http"):
            profile = href
        elif href.startswith("/"):
            profile = f"https://www.iahrs.org{href}"
        else:
            profile = f"https://www.iahrs.org/{href}"
        # Dedupe — the page sometimes lists the same doctor twice (anchor text
        # in the listing AND a "View Profile" link). First spelling wins.
        seen.setdefault(slug, {"full_name": full, "profile": profile})
    return list(seen.values())


def scrape(url: str, html: str | None = None) -> ScrapedDoctor:
    if html is None:
        try:
            html = fetch(url)
        except FetchError as exc:
            raise ScrapeError(str(exc)) from exc

    soup = BeautifulSoup(html, "html.parser")

    name = _extract_name(soup)
    if not name:
        raise ScrapeError(f"IAHRS: no name found on {url}")

    return ScrapedDoctor(
        source=SOURCE,
        source_url=url,
        external_id=_extract_slug(url),
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
        return _clean_name(title.get_text(strip=True).split("|")[0])

    return ""


def _extract_slug(url: str) -> str:
    match = _SLUG_PATTERN.search(url)
    return match.group(1) if match else url


def _clean_name(name: str) -> str:
    """Strip em-dash trailers and trailing credential suffixes.

    IAHRS h1 examples:
      "Koray Erdogan, MD"            → "Koray Erdogan"
      "Dr. X — Hair Transplant Spec" → "Dr. X"
    """
    name = name.split("—")[0].strip()
    name = name.split(" - ")[0].strip()
    if "," in name:
        name = name.split(",")[0].strip()
    return name
