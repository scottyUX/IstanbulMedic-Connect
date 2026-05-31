"""TPRECD (Turkish Plastic, Reconstructive and Aesthetic Surgery Society) lookup.

Two entry points:

  * search(name) — primary entry point used by the clinic_team-driven runner.
    Looks the doctor up by last name on the doktor-arama search form, picks
    the best match from the results page, returns a RegistryHit or None.

  * scrape(url, html=None) — legacy URL-driven entry point used by the
    seed pipeline.

Implementation note: TPRECD's doctor search is an ASP.NET WebForms POST
that requires the page's __VIEWSTATE / __VIEWSTATEGENERATOR tokens be
echoed back. The form has separate first-name (Adı) and last-name (Soyadı)
fields; we POST only the last name because the first-name field is brittle
(many doctors are listed with honorifics or compound first names that
don't round-trip), and last-name uniqueness narrows the result set
enough for in-Python disambiguation.

Profile URLs look like
`https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/<numeric-id>`.

Registry presence IS the credential — exactly one row per match.
"""

from __future__ import annotations

import re
from datetime import UTC, datetime

from bs4 import BeautifulSoup

from scraper.httpcache import FetchError, fetch, post
from scraper.matcher import names_match
from scraper.normalize import normalize_name
from scraper.persistence import RegistryHit
from scraper.types import ScrapedDoctor, ScrapeError

SOURCE = "tprecd"
QUALIFICATION = "TPRECD member (Turkish board-certified plastic surgeon)"

SEARCH_URL = "https://www.plastikcerrahi.org.tr/doktor-arama/"
PROFILE_URL_PREFIX = "https://www.plastikcerrahi.org.tr"

_ID_PATTERN = re.compile(r"/Doktor-Bilgileri/(\d+)", re.IGNORECASE)
_NAME_SPAN_ID = "ContentPlaceHolder1_Content3_Label1"

# ASP.NET form field names — mirroring what the live form posts back.
_FIELD_VIEWSTATE = "__VIEWSTATE"
_FIELD_VIEWSTATE_GEN = "__VIEWSTATEGENERATOR"
_FIELD_EVENT_VALIDATION = "__EVENTVALIDATION"
_FIELD_FIRST_NAME = "ctl00$ctl00$ContentPlaceHolder1$Content3$TextBox1"  # Adı
_FIELD_LAST_NAME = "ctl00$ctl00$ContentPlaceHolder1$Content3$TextBox2"   # Soyadı
_FIELD_CITY = "ctl00$ctl00$ContentPlaceHolder1$Content3$member_work_city"
_FIELD_COUNTY = "ctl00$ctl00$ContentPlaceHolder1$Content3$member_work_county"
_FIELD_SUBMIT = "ctl00$ctl00$ContentPlaceHolder1$Content3$Button1"


def search(name: str) -> RegistryHit | None:
    """Look up a doctor by name on the TPRECD doktor-arama search.

    POSTs the doctor's last name as Soyadı, parses the results page, picks
    the best name match. Returns a RegistryHit on a hit or None.

    Last-name-only search is deliberate: the form's first-name field is
    brittle (honorifics, compound names), and last names alone narrow the
    Turkish national plastic-surgeon list enough that in-Python
    disambiguation is reliable.
    """
    if not name or not name.strip():
        return None

    last_name = _split_last_name(name)
    if not last_name:
        return None

    try:
        form_html = fetch(SEARCH_URL)
    except FetchError as exc:
        raise ScrapeError(f"TPRECD: cannot load search form: {exc}") from exc

    tokens = _extract_aspnet_tokens(form_html)

    payload = {
        _FIELD_VIEWSTATE: tokens["viewstate"],
        _FIELD_VIEWSTATE_GEN: tokens["viewstate_generator"],
        _FIELD_EVENT_VALIDATION: tokens.get("event_validation", ""),
        _FIELD_FIRST_NAME: "",
        _FIELD_LAST_NAME: last_name,
        _FIELD_CITY: "",
        _FIELD_COUNTY: "",
        _FIELD_SUBMIT: "Ara",
    }

    try:
        results_html = post(SEARCH_URL, payload, referer=SEARCH_URL)
    except FetchError as exc:
        raise ScrapeError(f"TPRECD: search POST failed: {exc}") from exc

    candidates = _parse_results(results_html)
    if not candidates:
        return None

    target = normalize_name(name)

    exact = [c for c in candidates if normalize_name(c["full_name"]) == target]
    if exact:
        chosen = min(exact, key=lambda c: int(c.get("doctor_id") or "9999999"))
    else:
        fuzzy = [c for c in candidates if names_match(c["full_name"], name)]
        if not fuzzy:
            return None
        chosen = min(fuzzy, key=lambda c: int(c.get("doctor_id") or "9999999"))

    return RegistryHit(
        source=SOURCE,
        qualification=QUALIFICATION,
        source_url=chosen["profile"],
    )


