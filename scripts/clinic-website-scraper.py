"""
Hair Transplant Clinic Data Pipeline — Focused Edition
=======================================================
STEP 1 OF 2 in the clinic data pipeline.

What this does:
  Scrapes clinic websites and extracts structured data using a local LLM (Ollama/llama3).
  Extracts: techniques, services, pricing, doctors, certifications, descriptions, trust signals.
  Phone/email/social/reviews are intentionally omitted (sourced from Google separately).

Output:
  output/clinics.json  — structured data ready for push-clinics.py
  output/clinics.csv   — flat version for inspection

Usage:
  1. Make sure Ollama is running locally with llama3: ollama run llama3
  2. Edit TARGET_URLS at the top of this file to add/remove clinics
  3. Run: python clinic-website-scraper2.py
  4. Then push to Supabase: python push-clinics.py output/clinics.json

Requirements:
    pip install requests beautifulsoup4 pandas tqdm ollama
"""
import json
import time
import random
import logging
import re
import sys
import ollama
from dataclasses import dataclass, field, asdict
from urllib.parse import urljoin, urlparse
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup
from tqdm import tqdm

sys.stdout.reconfigure(encoding='utf-8')

# ── Config ────────────────────────────────────────────────────────────────────

TARGET_URLS = [
    "https://www.dentalhairclinicturkey.com/",
    "https://lenusclinic.com/",
    "https://drterziler.com/",
    "https://www.aekhairclinic.com/",
    "https://www.memorial.com.tr/en/hair-transplant-turkey",
    "https://www.estemedicalgroup.com/",
    "https://www.estenove.com/",
    "https://hermestclinic.com/",
    "https://www.dokuclinic.com/en",
    "https://asthetica.com/",
    "https://www.longevita.co.uk/",
    "https://hairtransplantist.com/",
    "https://www.drserkanaygin.com/",
    "https://www.veraclinic.net/",
    "https://www.cosmedica.com/",
    "https://www.smilehairclinic.com/",
    "https://www.hlcclinic.com/",
    "https://www.asmed.com/",
    "https://www.drpekiner.com/",
    "https://www.hermesthairclinic.com/",
    "https://www.drcinik.com/",
    "https://www.ahdclinic.com/",
    "https://www.clinicana.com/",
    "https://www.resul-yaman.com/",
    "https://www.estetikInternational.com/",
    "https://www.sapphirehairclinic.com/",
    "https://www.medicalhair.clinic/",
    "https://www.drthairclinic.com/",
    "https://www.estefavor.com/",
    "https://www.sulehairtransplant.com/",
]

OUTPUT_DIR      = Path("output")
DELAY_RANGE     = (1.5, 3.5)
TIMEOUT         = 20
OLLAMA_MODEL    = "llama3"
MAX_CHARS       = 4000
MAX_TOTAL_CHARS = 6000
MAX_SUBPAGES    = 6

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("pipeline.log", encoding="utf-8"),
    ],
)
log = logging.getLogger(__name__)

# ── Data Model ────────────────────────────────────────────────────────────────

@dataclass
class ClinicData:
    # Identity
    url: str = ""
    name: str = ""
    slug: str = ""

    # Location
    address: str = ""
    city: str = ""
    country: str = ""

    # Google placeholder (merge later)
    google_place_id: str = ""

    # Short description
    description: str = ""

    # Techniques & services
    techniques: list = field(default_factory=list)
    services: list = field(default_factory=list)
    body_areas: list = field(default_factory=list)
    languages_spoken: list = field(default_factory=list)

    # Pricing
    price_range_raw: str = ""
    price_per_graft_usd: float | None = None
    price_min_usd: float | None = None
    price_max_usd: float | None = None
    currency_noted: str = ""
    financing_available: bool = False

    # Medical team
    doctors: list = field(default_factory=list)
    certifications: list = field(default_factory=list)
    memberships: list = field(default_factory=list)
    accreditations: list = field(default_factory=list)

    # Trust signals
    years_experience: int | None = None
    years_established: int | None = None
    cases_performed: int | None = None
    success_rate_pct: float | None = None

    # Booking
    has_online_booking: bool = False
    offers_free_consultation: bool = False
    offers_virtual_consultation: bool = False
    booking_url: str = ""

    # Content flags
    has_before_after: bool = False

    # Pipeline meta
    scraped_at: str = ""
    pages_scraped: int = 0
    scrape_ok: bool = False
    error: str = ""

