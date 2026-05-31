from datetime import UTC, datetime

from scraper.matcher import expected_name_matches, names_match
from scraper.types import ScrapedDoctor


def _scraped(name: str) -> ScrapedDoctor:
    return ScrapedDoctor(
        source="ishrs",
        source_url="https://example",
        external_id="x",
        full_name=name,
        qualifications=("ISHRS Member",),
        scraped_at=datetime.now(UTC),
    )


def test_exact_match():
    assert names_match("Resul Yaman", "Resul Yaman")


def test_diacritic_difference_matches():
    # The same person with and without Turkish diacritics — must match.
    assert names_match("Hakan Doğanay", "Hakan Doganay")


def test_case_difference_matches():
    assert names_match("KORAY ERDOGAN", "koray erdogan")


def test_typo_close_to_threshold_matches():
    # Single-character typo — should pass the 88 threshold.
    assert names_match("Resul Yaman", "Resul Yamen")


def test_extra_middle_name_does_not_match():
    # Critical: short and long forms of "Karadeniz" must NOT auto-merge.
    # Two different people could share the surname; the seed list is the
    # only thing allowed to declare them the same.
    assert not names_match("Ali Karadeniz", "Ali Emre Karadeniz")


def test_completely_different_names_do_not_match():
    assert not names_match("Resul Yaman", "Koray Erdogan")


def test_empty_names_do_not_match():
    assert not names_match("", "Resul Yaman")
    assert not names_match("Resul Yaman", "")


def test_expected_name_check_passes_for_correct_scrape():
    s = _scraped("Hakan Doğanay")
    assert expected_name_matches(s, "Hakan Doganay")


def test_expected_name_check_fails_for_redirected_page():
    # Simulates a URL that has redirected to a different doctor.
    s = _scraped("Someone Else")
    assert not expected_name_matches(s, "Hakan Doğanay")