def _split_last_name(name: str) -> str:
    """Last whitespace-separated token, after stripping honorifics."""
    cleaned = name.strip()
    # The normalize_name path strips honorifics for matching, but here we
    # only need a posted last name. Reuse the same regex by going through
    # normalize_name then back-walking is wasteful — just split on whitespace.
    # Strip a few common Turkish/English honorifics manually so "Dr. Hakan
    # Doğanay" yields "Doğanay" (rather than the punctuation-prefixed first
    # token).
    for prefix in ("Op. Dr.", "Op.Dr.", "Prof. Dr.", "Prof.Dr.", "Doç. Dr.",
                   "Uzm. Dr.", "Dr.", "MD."):
        if cleaned.lower().startswith(prefix.lower()):
            cleaned = cleaned[len(prefix):].strip()
            break
    parts = cleaned.split()
    return parts[-1] if parts else ""


def _extract_aspnet_tokens(html: str) -> dict[str, str]:
    soup = BeautifulSoup(html, "html.parser")
    out: dict[str, str] = {}
    for field, key in [
        (_FIELD_VIEWSTATE, "viewstate"),
        (_FIELD_VIEWSTATE_GEN, "viewstate_generator"),
        (_FIELD_EVENT_VALIDATION, "event_validation"),
    ]:
        el = soup.find("input", {"name": field})
        out[key] = el["value"] if el and el.get("value") else ""
    if not out["viewstate"] or not out["viewstate_generator"]:
        raise ScrapeError("TPRECD: __VIEWSTATE / __VIEWSTATEGENERATOR not found on search form")
    return out


def _parse_results(html: str) -> list[dict[str, str]]:
    """Extract one candidate per /Doktor-Bilgileri/<id> link in a results page.

    Each result row exposes the doctor's name as the anchor text and an
    optional workplace cell next to it. We dedupe by doctor_id (TPRECD
    renders the same row twice — name link and 'Özel muayenehane' link
    both point to the same profile).
    """
    soup = BeautifulSoup(html, "html.parser")
    by_id: dict[str, dict[str, str]] = {}
    for anchor in soup.find_all("a", href=True):
        match = _ID_PATTERN.search(anchor["href"])
        if not match:
            continue
        doctor_id = match.group(1)
        text = anchor.get_text(strip=True)
        if not text:
            continue
        if by_id.get(doctor_id):
            # Prefer the anchor whose text actually looks like a name —
            # if either anchor's text matches a /\b[A-ZÇĞİÖŞÜ][\w]+/
            # name-shaped pattern, keep that. Otherwise leave the existing.
            existing = by_id[doctor_id]
            if _looks_like_name(text) and not _looks_like_name(existing["full_name"]):
                by_id[doctor_id] = {
                    "doctor_id": doctor_id,
                    "full_name": _clean_name(text),
                    "profile": _absolute_profile(anchor["href"]),
                }
            continue
        by_id[doctor_id] = {
            "doctor_id": doctor_id,
            "full_name": _clean_name(text),
            "profile": _absolute_profile(anchor["href"]),
        }
    return list(by_id.values())


