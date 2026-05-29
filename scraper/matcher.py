"""Identity matching across scraped sources.

For the seed-driven flow, the matcher's primary job is the
`expected_name` sanity check — every scraped record must agree with the
seed's expected name (after normalization). If a URL has been redirected
or reassigned, the scrape returns a different doctor and we refuse to
write to `clinic_team`.

The fuzzy match path exists so future seed expansion can declare only one
URL per source (rather than pairs) and still merge them. It's not used by
the demo's 8-doctor seed list.
"""

from __future__ import annotations

from rapidfuzz import fuzz

from scraper.normalize import normalize_name
from scraper.types import ScrapedDoctor

# Calibrated against real cases:
#   "Hakan Doganay"  vs "Hakan Doğanay"           -> 100 (normalized equality)
#   "Resul Yaman"    vs "Resul Yamen"             -> ~91 (single-char typo) — match
#   "Ali Karadeniz"  vs "Ali Emre Karadeniz"      -> ~72 (added middle name) — reject
# 88 is the lowest threshold that lets typos through without auto-merging different people.
MATCH_THRESHOLD = 88


def names_match(a: str, b: str) -> bool:
    """True when normalized forms of a and b are similar enough to be the same person."""
    if not a or not b:
        return False
    na = normalize_name(a)
    nb = normalize_name(b)
    if na == nb:
        return True
    return fuzz.ratio(na, nb) >= MATCH_THRESHOLD


def expected_name_matches(scraped: ScrapedDoctor, expected: str) -> bool:
    """Sanity check: did the scraped page belong to the expected doctor?

    Used as the seed-list defense against a wrong URL writing into the
    wrong clinic_team row.
    """
    return names_match(scraped.full_name, expected)
