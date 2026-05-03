"""ISHRS doctor profile scraper.

Profile URLs look like `https://ishrs.org/doctor/<numeric-id>/`.

Heuristics (selectors are intentionally forgiving — ISHRS templates have
shifted in the past, and we'd rather match a few extra elements than miss
the name field):

  * Name: first <h1> on the page.
  * Member tier: any text matching one of "Fellow", "Member", "Associate Member"
    inside an element with a "membership" / "tier" hint, OR free-text scan
    of the page body when no labelled element is present.
  * ABHRS: explicit "ABHRS" mention anywhere in the bio/text.

We map the tier to a fixed qualification:
    Fellow            -> "FISHRS"
    Member            -> "ISHRS Member"
    Associate Member  -> "ISHRS Associate Member"

Tests pass `html=` directly with a saved fixture; production passes
`html=None` and we fetch.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from bs4 import BeautifulSoup

from scraper.httpcache import FetchError, fetch
from scraper.types import ScrapedDoctor, ScrapeError

SOURCE = "ishrs"

_TIER_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bfellow\b", re.IGNORECASE), "FISHRS"),
    (re.compile(r"\bassociate\s+member\b", re.IGNORECASE), "ISHRS Associate Member"),
    (re.compile(r"\bmember\b", re.IGNORECASE), "ISHRS Member"),
)

_ABHRS_PATTERN = re.compile(r"\bABHRS\b", re.IGNORECASE)
_ID_PATTERN = re.compile(r"/doctor/(\d+)")


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

    qualifications = _extract_qualifications(soup)
    if not qualifications:
        raise ScrapeError(f"ISHRS: no qualifications found on {url}")

    external_id = _extract_id(url)

    return ScrapedDoctor(
        source=SOURCE,
        source_url=url,
        external_id=external_id,
        full_name=name,
        qualifications=tuple(qualifications),
        scraped_at=datetime.now(UTC),
    )


def _extract_name(soup: BeautifulSoup) -> str:
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return _clean_name(h1.get_text(strip=True))

    title = soup.find("title")
    if title:
        text = title.get_text(strip=True)
        # ISHRS title is usually "Dr. Name | ISHRS"; strip the trailer.
        return _clean_name(text.split("|")[0].strip())

    return ""


def _clean_name(name: str) -> str:
    """Strip trailing credential suffixes appended by ISHRS h1.

    Example: "Emre Karadeniz, MD, FISHRS" → "Emre Karadeniz"
    """
    if "," in name:
        name = name.split(",")[0].strip()
    return name


def _extract_qualifications(soup: BeautifulSoup) -> list[str]:
    body_text = soup.get_text(" ", strip=True)
    found: list[str] = []

    for pattern, qualification in _TIER_PATTERNS:
        if pattern.search(body_text):
            found.append(qualification)
            break  # Only one ISHRS tier per doctor.

    if _ABHRS_PATTERN.search(body_text):
        found.append("ABHRS Diplomate")

    return found


def _extract_id(url: str) -> str:
    match = _ID_PATTERN.search(url)
    return match.group(1) if match else url
