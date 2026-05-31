"""Tests for the name-based search() functions on each registry scraper.

Uses captured HTML/JSON fixtures from `fixtures/search/` and monkeypatches
the httpcache.fetch / httpcache.post calls so no network traffic happens.
"""

from __future__ import annotations

from pathlib import Path

import pytest

from scraper.sources import iahrs, ishrs, tprecd

FIXTURES = Path(__file__).parent / "fixtures" / "search"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def _reset_caches() -> None:
    """The directory-cache trick uses a module-level mutable default — clear
    each scraper's cache between tests so fixtures don't leak."""
    ishrs._load_turkey_doctors.__defaults__[0].clear()  # type: ignore[union-attr]
    iahrs._load_turkey_doctors.__defaults__[0].clear()  # type: ignore[union-attr]


@pytest.fixture(autouse=True)
def reset_caches():
    _reset_caches()
    yield
    _reset_caches()


# ─────────────────────────────────────────────────────────────────────────────
# ISHRS
# ─────────────────────────────────────────────────────────────────────────────

class _IshrsStub:
    def __init__(self):
        self.urls: list[str] = []

    def fetch(self, url, *, use_cache=True):
        self.urls.append(url)
        if "find-a-doctor" in url:
            return _load("ishrs_find_a_doctor_page.html")
        if "admin-ajax.php" in url:
            return _load("ishrs_table_data.json")
        raise AssertionError(f"unexpected fetch: {url}")


def test_ishrs_search_returns_hit_for_known_turkey_doctor(monkeypatch):
    stub = _IshrsStub()
    monkeypatch.setattr(ishrs, "fetch", stub.fetch)

    hit = ishrs.search("Emre Karadeniz")
    assert hit is not None
    assert hit.source == "ishrs"
    assert hit.qualification == "ISHRS member"
    assert hit.source_url == "https://ishrs.org/doctor/50809"
    # Find-a-doctor + ajax — exactly two GETs to bootstrap the cache.
    assert len(stub.urls) == 2


def test_ishrs_search_returns_none_for_unknown_name(monkeypatch):
    stub = _IshrsStub()
    monkeypatch.setattr(ishrs, "fetch", stub.fetch)

    assert ishrs.search("Zzzz Nonexistent") is None


def test_ishrs_search_returns_none_for_doctor_outside_turkey(monkeypatch):
    """A doctor in the US directory must not match — Turkey-only filter."""
    stub = _IshrsStub()
    monkeypatch.setattr(ishrs, "fetch", stub.fetch)

    assert ishrs.search("Arika Bansal") is None


def test_ishrs_search_handles_diacritic_difference(monkeypatch):
    """Database name might be `Hakan Doğanay`; ISHRS may store it as `Hakan Doganay`."""
    stub = _IshrsStub()
    monkeypatch.setattr(ishrs, "fetch", stub.fetch)

    # Hakan Doganay isn't actually in the ISHRS Turkey list at fixture time —
    # this test confirms the search still returns None gracefully when there's
    # a similar but absent name. (`Ozgur Oztan` IS in the fixture.)
    assert ishrs.search("Hakan Doğanay") is None
    assert ishrs.search("Özgür Öztan") is not None  # diacritics in query, ASCII in fixture


def test_ishrs_search_blank_name_is_safe(monkeypatch):
    monkeypatch.setattr(ishrs, "fetch", lambda *a, **k: pytest.fail("fetch should not be called"))
    assert ishrs.search("") is None
    assert ishrs.search("   ") is None


def test_ishrs_search_caches_directory_across_calls(monkeypatch):
    stub = _IshrsStub()
    monkeypatch.setattr(ishrs, "fetch", stub.fetch)

    ishrs.search("Emre Karadeniz")
    ishrs.search("Ozgur Oztan")
    ishrs.search("Kaan Pekiner")
    # Bootstrap = 2 GETs, then everything else is cache hits.
    assert len(stub.urls) == 2


# ─────────────────────────────────────────────────────────────────────────────
# IAHRS
# ─────────────────────────────────────────────────────────────────────────────

class _IahrsStub:
    def __init__(self):
        self.urls: list[str] = []

    def fetch(self, url, *, use_cache=True):
        self.urls.append(url)
        if "/hair-transplant/turkey" in url:
            return _load("iahrs_turkey_page.html")
        raise AssertionError(f"unexpected fetch: {url}")


def test_iahrs_search_returns_hit_for_known_doctor(monkeypatch):
    stub = _IahrsStub()
    monkeypatch.setattr(iahrs, "fetch", stub.fetch)

    hit = iahrs.search("Koray Erdogan")
    assert hit is not None
    assert hit.source == "iahrs"
    assert hit.qualification == "IAHRS member"
    assert hit.source_url == "https://www.iahrs.org/hair-transplant/koray-erdogan"


def test_iahrs_search_handles_diacritic_difference(monkeypatch):
    """The Turkey page lists `Hakan Doganay` (ASCII); db name has the diacritic."""
    stub = _IahrsStub()
    monkeypatch.setattr(iahrs, "fetch", stub.fetch)

    hit = iahrs.search("Hakan Doğanay")
    assert hit is not None
    assert hit.source_url == "https://www.iahrs.org/hair-transplant/hakan-doganay"


