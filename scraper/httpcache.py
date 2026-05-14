"""HTTP helper with simple on-disk cache and polite rate limiting.

The cache keys by URL+method+body hash. During development the scraper hits
the network once per request shape ever; subsequent runs (and tests) read
from the cache.

TPRECD's search is an ASP.NET POST whose body is huge (~230KB of viewstate),
so the cache key uses sha256(url + method + body) and the cache file is
the response text only.
"""

from __future__ import annotations

import hashlib
import time
from pathlib import Path
from typing import Mapping

import httpx

USER_AGENT = "UxlySeniorProject/1.0 (https://github.com/scottyUX/IstanbulMedic-Connect)"
REQUEST_TIMEOUT = 60.0
REQUEST_INTERVAL_SEC = 1.0

_CACHE_DIR = Path(__file__).parent / "cache"
_last_request_at: dict[str, float] = {}


class FetchError(Exception):
    pass


def fetch(url: str, *, use_cache: bool = True) -> str:
    """GET a URL with cache + 1s/host throttle. Retries once on connection / 5xx."""

    cache_path = _cache_path("GET", url, b"")
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


def post(
    url: str,
    data: Mapping[str, str],
    *,
    referer: str | None = None,
    use_cache: bool = True,
) -> str:
    """POST a form to a URL with cache + throttle. Body is form-urlencoded.

    Cache key includes the body, so different POSTs to the same URL cache
    independently. ASP.NET viewstate tokens change per page-load — when
    they rotate, the cached response for the old token still serves any
    test/repeat that posts that exact body.
    """
    body = urlencode_stable(data)
    cache_path = _cache_path("POST", url, body.encode("utf-8"))
    if use_cache and cache_path.exists():
        return cache_path.read_text(encoding="utf-8")

    _throttle(url)

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html",
        "Content-Type": "application/x-www-form-urlencoded",
    }
    if referer:
        headers["Referer"] = referer

    try:
        response = httpx.post(
            url,
            content=body,
            headers=headers,
            follow_redirects=True,
            timeout=REQUEST_TIMEOUT,
        )
    except httpx.TransportError as exc:
        _throttle(url)
        try:
            response = httpx.post(
                url,
                content=body,
                headers=headers,
                follow_redirects=True,
                timeout=REQUEST_TIMEOUT,
            )
        except httpx.TransportError as exc2:
            raise FetchError(f"transport error POSTing {url}: {exc2}") from exc

    if response.status_code != 200:
        raise FetchError(f"POST {url} returned HTTP {response.status_code}")

    if use_cache:
        cache_path.parent.mkdir(parents=True, exist_ok=True)
        cache_path.write_text(response.text, encoding="utf-8")

    return response.text


def urlencode_stable(data: Mapping[str, str]) -> str:
    """form-urlencode in deterministic key order so cache keys are stable."""
    import urllib.parse
    return urllib.parse.urlencode(sorted(data.items()))


def _cache_path(method: str, url: str, body: bytes) -> Path:
    digest = hashlib.sha256(method.encode() + b":" + url.encode("utf-8") + b":" + body).hexdigest()[:16]
    return _CACHE_DIR / f"{digest}.html"


def _throttle(url: str) -> None:
    host = httpx.URL(url).host
    last = _last_request_at.get(host, 0.0)
    elapsed = time.time() - last
    if elapsed < REQUEST_INTERVAL_SEC:
        time.sleep(REQUEST_INTERVAL_SEC - elapsed)
    _last_request_at[host] = time.time()
