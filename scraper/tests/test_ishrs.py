from pathlib import Path

import pytest

from scraper.sources import ishrs
from scraper.types import ScrapeError

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_fellow_tier_yields_fishrs_and_abhrs():
    result = ishrs.scrape(
        "https://ishrs.org/doctor/50809/",
        html=_load("ishrs_fellow.html"),
    )
    assert result.full_name == "Emre Karadeniz"
    assert result.source == "ishrs"
    assert result.external_id == "50809"
    assert "FISHRS" in result.qualifications
    assert "ABHRS Diplomate" in result.qualifications
    # The "Member" pattern in "Membership:" must NOT also produce "ISHRS Member".
    assert "ISHRS Member" not in result.qualifications


def test_associate_member_tier_does_not_yield_fishrs():
    result = ishrs.scrape(
        "https://ishrs.org/doctor/12345/",
        html=_load("ishrs_member.html"),
    )
    assert "ISHRS Associate Member" in result.qualifications
    assert "FISHRS" not in result.qualifications
    assert "ISHRS Member" not in result.qualifications


def test_missing_name_raises():
    with pytest.raises(ScrapeError):
        ishrs.scrape("https://ishrs.org/doctor/0/", html=_load("ishrs_no_name.html"))


def test_missing_qualifications_raises():
    with pytest.raises(ScrapeError):
        ishrs.scrape("https://ishrs.org/doctor/0/", html=_load("ishrs_no_tier.html"))


def test_external_id_falls_back_to_url():
    result = ishrs.scrape(
        "https://ishrs.org/some-other-shape",
        html=_load("ishrs_fellow.html"),
    )
    assert result.external_id == "https://ishrs.org/some-other-shape"
