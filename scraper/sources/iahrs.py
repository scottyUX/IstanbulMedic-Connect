"""IAHRS doctor profile scraper.

Profile URLs look like `https://www.iahrs.org/hair-transplant/<name-slug>`.

Heuristics:
  * Name: first <h1>; if that fails, the <title> with a trailing site name
    stripped off.
  * IAHRS membership itself becomes a qualification: "IAHRS Member" — listing
    on iahrs.org implies vetted membership.
  * Bio text scanned for additional hints: ISHRS, FUE Europe, ABHRS, ISAPS.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from bs4 import BeautifulSoup

from scraper.httpcache import FetchError, fetch
from scraper.types import ScrapedDoctor, ScrapeError

SOURCE = "iahrs"

_BIO_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bABHRS\b", re.IGNORECASE), "ABHRS Diplomate"),
    (re.compile(r"\bFUE\s+Europe\b", re.IGNORECASE), "FUE Europe Member"),
    (re.compile(r"\bISAPS\b", re.IGNORECASE), "ISAPS Member"),
    (re.compile(r"\bISHRS\b", re.IGNORECASE), "ISHRS Member"),
)

_SLUG_PATTERN = re.compile(r"/hair-transplant/([a-z0-9\-]+)")


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

    qualifications = _extract_qualifications(soup)
    if not qualifications:
        raise ScrapeError(f"IAHRS: no qualifications found on {url}")

    external_id = _extract_slug(url)

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
        return _clean_name(title.get_text(strip=True).split("|")[0])

    return ""


def _extract_qualifications(soup: BeautifulSoup) -> list[str]:
    body_text = soup.get_text(" ", strip=True)
    qualifications = ["IAHRS Member"]
    seen = {"IAHRS Member"}

    for pattern, qualification in _BIO_PATTERNS:
        if pattern.search(body_text) and qualification not in seen:
            qualifications.append(qualification)
            seen.add(qualification)

    return qualifications


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
    # Strip trailing ", MD" / ", MD, FISHRS" etc.
    if "," in name:
        name = name.split(",")[0].strip()
    return name