# ── Subpage Scoring ───────────────────────────────────────────────────────────

SUBPAGE_SCORES = {
    "pricing": 15, "cost": 15, "price": 15, "package": 14, "packages": 14,
    "fee": 12, "fees": 12, "tariff": 12, "rates": 11, "quote": 10,
    "doctor": 8, "surgeon": 8, "team": 8, "staff": 7, "specialist": 7,
    "fue": 7, "fut": 7, "dhi": 7, "technique": 6, "method": 6, "procedure": 6,
    "before": 6, "after": 6, "result": 6, "gallery": 5,
    "about": 5, "accreditation": 4, "certification": 4, "award": 4,
    "consultation": 4, "appointment": 4, "booking": 4,
    "service": 4, "treatment": 4, "hair-transplant": 6,
}

SKIP_EXTENSIONS = (
    ".pdf", ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".zip", ".mp4", ".mp3", ".webm", ".ico", ".woff", ".woff2"
)

# ── LLM Batches ───────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are a JSON data extraction API. You only output valid JSON. No explanations, no markdown, no code blocks. Only a flat JSON object with exactly the keys given."""

BATCH_PROMPTS = [
    ("basic", """From the website content below, extract ONLY these fields and return a flat JSON object:
{
  "name": "clinic name",
  "address": "street address",
  "city": "city name",
  "country": "country name",
  "has_online_booking": true or false,
  "offers_free_consultation": true or false,
  "offers_virtual_consultation": true or false,
  "booking_url": "URL to booking page or empty string"
}"""),
    ("techniques", """From the website content below, extract ONLY these fields and return a flat JSON object:
{
  "techniques": ["array of technique names e.g. FUE, DHI, FUT, Sapphire FUE"],
  "services": ["array of services e.g. beard transplant, eyebrow transplant, PRP"],
  "body_areas": ["array of body areas treated e.g. scalp, beard, eyebrow"],
  "languages_spoken": ["array of languages the clinic serves patients in"],
  "has_before_after": true or false
}"""),
    ("pricing", """From the website content below, extract pricing information and return a flat JSON object.

SEARCH FOR: any mention of cost, price, fee, package, graft, £, $, €, GBP, USD, EUR, TRY, lira.
Examples of what to look for:
  - "from £1,999" → price_min_usd (convert to USD: £1 ≈ $1.27)
  - "€2 per graft" → price_per_graft_usd (convert: €1 ≈ $1.09)
  - "packages from $1500 to $4000" → price_min_usd=1500, price_max_usd=4000
  - "2500 grafts for £2500" → compute per-graft cost
  - Prices in Turkish Lira (TRY): £1 ≈ 40 TRY, so divide by 40 then multiply by 1.27

RULES:
- price_range_raw: copy the EXACT pricing sentence(s) from the page verbatim. If none found, null.
- price_per_graft_usd: price per graft converted to USD as a number, or null
- price_min_usd: minimum package price in USD as a number, or null
- price_max_usd: maximum package price in USD as a number, or null
- currency_noted: the original currency symbol or code seen (e.g. "GBP", "EUR", "USD", "TRY")
- financing_available: true if installments, finance, payment plan mentioned

{
  "price_range_raw": null,
  "price_per_graft_usd": null,
  "price_min_usd": null,
  "price_max_usd": null,
  "currency_noted": null,
  "financing_available": false
}"""),
    ("description", """From the website content below, write a SHORT factual description of this hair transplant clinic.

Write 2-3 sentences (max 80 words) covering: location, main specialties/techniques, and any standout differentiators (e.g. lead surgeon's credentials, years of experience, package inclusions like hotel/transport, notable certifications).

Be factual and neutral. Do not invent anything not stated on the page.

Return ONLY this JSON object:
{
  "description": "2-3 sentence clinic summary here"
}"""),
    ("team", """From the website content below, extract ONLY these fields and return a flat JSON object.
IMPORTANT: For doctors, only include real human names that start with Dr., Prof., or a first+last name. Do NOT include clinic names, slogans, or page titles.
{
  "doctors": [],
  "certifications": [],
  "memberships": [],
  "accreditations": [],
  "years_experience": null,
  "years_established": null,
  "cases_performed": null,
  "success_rate_pct": null
}"""),
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def make_session() -> requests.Session:
    s = requests.Session()
    s.headers.update({
        "User-Agent": USER_AGENT,
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
        "Cache-Control": "max-age=0",
    })
    return s


def get_soup(url: str, session: requests.Session) -> BeautifulSoup | None:
    try:
        r = session.get(url, timeout=TIMEOUT)
        r.raise_for_status()
        r.encoding = r.apparent_encoding or "utf-8"
        return BeautifulSoup(r.content, "html.parser")
    except Exception as e:
        log.warning(f"Fetch failed {url}: {e}")
        return None


def polite_delay():
    time.sleep(random.uniform(*DELAY_RANGE))


def clean_text(soup: BeautifulSoup) -> str:
    for tag in soup(["script", "style", "noscript", "header", "footer",
                     "nav", "aside", "form", "iframe"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text[:MAX_CHARS]


def find_subpages(soup: BeautifulSoup, base_url: str) -> list[str]:
    base_netloc = urlparse(base_url).netloc
    scored: dict[str, int] = {}

    for a in soup.find_all("a", href=True):
        href = a["href"]
        full = urljoin(base_url, href)
        if urlparse(full).netloc != base_netloc:
            continue
        if any(full.lower().endswith(ext) for ext in SKIP_EXTENSIONS):
            continue
        if "wp-content" in full or "wp-json" in full:
            continue
        if full == base_url or full == base_url.rstrip("/"):
            continue

        path = urlparse(full).path.lower()
        link_text = a.get_text().lower()
        combined = path + " " + link_text

        score = sum(pts for kw, pts in SUBPAGE_SCORES.items() if kw in combined)
        if score > 0:
            scored[full] = max(scored.get(full, 0), score)

    ranked = sorted(scored.items(), key=lambda x: x[1], reverse=True)
    log.info(f"  Found {len(ranked)} relevant subpages")
    return [url for url, _ in ranked[:MAX_SUBPAGES]]

# ── Price Pre-Extraction ──────────────────────────────────────────────────────

# Matches things like: £1,999  $2.50/graft  €1500-€3000  2000 USD  from 1,500 GBP
_PRICE_RE = re.compile(
    r"""
    (?:from\s*)?                        # optional "from"
    ([\$£€₺]|\bUSD\b|\bGBP\b|\bEUR\b|\bTRY\b)  # currency symbol or code
    \s*
    ([\d,]+(?:\.\d{1,2})?)             # amount
    (?:\s*[-–to]+\s*[\$£€₺]?\s*([\d,]+(?:\.\d{1,2})?))?   # optional range end
    (?:\s*/\s*graft)?                   # optional "/graft"
    """,
    re.IGNORECASE | re.VERBOSE,
)

_CURRENCY_RATES_TO_USD = {
    "$": 1.0, "USD": 1.0,
    "£": 1.27, "GBP": 1.27,
    "€": 1.09, "EUR": 1.09,
    "₺": 0.031, "TRY": 0.031,
}


def _to_float(s: str) -> float | None:
    try:
        return float(s.replace(",", ""))
    except Exception:
        return None


def regex_extract_prices(pages_text: list[str]) -> dict:
    """Quick regex pass to pull price signals before the LLM runs."""
    combined = " ".join(pages_text)
    hits = _PRICE_RE.findall(combined)
    if not hits:
        return {}

    amounts_usd = []
    currency_seen = None
    raw_snippets = []

    for currency, amount_str, range_end_str in hits:
        rate = _CURRENCY_RATES_TO_USD.get(currency.upper(), 1.0)
        if not currency_seen:
            currency_seen = currency.upper()
        amt = _to_float(amount_str)
        if amt:
            amounts_usd.append(amt * rate)
            snippet = f"{currency}{amount_str}"
            if range_end_str:
                end = _to_float(range_end_str)
                if end:
                    amounts_usd.append(end * rate)
                    snippet += f"–{range_end_str}"
            raw_snippets.append(snippet)

    if not amounts_usd:
        return {}

    result: dict = {
        "price_range_raw": ", ".join(raw_snippets[:6]),
        "currency_noted": currency_seen,
    }
    if len(amounts_usd) == 1:
        result["price_min_usd"] = round(amounts_usd[0], 2)
    else:
        result["price_min_usd"] = round(min(amounts_usd), 2)
        result["price_max_usd"] = round(max(amounts_usd), 2)

    # Heuristic: if all values < 10, they're likely per-graft prices
    if all(v < 15 for v in amounts_usd):
        result["price_per_graft_usd"] = round(sum(amounts_usd) / len(amounts_usd), 2)

    log.info(f"  [regex-price] found: {result}")
    return result
# ── Core Scraper ──────────────────────────────────────────────────────────────

def extract_name_from_html(soup: BeautifulSoup) -> str:
    """Extract clinic name from HTML meta tags before the LLM runs."""
    # og:site_name is the most reliable — set intentionally by the site owner
    og = soup.find("meta", property="og:site_name")
    if og and og.get("content", "").strip():
        return og["content"].strip()

    # <title> tag — split on common separators and take the first part
    title = soup.find("title")
    if title and title.text.strip():
        name = re.split(r"[|\-–—]", title.text)[0].strip()
        # Reject if it looks like a page title rather than a clinic name
        if name and not any(kw in name.lower() for kw in [
            "hair transplant", "home", "welcome", "page", "index"
        ]):
            return name

    # h1 as last resort
    h1 = soup.find("h1")
    if h1 and h1.text.strip():
        return h1.text.strip()[:80]

    return ""


def merge_llm_result(data: ClinicData, result: dict):
    for key, val in result.items():
        if not hasattr(data, key) or val is None or val == "" or val == []:
            continue
        existing = getattr(data, key)
        # Never overwrite the name if we already got it from HTML
        if key == "name" and data.name:
            continue
        if existing in [None, "", [], False, 0]:
            try:
                setattr(data, key, val)
            except Exception:
                pass
    if data.name and not data.slug:
        data.slug = slugify(data.name)

def extract_with_llm(pages_text: list[str], url: str) -> dict:
    combined = "\n\n---PAGE BREAK---\n\n".join(pages_text)
    content = combined[:MAX_TOTAL_CHARS]
    merged = {}

    for batch_name, schema_prompt in BATCH_PROMPTS:
        prompt = f"""{schema_prompt}

Return ONLY the JSON object, nothing else. No explanation. No markdown.

Website: {url}

Content:
{content}

JSON output:"""

        try:
            response = ollama.chat(
                model=OLLAMA_MODEL,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user",   "content": prompt},
                ],
                options={"temperature": 0, "num_predict": 800, "num_ctx": 8192},
            )
            raw = response["message"]["content"].strip()
            log.info(f"  [{batch_name}] preview: {raw[:100]}")

            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw.strip())

            match = re.search(r"\{[^{}]*\}", raw, re.DOTALL)
            if match:
                parsed = json.loads(match.group(0))
                merged.update({k: v for k, v in parsed.items()
                                if v not in [None, "", [], {}]})
            else:
                log.warning(f"  [{batch_name}] No JSON object found")

        except json.JSONDecodeError as e:
            log.warning(f"  [{batch_name}] Invalid JSON: {e}")
        except Exception as e:
            log.warning(f"  [{batch_name}] LLM call failed: {e}")

    return merged

def scrape_clinic(url: str, session: requests.Session) -> ClinicData:
    data = ClinicData(url=url, scraped_at=datetime.now(timezone.utc).isoformat())
    log.info(f"Scraping: {url}")

    soup = get_soup(url, session)
    if not soup:
        data.error = "Failed to fetch homepage"
        return data

    pages_text = [clean_text(soup)]
    data.pages_scraped = 1

    # Extract name from HTML before LLM so it can't be overwritten
    data.name = extract_name_from_html(soup)
    if data.name:
        data.slug = slugify(data.name)
        log.info(f"  Name from HTML: {data.name}")

    for sp_url in find_subpages(soup, url):
        polite_delay()
        sp_soup = get_soup(sp_url, session)
        if sp_soup:
            pages_text.append(clean_text(sp_soup))
            data.pages_scraped += 1
            log.info(f"  + {sp_url}")

    total_chars = sum(len(p) for p in pages_text)
    log.info(f"  {data.pages_scraped} pages ({total_chars} chars) — sending to LLM...")
    log.info(f"  Content preview: {pages_text[0][:200]}")

    # Trim total
    trimmed, total = [], 0
    for p in pages_text:
        if total + len(p) > MAX_TOTAL_CHARS:
            rem = MAX_TOTAL_CHARS - total
            if rem > 500:
                trimmed.append(p[:rem])
            break
        trimmed.append(p)
        total += len(p)

    result = extract_with_llm(trimmed, url)

    # Seed with regex-extracted prices; LLM can refine but not erase regex hits
    regex_prices = regex_extract_prices(trimmed)
    for k, v in regex_prices.items():
        if k not in result or result[k] in [None, "", [], {}]:
            result[k] = v
    if result:
        merge_llm_result(data, result)
        data.scrape_ok = True
        log.info(f"  Done: {data.name or url} | {data.city or '?'} | graft=${data.price_per_graft_usd}")
    else:
        data.error = "LLM extraction failed"

    return data

# ── Pipeline & Output ─────────────────────────────────────────────────────────

def run_pipeline(urls: list[str]) -> list[ClinicData]:
    OUTPUT_DIR.mkdir(exist_ok=True)
    session = make_session()
    results: list[ClinicData] = []
    for url in tqdm(urls, desc="Scraping clinics"):
        results.append(scrape_clinic(url, session))
        polite_delay()
    return results


def save_results(results: list[ClinicData]):
    records = [asdict(r) for r in results]

    json_path = OUTPUT_DIR / "clinics.json"
    json_path.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info(f"Saved -> {json_path}")

    flat = []
    for r in records:
        row = {}
        for k, v in r.items():
            if isinstance(v, list):
                row[k] = " | ".join(str(x) for x in v)
            else:
                row[k] = v
        flat.append(row)

    csv_path = OUTPUT_DIR / "clinics.csv"
    pd.DataFrame(flat).to_csv(csv_path, index=False, encoding="utf-8")
    log.info(f"Saved -> {csv_path}")

    ok = [r for r in results if r.scrape_ok]
    print(f"\n-- Summary --")
    print(f"  Scraped      : {len(results)}  ok={len(ok)}  failed={len(results)-len(ok)}")
    if ok:
        prices = [r.price_per_graft_usd for r in ok if r.price_per_graft_usd]
        pages  = [r.pages_scraped for r in ok]
        if prices: print(f"  Avg $/graft  : ${sum(prices)/len(prices):.2f}")
        print(f"  Avg pages    : {sum(pages)/len(pages):.1f}")
        print(f"  Free consult : {sum(r.offers_free_consultation for r in ok)}")
        print(f"  Before/After : {sum(r.has_before_after for r in ok)}")
        print(f"  With pricing : {sum(bool(r.price_range_raw) for r in ok)}")


if __name__ == "__main__":
    results = run_pipeline(TARGET_URLS)
    save_results(results)