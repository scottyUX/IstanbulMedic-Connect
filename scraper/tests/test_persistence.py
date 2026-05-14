from scraper.persistence import RegistryHit, persist, upsert_qualifications
from scraper.tests.fake_supabase import FakeSupabase
from scraper.types import MergedDoctor


def _merged() -> MergedDoctor:
    """A MergedDoctor with one canonical IAHRS qualification.

    Earlier versions of the scraper would emit multiple qualifications per
    source (FISHRS, FUE Europe Member, etc.). The new model emits exactly
    one per (team_member_id, source); this fixture reflects that.
    """
    return MergedDoctor(
        clinic_id="aaaa",
        expected_name="Hakan Doganay",
        full_name="Hakan Doğanay",
        external_ids={"iahrs_id": "hakan-doganay"},
        qualifications=[
            ("IAHRS member", "iahrs", "https://iahrs.org/x"),
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

    assert len(client.tables["clinic_team_qualifications"]) == 1


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
    assert len(client.tables["clinic_team_qualifications"]) == 1


# ─────────────────────────────────────────────────────────────────────────────
# upsert_qualifications — new, clinic_team-driven write path
# ─────────────────────────────────────────────────────────────────────────────


def test_upsert_qualifications_inserts_one_row_per_hit():
    existing = {
        "id": "team-1", "clinic_id": "c1", "name": "Dr. Ali Emre Karadeniz",
        "role": "medical_director", "credentials": "Founder",
        "doctor_involvement_level": "high",
    }
    client = FakeSupabase(seed={"clinic_team": [existing]})

    upsert_qualifications(client, "team-1", [
        RegistryHit("ishrs", "ISHRS member", "https://ishrs.org/doctor/50809"),
        RegistryHit("tprecd", "TPRECD member (Turkish board-certified plastic surgeon)",
                    "https://www.plastikcerrahi.org.tr/Doktor-Bilgileri/47"),
    ])

    quals = client.tables["clinic_team_qualifications"]
    assert len(quals) == 2
    assert {q["source"] for q in quals} == {"ishrs", "tprecd"}
    # last_verified_at must have been bumped on the doctor row.
    assert client.tables["clinic_team"][0]["last_verified_at"] is not None


def test_upsert_qualifications_idempotent_on_rerun():
    existing = {"id": "team-1", "clinic_id": "c1", "name": "x", "role": "doctor",
                "credentials": "", "doctor_involvement_level": "medium"}
    client = FakeSupabase(seed={"clinic_team": [existing]})

    hits = [RegistryHit("ishrs", "ISHRS member", "https://ishrs.org/doctor/1")]
    upsert_qualifications(client, "team-1", hits)
    upsert_qualifications(client, "team-1", hits)

    assert len(client.tables["clinic_team_qualifications"]) == 1


def test_upsert_qualifications_collapses_duplicate_source():
    """Even if the runner accidentally hands in two ISHRS hits, the upsert
    on (team_member_id, source) produces only one row. This is the structural
    fix for the duplicate-IAHRS bug."""
    existing = {"id": "team-1", "clinic_id": "c1", "name": "x", "role": "doctor",
                "credentials": "", "doctor_involvement_level": "medium"}
    client = FakeSupabase(seed={"clinic_team": [existing]})

    upsert_qualifications(client, "team-1", [
        RegistryHit("ishrs", "ISHRS member", "https://ishrs.org/doctor/1"),
        RegistryHit("ishrs", "ISHRS member", "https://ishrs.org/doctor/1"),
    ])

    assert len(client.tables["clinic_team_qualifications"]) == 1


def test_upsert_qualifications_with_no_hits_still_bumps_last_verified():
    """Doctors with zero registry hits must still be marked as checked."""
    existing = {"id": "team-1", "clinic_id": "c1", "name": "x", "role": "doctor",
                "credentials": "", "doctor_involvement_level": "medium",
                "last_verified_at": None}
    client = FakeSupabase(seed={"clinic_team": [existing]})

    upsert_qualifications(client, "team-1", [])

    assert client.tables.get("clinic_team_qualifications", []) == []
    assert client.tables["clinic_team"][0]["last_verified_at"] is not None


def test_upsert_replaces_old_qualification_string_when_canonical_changes():
    """If the doctor row already has an old-format ISHRS row (e.g. 'FISHRS'),
    upserting with the new canonical 'ISHRS member' string overwrites it
    rather than creating a sibling row, because the conflict key is
    (team_member_id, source) — not (..., qualification, source)."""
    existing_team = {"id": "team-1", "clinic_id": "c1", "name": "x", "role": "doctor",
                     "credentials": "", "doctor_involvement_level": "medium"}
    existing_qual = {"id": "old-q", "team_member_id": "team-1", "source": "ishrs",
                     "qualification": "FISHRS",
                     "source_url": "https://ishrs.org/doctor/1",
                     "verified_at": "2026-01-01T00:00:00Z"}
    client = FakeSupabase(seed={
        "clinic_team": [existing_team],
        "clinic_team_qualifications": [existing_qual],
    })

    upsert_qualifications(client, "team-1", [
        RegistryHit("ishrs", "ISHRS member", "https://ishrs.org/doctor/1"),
    ])

    quals = client.tables["clinic_team_qualifications"]
    assert len(quals) == 1
    assert quals[0]["qualification"] == "ISHRS member"
