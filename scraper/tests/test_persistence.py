from scraper.persistence import persist
from scraper.tests.fake_supabase import FakeSupabase
from scraper.types import MergedDoctor


def _merged() -> MergedDoctor:
    return MergedDoctor(
        clinic_id="aaaa",
        expected_name="Hakan Doganay",
        full_name="Hakan Doğanay",
        external_ids={"iahrs_id": "hakan-doganay"},
        qualifications=[
            ("IAHRS Member", "iahrs", "https://iahrs.org/x"),
            ("FUE Europe Member", "iahrs", "https://iahrs.org/x"),
        ],
    )


def test_inserts_when_no_existing_row():
    client = FakeSupabase()
    team_id = persist(client, _merged())

    assert len(client.tables["clinic_team"]) == 1
    row = client.tables["clinic_team"][0]
    assert row["id"] == team_id
    assert row["clinic_id"] == "aaaa"
    assert row["name"] == "Hakan Doğanay"
    assert row["name_normalized"] == "hakan doganay"
    assert row["external_ids"] == {"iahrs_id": "hakan-doganay"}
    assert row["last_verified_at"] is not None

    assert len(client.tables["clinic_team_qualifications"]) == 2


def test_updates_existing_row_and_merges_external_ids():
    existing = {
        "id": "existing-id",
        "clinic_id": "aaaa",
        "name": "Hakan Doganay",
        "name_normalized": "hakan doganay",
        "external_ids": {"ishrs_id": "999"},
        "role": "doctor",
        "credentials": "",
        "doctor_involvement_level": "medium",
    }
    client = FakeSupabase(seed={"clinic_team": [existing]})

    team_id = persist(client, _merged())

    assert team_id == "existing-id"
    assert len(client.tables["clinic_team"]) == 1
    row = client.tables["clinic_team"][0]
    # Directory's spelling wins.
    assert row["name"] == "Hakan Doğanay"
    # External ids merged.
    assert row["external_ids"] == {"ishrs_id": "999", "iahrs_id": "hakan-doganay"}


def test_upsert_is_idempotent():
    client = FakeSupabase()
    persist(client, _merged())
    persist(client, _merged())

    # Second run does not duplicate.
    assert len(client.tables["clinic_team"]) == 1
    assert len(client.tables["clinic_team_qualifications"]) == 2
