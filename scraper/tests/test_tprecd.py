from pathlib import Path

import pytest

from scraper.sources import tprecd
from scraper.types import ScrapeError

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def test_basic_profile_yields_single_tprecd_qualification():
    result = tprecd.scrape(
        "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47",
        html=_load("tprecd_basic.html"),
    )
    assert result.full_name == "Ali Emre Karadeniz"
    assert result.source == "tprecd"
    assert result.external_id == "47"
    assert result.qualifications == (
        "TPRECD member (Turkish board-certified plastic surgeon)",
    )


def test_unicode_name_with_turkish_title_preserved():
    result = tprecd.scrape(
        "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/123",
        html=_load("tprecd_unicode.html"),
    )
    # Honorific stripped, diacritic preserved.
    assert result.full_name == "Soner Tatlıdede"
    assert result.qualifications == (
        "TPRECD member (Turkish board-certified plastic surgeon)",
    )


def test_missing_name_raises():
    with pytest.raises(ScrapeError):
        tprecd.scrape(
            "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/0",
            html=_load("tprecd_no_name.html"),
        )


def test_garbage_html_raises():
    with pytest.raises(ScrapeError):
        tprecd.scrape(
            "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/9999",
            html=_load("tprecd_garbage.html"),
        )


def test_real_aspnet_markup_parses_name_from_label_span():
    """The live TPRECD site renders names in an ASP.NET <span id=...Label1>
    in ALL CAPS Turkish, not in <h1>."""
    result = tprecd.scrape(
        "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47",
        html=_load("tprecd_aspnet.html"),
    )
    # ALL-CAPS Turkish source name title-cased correctly (Turkish-aware lowercasing).
    assert result.full_name == "Ali Emre Karadeniz"
    assert result.external_id == "47"
    assert result.qualifications == (
        "TPRECD member (Turkish board-certified plastic surgeon)",
    )


def test_external_id_falls_back_to_url_when_path_does_not_match():
    result = tprecd.scrape(
        "https://www.plastikcerrahi.org.tr/some-other-shape",
        html=_load("tprecd_basic.html"),
    )
    assert result.external_id == "https://www.plastikcerrahi.org.tr/some-other-shape"
