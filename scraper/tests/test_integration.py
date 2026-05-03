"""End-to-end pipeline test: fixture HTML → scrape → match → merge → persist.

Uses the FakeSupabase to verify the full flow without requiring a live DB.
"""

from pathlib import Path

import pytest

from scraper.matcher import expected_name_matches
from scraper.merger import merge
from scraper.persistence import persist
from scraper.sources import iahrs, ishrs
from scraper.tests.fake_supabase import FakeSupabase
from scraper.types import ScrapeError, SeedEntry

FIXTURES = Path(__file__).parent / "fixtures"


def _load(name: str) -> str:
    return (FIXTURES / name).read_text(encoding="utf-8")


def _run_seed(client: FakeSupabase, seed: SeedEntry, *, ishrs_html=None, iahrs_html=None):
    scrapes = []
    if seed.ishrs_url and ishrs_html is not None:
        s = ishrs.scrape(seed.ishrs_url, html=ishrs_html)
        if not expected_name_matches(s, seed.expected_name):
            raise ScrapeError(f"sanity-check failure for {seed.expected_name}")
        scrapes.append(s)
    if seed.iahrs_url and iahrs_html is not None:
        s = iahrs.scrape(seed.iahrs_url, html=iahrs_html)
        if not expected_name_matches(s, seed.expected_name):
            raise ScrapeError(f"sanity-check failure for {seed.expected_name}")
        scrapes.append(s)
    merged = merge(seed, scrapes)
    return persist(client, merged)


def test_pipeline_fresh_insert():
    client = FakeSupabase()
    seed = SeedEntry(
        clinic_id="clinic-1",
        expected_name="Emre Karadeniz",
        ishrs_url="https://ishrs.org/doctor/50809/",
    )

    team_id = _run_seed(client, seed, ishrs_html=_load("ishrs_fellow.html"))

    assert team_id is not None
    team_rows = client.tables["clinic_team"]
    assert len(team_rows) == 1
    assert team_rows[0]["clinic_id"] == "clinic-1"
    assert team_rows[0]["name"] == "Emre Karadeniz"

    qual_rows = client.tables["clinic_team_qualifications"]
    quals = sorted({(r["qualification"], r["source"]) for r in qual_rows})
    assert ("FISHRS", "ishrs") in quals
    assert ("ABHRS Diplomate", "ishrs") in quals


def test_pipeline_idempotent_when_rerun():
    client = FakeSupabase()
    seed = SeedEntry(
        clinic_id="clinic-1",
        expected_name="Koray Erdogan",
        iahrs_url="https://www.iahrs.org/hair-transplant/koray-erdogan",
    )

    _run_seed(client, seed, iahrs_html=_load("iahrs_basic.html"))
    _run_seed(client, seed, iahrs_html=_load("iahrs_basic.html"))

    assert len(client.tables["clinic_team"]) == 1
    # IAHRS Member + ISHRS Member from the bio scan = 2 rows. No duplicates.
    assert len(client.tables["clinic_team_qualifications"]) == 2


def test_pipeline_blocks_wrong_seed_name():
    """If the seed's expected_name disagrees with the scraped page, nothing is written."""
    client = FakeSupabase()
    bad_seed = SeedEntry(
        clinic_id="clinic-1",
        expected_name="Someone Completely Different",
        ishrs_url="https://ishrs.org/doctor/50809/",
    )

    with pytest.raises(ScrapeError):
        _run_seed(client, bad_seed, ishrs_html=_load("ishrs_fellow.html"))

    # Critical: nothing in either table.
    assert client.tables.get("clinic_team", []) == []
    assert client.tables.get("clinic_team_qualifications", []) == []


def test_pipeline_existing_clinic_team_row_updated():
    """A pre-existing clinic_team row with a slightly off name should be matched
    by normalized name and its full_name should be overwritten with the
    directory spelling."""
    existing = {
        "id": "pre-existing",
        "clinic_id": "clinic-1",
        "name": "Hakan Doganay",
        "name_normalized": "hakan doganay",
        "role": "doctor",
        "credentials": "Medical Aesthetic Physician",
        "doctor_involvement_level": "high",
        "external_ids": {},
    }
    client = FakeSupabase(seed={"clinic_team": [existing]})

    seed = SeedEntry(
        clinic_id="clinic-1",
        expected_name="Hakan Doğanay",
        iahrs_url="https://www.iahrs.org/hair-transplant/hakan-doganay",
    )

    team_id = _run_seed(client, seed, iahrs_html=_load("iahrs_unicode.html"))

    assert team_id == "pre-existing"
    assert len(client.tables["clinic_team"]) == 1
    # Diacritic name now in clinic_team.
    assert client.tables["clinic_team"][0]["name"] == "Hakan Doğanay"
    # Original credentials field NOT touched.
    assert client.tables["clinic_team"][0]["credentials"] == "Medical Aesthetic Physician"