def _looks_like_name(text: str) -> bool:
    """Heuristic: Turkish-style names are >=2 tokens of letters."""
    parts = [p for p in text.split() if any(c.isalpha() for c in p)]
    return len(parts) >= 2


def _absolute_profile(href: str) -> str:
    if href.startswith("http"):
        return href
    if href.startswith("/"):
        return f"{PROFILE_URL_PREFIX}{href}"
    return f"{PROFILE_URL_PREFIX}/{href}"
_TITLE_PREFIXES = (
    "prof. dr.",
    "doç. dr.",
    "doc. dr.",
    "op. dr.",
    "uzm. dr.",
    "dr.",
    "prof.",
    "doç.",
    "doc.",
    "op.",
    "uzm.",
)


def scrape(url: str, html: str | None = None) -> ScrapedDoctor:
    if html is None:
        try:
            html = fetch(url)
        except FetchError as exc:
            raise ScrapeError(str(exc)) from exc

    soup = BeautifulSoup(html, "html.parser")

    name = _extract_name(soup)
    if not name:
        raise ScrapeError(f"TPRECD: no name found on {url}")

    return ScrapedDoctor(
        source=SOURCE,
        source_url=url,
        external_id=_extract_id(url),
        full_name=name,
        qualifications=(QUALIFICATION,),
        scraped_at=datetime.now(UTC),
    )


def _extract_name(soup: BeautifulSoup) -> str:
    # Primary: the ASP.NET label span that TPRECD renders the doctor's
    # full name into. Always uppercase Turkish on the live site.
    span = soup.find("span", id=_NAME_SPAN_ID)
    if span and span.get_text(strip=True):
        return _clean_name(span.get_text(strip=True))

    # Fallback: <h1>, then <title>. Used by older fixtures and by any future
    # template redesign.
    h1 = soup.find("h1")
    if h1 and h1.get_text(strip=True):
        return _clean_name(h1.get_text(strip=True))

    title = soup.find("title")
    if title:
        text = title.get_text(strip=True)
        return _clean_name(text.split("|")[0].strip())

    return ""


def _clean_name(name: str) -> str:
    """Strip Turkish honorifics and case-normalize a TPRECD-rendered name.

    The site renders names in ALL CAPS ("ALİ EMRE KARADENİZ"); the seed-flow
    matcher normalizes case anyway, but we title-case here so the value
    stored in clinic_team.name displays naturally.
    """
    cleaned = name.strip()
    if "," in cleaned:
        cleaned = cleaned.split(",")[0].strip()

    # Strip leading honorifics. Compare case-insensitively because the
    # source HTML may be uppercase, lowercase, or title case.
    lowered = cleaned.lower()
    for prefix in _TITLE_PREFIXES:
        if lowered.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip()
            lowered = cleaned.lower()

    # Title-case ONLY when the input was all-caps. Otherwise leave the
    # casing the page chose, which preserves diacritics like "Doğanay"
    # rather than re-titling and risking "Doğanay" → "Doğanay" issues.
    if cleaned and cleaned == cleaned.upper():
        cleaned = _title_case_turkish(cleaned)

    return cleaned


_TR_LOWERCASE = str.maketrans({
    "İ": "i",
    "I": "ı",
    "Ş": "ş",
    "Ğ": "ğ",
    "Ü": "ü",
    "Ö": "ö",
    "Ç": "ç",
})


def _title_case_turkish(name: str) -> str:
    """Title-case a Turkish all-caps name, preserving diacritics.

    Python's str.title() decomposes İ into i + combining dot. We translate
    Turkish capitals to their proper lowercase first, then lowercase the
    rest (ASCII), then capitalize each word — yielding "ALİ EMRE KARADENİZ"
    -> "Ali Emre Karadeniz" and "HAKAN DOĞANAY" -> "Hakan Doğanay".
    """
    lowered = name.translate(_TR_LOWERCASE).lower()
    return " ".join(part.capitalize() for part in lowered.split())


def _extract_id(url: str) -> str:
    match = _ID_PATTERN.search(url)
    return match.group(1) if match else url
