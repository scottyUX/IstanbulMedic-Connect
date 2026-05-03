"""HTTP helper with simple on-disk cache and polite rate limiting.

The cache keys by URL hash. During development the scraper hits the network
once per URL ever; subsequent runs (and tests) read from the cache or the
fixture file passed into `scrape()`.
"""

from __future__ import annotations

import hashlib
import time
from pathlib import Path

import httpx

USER_AGENT = "UxlySeniorProject/1.0 (https://github.com/scottyUX/IstanbulMedic-Connect)"
REQUEST_TIMEOUT = 20.0
REQUEST_INTERVAL_SEC = 1.0

_CACHE_DIR = Path(__file__).parent / "cache"
_last_request_at: dict[str, float] = {}


class FetchError(Exception):
    pass


def fetch(url: str, *, use_cache: bool = True) -> str:
    """Fetch a URL with cache + 1s/host throttle. Retries once on connection / 5xx."""

    cache_path = _cache_path(url)
    if use_cache and cache_path.exists():
        return cache_path.read_text(encoding="utf-8")

    _throttle(url)

    try:
        response = httpx.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
            follow_redirects=True,
            timeout=REQUEST_TIMEOUT,
        )
    except httpx.TransportError as exc:
        # One retry, then fail loudly.
        _throttle(url)
        try:
            response = httpx.get(
                url,
                headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
                follow_redirects=True,
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TransportError as exc2:
            raise FetchError(f"transport error fetching {url}: {exc2}") from exc

    if response.status_code >= 500:
        _throttle(url)
        response = httpx.get(
            url,
            headers={"User-Agent": USER_AGENT, "Accept": "text/html"},
            follow_redirects=True,
            timeout=REQUEST_TIMEOUT,
        )

    if response.status_code != 200:
        raise FetchError(f"{url} returned HTTP {response.status_code}")

    if use_cache:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(response.text, encoding="utf-8")

    return response.text


def _cache_path(url: str) -> Path:
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]
    return _CACHE_DIR / f"{digest}.html"


def _throttle(url: str) -> None:
    host = httpx.URL(url).host
    last = _last_request_at.get(host, 0.0)
    elapsed = time.time() - last
    if elapsed < REQUEST_INTERVAL_SEC:
        time.sleep(REQUEST_INTERVAL_SEC - elapsed)
    _last_request_at[host] = time.time()