def test_iahrs_search_returns_none_for_unknown_name(monkeypatch):
    stub = _IahrsStub()
    monkeypatch.setattr(iahrs, "fetch", stub.fetch)

    assert iahrs.search("Servet Terziler") is None


def test_iahrs_search_skips_country_link(monkeypatch):
    """The Turkey page itself contains href=/hair-transplant/turkey — must not
    be treated as a doctor profile."""
    stub = _IahrsStub()
    monkeypatch.setattr(iahrs, "fetch", stub.fetch)

    assert iahrs.search("Turkey") is None


def test_iahrs_search_caches_turkey_page(monkeypatch):
    stub = _IahrsStub()
    monkeypatch.setattr(iahrs, "fetch", stub.fetch)

    iahrs.search("Koray Erdogan")
    iahrs.search("Hakan Doğanay")
    iahrs.search("Resul Yaman")
    assert len(stub.urls) == 1


# ─────────────────────────────────────────────────────────────────────────────
# TPRECD
# ─────────────────────────────────────────────────────────────────────────────

class _TprecdStub:
    def __init__(self):
        self.fetched: list[str] = []
        self.posted: list[tuple[str, dict]] = []
        self.results_by_lastname: dict[str, str] = {
            "Karadeniz": _load("tprecd_results_karadeniz.html"),
            "Yılmaz": _load("tprecd_results_yilmaz.html"),
            "Yilmaz": _load("tprecd_results_yilmaz.html"),
            "Zzzznonexistent": _load("tprecd_results_noresult.html"),
        }

    def fetch(self, url, *, use_cache=True):
        self.fetched.append(url)
        if url == tprecd.SEARCH_URL:
            return _load("tprecd_doktor_arama_form.html")
        raise AssertionError(f"unexpected GET: {url}")

    def post(self, url, data, *, referer=None, use_cache=True):
        self.posted.append((url, dict(data)))
        last_name = data.get("ctl00$ctl00$ContentPlaceHolder1$Content3$TextBox2", "")
        return self.results_by_lastname.get(last_name, _load("tprecd_results_noresult.html"))


def test_tprecd_search_returns_hit_for_exact_name(monkeypatch):
    stub = _TprecdStub()
    monkeypatch.setattr(tprecd, "fetch", stub.fetch)
    monkeypatch.setattr(tprecd, "post", stub.post)

    hit = tprecd.search("Ali Emre Karadeniz")
    assert hit is not None
    assert hit.source == "tprecd"
    assert hit.qualification == "TPRECD member (Turkish board-certified plastic surgeon)"
    assert hit.source_url == "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47"


def test_tprecd_search_returns_none_for_no_result(monkeypatch):
    stub = _TprecdStub()
    monkeypatch.setattr(tprecd, "fetch", stub.fetch)
    monkeypatch.setattr(tprecd, "post", stub.post)

    assert tprecd.search("Foo Zzzznonexistent") is None


def test_tprecd_search_picks_exact_match_when_multiple_share_lastname(monkeypatch):
    """Searching for `Sevim Yılmaz` against the live Yılmaz fixture must return
    None — there is no `Sevim Yılmaz` in TPRECD even though dozens of other
    Yılmaz entries are returned."""
    stub = _TprecdStub()
    monkeypatch.setattr(tprecd, "fetch", stub.fetch)
    monkeypatch.setattr(tprecd, "post", stub.post)

    assert tprecd.search("Sevim Yılmaz") is None


def test_tprecd_search_strips_honorific_for_last_name_extraction(monkeypatch):
    stub = _TprecdStub()
    monkeypatch.setattr(tprecd, "fetch", stub.fetch)
    monkeypatch.setattr(tprecd, "post", stub.post)

    tprecd.search("Op. Dr. Ali Emre Karadeniz")
    posted_payload = stub.posted[-1][1]
    assert posted_payload["ctl00$ctl00$ContentPlaceHolder1$Content3$TextBox2"] == "Karadeniz"


def test_tprecd_search_handles_known_clinic_doctor_among_many_yilmaz(monkeypatch):
    """When TPRECD returns 40+ Yılmaz entries, normalized exact match
    selects the right one. `Elif Yılmaz` is in the fixture."""
    stub = _TprecdStub()
    monkeypatch.setattr(tprecd, "fetch", stub.fetch)
    monkeypatch.setattr(tprecd, "post", stub.post)

    hit = tprecd.search("Elif Yılmaz")
    assert hit is not None
    assert hit.source_url == "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/217"


def test_tprecd_search_blank_name_does_not_post(monkeypatch):
    posted: list = []
    monkeypatch.setattr(tprecd, "fetch", lambda *a, **k: pytest.fail("no GET"))
    monkeypatch.setattr(tprecd, "post", lambda *a, **k: posted.append(a))

    assert tprecd.search("") is None
    assert tprecd.search("   ") is None
    assert posted == []
