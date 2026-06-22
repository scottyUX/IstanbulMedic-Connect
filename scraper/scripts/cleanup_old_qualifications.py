"""One-off cleanup: delete every row in clinic_team_qualifications.

The next aggregation run (`python -m scraper.run`) repopulates the table
from scratch under the new presence-IS-the-credential model. Running this
script before that aggregation guarantees no stale rows from the previous
detail-extraction model linger.

This script does NOT auto-run. It prints what it WOULD do by default;
pass --apply to actually delete.

CRITICAL: Local Supabase only. The local-only guard refuses to run unless
SUPABASE_URL points at localhost / 127.0.0.1 / docker compose. Override
with --allow-non-local at your own risk.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent.parent


def _is_local(url: str) -> bool:
    lowered = url.lower()
    return (
        "localhost" in lowered
        or "127.0.0.1" in lowered
        or "kong:" in lowered
        or lowered.startswith("http://supabase_kong")
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Actually delete. Without this flag the script only prints what it would do.",
    )
    parser.add_argument(
        "--allow-non-local",
        action="store_true",
        help=(
            "Override the local-only guard. Required when SUPABASE_URL does not "
            "look like a local instance. Use with extreme caution."
        ),
    )
    args = parser.parse_args(argv)

    load_dotenv(ROOT / ".env.local")
    url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.", file=sys.stderr)
        return 2

    if not _is_local(url) and not args.allow_non_local:
        print(
            f"ERROR: SUPABASE_URL ({url}) does not look local. Refusing to run.\n"
            f"       Pass --allow-non-local to override (do NOT do this against production).",
            file=sys.stderr,
        )
        return 2

    from supabase import create_client

    client = create_client(url, key)

    rows = client.table("clinic_team_qualifications").select("id", count="exact").execute()
    count = getattr(rows, "count", None) or len(getattr(rows, "data", None) or [])

    print(f"clinic_team_qualifications row count: {count}")

    if count == 0:
        print("nothing to delete")
        return 0

    if not args.apply:
        print("dry-run: would delete all rows. Re-run with --apply to actually delete.")
        return 0

    # `delete()` on a Supabase REST query needs a filter. Match every UUID
    # row by selecting on a column that's always present.
    deleted = client.table("clinic_team_qualifications").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    deleted_rows = getattr(deleted, "data", None) or []
    print(f"deleted {len(deleted_rows)} rows")
    return 0


if __name__ == "__main__":
    sys.exit(main())
