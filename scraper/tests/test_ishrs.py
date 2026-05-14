from pathlib import Path

import pytest

from scraper.sources import ishrs
from scraper.types import ScrapeError

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_profile_yields_single_ishrs_member_qualification():
    result = ishrs.scrape(
        "https://ishrs.org/doctor/50809/",
        html=_load("ishrs_fellow.html"),
    )
    assert result.full_name == "Emre Karadeniz"
    assert result.source == "ishrs"
    assert result.external_id == "50809"
    assert result.qualifications == ("ISHRS member",)


def test_associate_member_page_also_yields_single_qualification():
    result = ishrs.scrape(
        "https://ishrs.org/doctor/12345/",
        html=_load("ishrs_member.html"),
    )
    # h1 is "Dr. Levent Acar" — the scraper preserves the honorific because
    # the seed pipeline's name-match step is what decides whether the
    # scrape lines up with the expected doctor.
    assert result.full_name == "Dr. Levent Acar"
    assert result.qualifications == ("ISHRS member",)


def test_missing_name_raises():
    with pytest.raises(ScrapeError):
        ishrs.scrape("https://ishrs.org/doctor/0/", html=_load("ishrs_no_name.html"))


def test_page_without_tier_still_succeeds_because_presence_is_credential():
    # Under the old logic this fixture raised ScrapeError (no recognised tier).
    # Now registry presence alone is the credential, so a page with a real
    # name but no tier markup still qualifies.
    result = ishrs.scrape("https://ishrs.org/doctor/9999/", html=_load("ishrs_no_tier.html"))
    assert result.full_name == "Dr. Mystery"
    assert result.qualifications == ("ISHRS member",)


def test_external_id_falls_back_to_url():
    result = ishrs.scrape(
        "https://ishrs.org/some-other-shape",
        html=_load("ishrs_fellow.html"),
    )
    assert result.external_id == "https://ishrs.org/some-other-shape"
