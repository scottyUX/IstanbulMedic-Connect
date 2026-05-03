"""Name normalization shared by scrapers, matcher, and persistence.

The DB stores `name_normalized = lower(unaccent(name))`. We do the same in
Python so the scraper's lookup queries behave identically to the migration's
backfill.

We additionally strip a small set of honorifics ("Dr.", "Prof.", "Op. Dr.")
so a directory listing of "Dr. Ali Emre Karadeniz" matches a seed entry of
"Ali Emre Karadeniz" without having to negotiate the prefix at every site.
"""

import re

from unidecode import unidecode

_HONORIFIC_PATTERN = re.compile(
    r"^\s*(?:op\.?\s*dr\.?|prof\.?\s*dr\.?|prof\.?|assoc\.?\s*prof\.?|dr\.?|md\.?)\s+",
    re.IGNORECASE,
)

# Directories like ISHRS/IAHRS append credentials after a comma, e.g.
# "Emre Karadeniz, MD, FISHRS" — strip the comma and everything after it.
_TRAILING_CREDS_PATTERN = re.compile(r"\s*,.*$")


def normalize_name(name: str) -> str:
    """Lowercase, strip diacritics, strip leading honorifics and trailing
    credential suffixes, collapse whitespace.

    >>> normalize_name("  Hakan Doğanay ")
    'hakan doganay'
    >>> normalize_name("Dr. Ali Emre Karadeniz")
    'ali emre karadeniz'
    >>> normalize_name("Prof. Dr. Soner Tatlıdede")
    'soner tatlidede'
    >>> normalize_name("Emre Karadeniz, MD, FISHRS")
    'emre karadeniz'
    >>> normalize_name("Koray Erdogan, MD")
    'koray erdogan'
    """
    if not name:
        return ""
    stripped = _HONORIFIC_PATTERN.sub("", name)
    stripped = _TRAILING_CREDS_PATTERN.sub("", stripped)
    return " ".join(unidecode(stripped).lower().split())
