"""CLI entrypoint: walk clinic_team, look each doctor up by name in the
ISHRS / IAHRS / TPRECD registries, write one qualification row per hit.

The clinic_team table is the source of truth for who works at which clinic.
Every row is checked on each run; clinic_team.last_verified_at is bumped
even when a doctor has zero registry hits, so the UI can distinguish
"never checked" from "checked, no badges."

Usage:
    python -m scraper.run                 # check every clinic_team row
    python -m scraper.run --dry-run       # check but skip Supabase writes
    python -m scraper.run --clinic <uuid> # only the doctors at this clinic
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from scraper.persistence import RegistryHit, upsert_qualifications
from scraper.sources import iahrs, ishrs, tprecd
from scraper.types import ScrapeError

logger = logging.getLogger("scraper")

ROOT = Path(__file__).resolve().parent.parent

# Order matches the brief's "ISHRS, IAHRS, TPRECD" sequence.
SOURCES_BY_NAME = {"ishrs": ishrs, "iahrs": iahrs, "tprecd": tprecd}
ALL_SOURCES = tuple(SOURCES_BY_NAME)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dry-run", action="store_true",
                        help="Search registries but skip Supabase writes.")
    parser.add_argument("--clinic", default=None,
                        help="Restrict to one clinic_id (UUID). Useful for incremental runs.")
    parser.add_argument(
        "--sources",
        default=",".join(ALL_SOURCES),
        help=(
            "Comma-separated list of registries to query. Default: all. "
            "Useful when one registry is misbehaving — e.g. --sources ishrs,iahrs "
            "to skip TPRECD when the site is slow/down."
        ),
    )
    args = parser.parse_args(argv)

    selected = [s.strip() for s in args.sources.split(",") if s.strip()]
    unknown = set(selected) - set(ALL_SOURCES)
    if unknown:
        parser.error(f"unknown source(s): {sorted(unknown)}. Valid: {ALL_SOURCES}")
    active_sources = tuple(SOURCES_BY_NAME[name] for name in selected)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    load_dotenv(ROOT / ".env.local")
    client = _build_supabase()

    members = _load_team_members(client, clinic_filter=args.clinic)
    logger.info("Verifying %d clinic_team rows", len(members))

    verified = 0
    hit_total = 0
    failures = 0

    for member in members:
        team_id = member["id"]
        name = (member.get("name") or "").strip()
        if not name:
            logger.warning("skip team_id=%s — no name on row", team_id)
            continue

        try:
            hits = _lookup_all(name, active_sources)
        except ScrapeError as exc:
            logger.error("registry lookup failed for %s (%s): %s", name, team_id, exc)
            failures += 1
            continue
        except Exception:
            logger.exception("unexpected error for %s (%s)", name, team_id)
            failures += 1
            continue

        if args.dry_run:
            logger.info(
                "[dry-run] %s → %d hit(s): %s",
                name,
                len(hits),
                ", ".join(f"{h.source} {h.source_url}" for h in hits) or "none",
            )
        else:
            upsert_qualifications(client, team_id, hits)
            logger.info("%s → %d hit(s) persisted", name, len(hits))

        verified += 1
        hit_total += len(hits)

    logger.info(
        "done: %d members verified, %d total hits, %d failures",
        verified, hit_total, failures,
    )
    return 0 if failures == 0 else 1


def _lookup_all(name: str, sources=None) -> list[RegistryHit]:
    """Run name through every selected registry and collect hits."""
    if sources is None:
        sources = tuple(SOURCES_BY_NAME.values())
    hits: list[RegistryHit] = []
    for source_module in sources:
        hit = source_module.search(name)
        if hit is not None:
            hits.append(hit)
    return hits


def _load_team_members(client, *, clinic_filter: str | None) -> list[dict]:
    query = client.table("clinic_team").select("id, clinic_id, name").not_.is_("name", "null")
    if clinic_filter:
        query = query.eq("clinic_id", clinic_filter)
    result = query.execute()
    return getattr(result, "data", None) or []


def _build_supabase():
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        logger.error(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set "
            "(scraper writes to clinic_team via the service role)."
        )
        sys.exit(2)
    from supabase import create_client

    return create_client(url, key)


if __name__ == "__main__":
    sys.exit(main())
