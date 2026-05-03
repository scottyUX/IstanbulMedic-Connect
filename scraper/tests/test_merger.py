from datetime import UTC, datetime

import pytest

from scraper.merger import canonicalize, merge
from scraper.types import ScrapedDoctor, SeedEntry


def _scraped(source: str, name: str, quals: tuple[str, ...]) -> ScrapedDoctor:
    return ScrapedDoctor(
        source=source,
        source_url=f"https://{source}.example/profile",
        external_id="x",
        full_name=name,
        qualifications=quals,
        scraped_at=datetime.now(UTC),
    )


def test_canonicalize_collapses_synonyms():
    assert canonicalize("Fellow of ISHRS") == "FISHRS"
    assert canonicalize("FISHRS") == "FISHRS"
    assert canonicalize("ABHRS") == "ABHRS Diplomate"
    assert canonicalize("ABHRS Diplomate") == "ABHRS Diplomate"


def test_canonicalize_passthrough_for_unknown():
    assert canonicalize("Some Brand New Society") == "Some Brand New Society"


def test_merge_combines_two_sources():
    seed = SeedEntry(
        clinic_id="11111111-1111-1111-1111-111111111111",
        expected_name="Koray Erdogan",
        ishrs_url="https://ishrs.org/doctor/1/",
        iahrs_url="https://iahrs.org/x",
    )
    scrapes = [
        _scraped("ishrs", "Koray Erdogan", ("FISHRS",)),
        _scraped("iahrs", "Koray Erdogan", ("IAHRS Member", "ISHRS Member")),
    ]
    merged = merge(seed, scrapes)
    assert merged.clinic_id == seed.clinic_id
    assert merged.full_name == "Koray Erdogan"
    assert merged.external_ids == {"ishrs_id": "x", "iahrs_id": "x"}

    # Three rows, each with the source it came from.
    quals = sorted((q, s) for q, s, _ in merged.qualifications)
    assert quals == [
        ("FISHRS", "ishrs"),
        ("IAHRS Member", "iahrs"),
        ("ISHRS Member", "iahrs"),
    ]


def test_merge_canonicalizes_synonyms_into_single_row_per_source():
    # Two scrapers for the same source returning "Fellow of ISHRS" and "FISHRS"
    # would dedup (key = canonical + source). Within one scrape result with
    # the same canonical form twice, only one row should exist per source.
    seed = SeedEntry(clinic_id="x", expected_name="Test")
    scrapes = [
        _scraped("ishrs", "Test", ("Fellow of ISHRS", "FISHRS")),
    ]
    merged = merge(seed, scrapes)
    quals = [q for q, _, _ in merged.qualifications]
    assert quals == ["FISHRS"]


def test_merge_prefers_longer_name():
    seed = SeedEntry(clinic_id="x", expected_name="Karadeniz")
    scrapes = [
        _scraped("ishrs", "Ali Emre Karadeniz", ("FISHRS",)),
        _scraped("iahrs", "Ali Karadeniz", ("IAHRS Member",)),
    ]
    merged = merge(seed, scrapes)
    assert merged.full_name == "Ali Emre Karadeniz"


def test_merge_with_no_scrapes_raises():
    with pytest.raises(ValueError):
        merge(SeedEntry(clinic_id="x", expected_name="Test"), [])
