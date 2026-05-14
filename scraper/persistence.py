"""Persistence: writes scraper output into clinic_team + clinic_team_qualifications.

Two write paths exist:

  * persist(MergedDoctor) — seed-driven path. Fuzzy-matches the scraped name
    against existing clinic_team rows for the seed's clinic_id, inserting a
    new doctor row if no match is found. Used by the legacy URL-keyed
    seeds.json runner and its tests.

  * upsert_qualifications(team_member_id, hits) — clinic_team-driven path.
    The runner already knows which doctor row a hit belongs to (it walked
    clinic_team to discover the doctor in the first place), so this path
    skips fuzzy lookup entirely. It upserts one row per hit and bumps
    clinic_team.last_verified_at.

Both paths upsert qualifications on (team_member_id, source) — registry
presence is the credential, exactly one row per registry per doctor.

The Supabase client is passed in (not constructed here) so unit tests can
inject a fake.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Protocol

from rapidfuzz import fuzz

from scraper.matcher import names_match
from scraper.normalize import normalize_name
from scraper.types import MergedDoctor


@dataclass(frozen=True)
class RegistryHit:
    """One registry's verdict on one doctor.

    `source` is the registry slug ('ishrs' / 'iahrs' / 'tprecd'),
    `qualification` is the canonical credential string, `source_url` is
    the profile URL the qualification was discovered from.
    """

    source: str
    qualification: str
    source_url: str


class SupabaseLike(Protocol):
    def table(self, name: str): ...  # noqa: ANN201, D401


def _lookup_match(db_name: str, candidate: str) -> bool:
    """Looser match for DB row lookup only.

    names_match (threshold 88) rejects "Emre Karadeniz" vs "Ali Emre Karadeniz"
    because the directory omits the first given name. partial_ratio catches this
    since one name is a clean suffix of the other (score = 100).
    """
    if names_match(db_name, candidate):
        return True
    na = normalize_name(db_name)
    nb = normalize_name(candidate)
    if not na or not nb:
        return False
    return fuzz.partial_ratio(na, nb) >= 88


def persist(client: SupabaseLike, merged: MergedDoctor) -> str:
    """Persist a MergedDoctor. Returns the clinic_team.id (UUID) of the
    upserted/inserted row."""

    now_iso = datetime.now(UTC).isoformat()
    name_normalized = normalize_name(merged.full_name)

    # Fetch all team members for this clinic and fuzzy-match in Python.
    # Exact name_normalized equality is too brittle: the DB backfill keeps
    # honorifics ("dr. ali emre karadeniz") while normalize_name strips them
    # ("emre karadeniz"), and directory profiles sometimes omit a given name.
    all_members = (
        client.table("clinic_team")
        .select("id, name, external_ids")
        .eq("clinic_id", merged.clinic_id)
        .execute()
    )

    rows = getattr(all_members, "data", None) or []
    matched = next(
        (r for r in rows if _lookup_match(r["name"], merged.full_name)
         or _lookup_match(r["name"], merged.expected_name)),
        None,
    )

    if matched:
        team_member_id = matched["id"]
        merged_external_ids = {**(matched.get("external_ids") or {}), **merged.external_ids}
        client.table("clinic_team").update(
            {
                "name": merged.full_name,
                "name_normalized": name_normalized,
                "external_ids": merged_external_ids,
                "last_verified_at": now_iso,
            }
        ).eq("id", team_member_id).execute()
    else:
        inserted = (
            client.table("clinic_team")
            .insert(
                {
                    "clinic_id": merged.clinic_id,
                    "name": merged.full_name,
                    "name_normalized": name_normalized,
                    "role": "doctor",
                    # `credentials` is NOT NULL in the existing schema; the credential
                    # signal really lives in clinic_team_qualifications now.
                    "credentials": "",
                    "doctor_involvement_level": "medium",
                    "external_ids": merged.external_ids,
                    "last_verified_at": now_iso,
                }
            )
            .execute()
        )
        inserted_rows = getattr(inserted, "data", None) or []
        if not inserted_rows:
            raise RuntimeError(
                f"Failed to insert clinic_team row for {merged.full_name} ({merged.clinic_id})"
            )
        team_member_id = inserted_rows[0]["id"]

    for qualification, source, source_url in merged.qualifications:
        _upsert_qualification_row(
            client, team_member_id, source, qualification, source_url, now_iso
        )

    return team_member_id


def upsert_qualifications(
    client: SupabaseLike,
    team_member_id: str,
    hits: list[RegistryHit],
) -> None:
    """Write registry hits for a doctor whose clinic_team.id we already know.

    Always bumps clinic_team.last_verified_at, even when `hits` is empty —
    the runner's job is to record that we *checked* this doctor, not just
    to record successful hits.

    Each hit upserts on (team_member_id, source). Re-running with the same
    hits is a no-op other than refreshing verified_at timestamps.
    """
    now_iso = datetime.now(UTC).isoformat()

    client.table("clinic_team").update({"last_verified_at": now_iso}).eq(
        "id", team_member_id
    ).execute()

    for hit in hits:
        _upsert_qualification_row(
            client,
            team_member_id,
            hit.source,
            hit.qualification,
            hit.source_url,
            now_iso,
        )


def _upsert_qualification_row(
    client: SupabaseLike,
    team_member_id: str,
    source: str,
    qualification: str,
    source_url: str | None,
    now_iso: str,
) -> None:
    client.table("clinic_team_qualifications").upsert(
        {
            "team_member_id": team_member_id,
            "qualification": qualification,
            "source": source,
            "source_url": source_url,
            "verified_at": now_iso,
        },
        on_conflict="team_member_id,source",
    ).execute()
