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


def test_canonicalize_normalizes_case_for_known_qualifications():
    assert canonicalize("ISHRS member") == "ISHRS member"
    assert canonicalize("IAHRS Member") == "IAHRS member"
    assert (
        canonicalize("TPRECD member (Turkish board-certified plastic surgeon)")
        == "TPRECD member (Turkish board-certified plastic surgeon)"
    )


def test_canonicalize_passthrough_for_unknown():
    assert canonicalize("Some Brand New Society") == "Some Brand New Society"


def test_merge_combines_two_sources_one_row_each():
    seed = SeedEntry(
        clinic_id="11111111-1111-1111-1111-111111111111",
        expected_name="Koray Erdogan",
        ishrs_url="https://ishrs.org/doctor/1/",
        iahrs_url="https://iahrs.org/x",
    )
    scrapes = [
        _scraped("ishrs", "Koray Erdogan", ("ISHRS member",)),
        _scraped("iahrs", "Koray Erdogan", ("IAHRS member",)),
    ]
    merged = merge(seed, scrapes)
    assert merged.clinic_id == seed.clinic_id
    assert merged.full_name == "Koray Erdogan"
    assert merged.external_ids == {"ishrs_id": "x", "iahrs_id": "x"}

    quals = sorted((q, s) for q, s, _ in merged.qualifications)
    assert quals == [
        ("IAHRS member", "iahrs"),
        ("ISHRS member", "ishrs"),
    ]


def test_merge_dedupes_same_canonical_within_one_source():
    # Defensive: even if a scraper accidentally emits the same canonical
    # twice, the merger collapses it to a single row.
    seed = SeedEntry(clinic_id="x", expected_name="Test")
    scrapes = [
        _scraped("ishrs", "Test", ("ISHRS member", "ishrs member")),
    ]
    merged = merge(seed, scrapes)
    quals = [q for q, _, _ in merged.qualifications]
    assert quals == ["ISHRS member"]


def test_merge_prefers_longer_name():
    seed = SeedEntry(clinic_id="x", expected_name="Karadeniz")
    scrapes = [
        _scraped("ishrs", "Ali Emre Karadeniz", ("ISHRS member",)),
        _scraped("iahrs", "Ali Karadeniz", ("IAHRS member",)),
    ]
    merged = merge(seed, scrapes)
    assert merged.full_name == "Ali Emre Karadeniz"


def test_merge_tprecd_source_passes_through():
    seed = SeedEntry(clinic_id="x", expected_name="Test")
    scrapes = [
        _scraped(
            "tprecd",
            "Test",
            ("TPRECD member (Turkish board-certified plastic surgeon)",),
        ),
    ]
    merged = merge(seed, scrapes)
    assert len(merged.qualifications) == 1
    q, s, _ = merged.qualifications[0]
    assert s == "tprecd"
    assert q == "TPRECD member (Turkish board-certified plastic surgeon)"
    assert merged.external_ids == {"tprecd_id": "x"}


def test_merge_with_no_scrapes_raises():
    with pytest.raises(ValueError):
        merge(SeedEntry(clinic_id="x", expected_name="Test"), [])
