from pathlib import Path

import pytest

from scraper.sources import iahrs
from scraper.types import ScrapeError

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_basic_profile_yields_single_iahrs_member_qualification():
    result = iahrs.scrape(
        "https://www.iahrs.org/hair-transplant/koray-erdogan",
        html=_load("iahrs_basic.html"),
    )
    assert result.full_name == "Koray Erdogan"
    assert result.source == "iahrs"
    assert result.external_id == "koray-erdogan"
    assert result.qualifications == ("IAHRS member",)


def test_unicode_name_preserved():
    result = iahrs.scrape(
        "https://www.iahrs.org/hair-transplant/hakan-doganay",
        html=_load("iahrs_unicode.html"),
    )
    # The original diacritic must survive the parse — `name_normalized`
    # strips them only at the DB layer.
    assert result.full_name == "Hakan Doğanay"
    assert result.qualifications == ("IAHRS member",)


def test_garbage_page_raises():
    with pytest.raises(ScrapeError):
        iahrs.scrape(
            "https://www.iahrs.org/hair-transplant/missing",
            html=_load("iahrs_garbage.html"),
        )
