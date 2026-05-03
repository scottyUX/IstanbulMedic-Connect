"""CLI entrypoint: read seeds, scrape, merge, persist.

Usage:
    python -m scraper.run                  # scrape every seed
    python -m scraper.run --dry-run        # scrape but skip Supabase writes
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

from scraper.matcher import expected_name_matches
from scraper.merger import merge
from scraper.persistence import persist
from scraper.sources import iahrs, ishrs
from scraper.types import ScrapedDoctor, ScrapeError, SeedEntry

logger = logging.getLogger("scraper")

ROOT = Path(__file__).resolve().parent.parent
SEEDS_PATH = Path(__file__).resolve().parent / "seeds.json"


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Scrape ISHRS/IAHRS into Supabase.")
    parser.add_argument("--dry-run", action="store_true", help="Scrape but don't write.")
    parser.add_argument("--seeds", type=Path, default=SEEDS_PATH)
    args = parser.parse_args(argv)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    load_dotenv(ROOT / ".env.local")

    seeds = _load_seeds(args.seeds)
    logger.info("Loaded %d seed entries from %s", len(seeds), args.seeds)

    client = None if args.dry_run else _build_supabase()

    successes = 0
    failures = 0
    for seed in seeds:
        try:
            scrapes = _scrape_one(seed)
            if not scrapes:
                logger.warning("No URLs for %s — skipping", seed.expected_name)
                continue
            merged = merge(seed, scrapes)
            if client is None:
                logger.info(
                    "[dry-run] would persist %s with %d qualifications",
                    merged.full_name,
                    len(merged.qualifications),
                )
            else:
                team_id = persist(client, merged)
                logger.info("persisted %s (%s)", merged.full_name, team_id)
            successes += 1
        except ScrapeError as exc:
            logger.error("scrape error for %s: %s", seed.expected_name, exc)
            failures += 1
        except Exception:
            logger.exception("unexpected error for %s", seed.expected_name)
            failures += 1

    logger.info("done: %d ok, %d failed", successes, failures)
    return 0 if failures == 0 else 1


def _scrape_one(seed: SeedEntry) -> list[ScrapedDoctor]:
    """Scrape every source URL declared on a seed entry, with the expected_name
    sanity check. Returns scrapes that passed the check."""
    scrapes: list[ScrapedDoctor] = []
    targets = []
    if seed.ishrs_url:
        targets.append((ishrs, seed.ishrs_url))
    if seed.iahrs_url:
        targets.append((iahrs, seed.iahrs_url))

    for module, url in targets:
        scraped = module.scrape(url)
        if not expected_name_matches(scraped, seed.expected_name):
            raise ScrapeError(
                f"{module.SOURCE} sanity check failed: expected '{seed.expected_name}', "
                f"got '{scraped.full_name}' from {url}"
            )
        scrapes.append(scraped)

    return scrapes


def _load_seeds(path: Path) -> list[SeedEntry]:
    raw = json.loads(path.read_text(encoding="utf-8"))
    return [
        SeedEntry(
            clinic_id=entry["clinic_id"],
            expected_name=entry["expected_name"],
            ishrs_url=entry.get("ishrs_url"),
            iahrs_url=entry.get("iahrs_url"),
        )
        for entry in raw
    ]


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
