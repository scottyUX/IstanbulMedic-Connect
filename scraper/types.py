"""Shared types for the scraper module."""

from dataclasses import dataclass, field
from datetime import datetime


class ScrapeError(Exception):
    """Raised when a scraper cannot extract the expected fields from a page.

    The scraper persists nothing on ScrapeError. The caller should log and
    move on to the next seed entry.
    """


@dataclass(frozen=True)
class ScrapedDoctor:
    source: str
    source_url: str
    external_id: str
    full_name: str
    qualifications: tuple[str, ...]
    scraped_at: datetime


@dataclass(frozen=True)
class SeedEntry:
    clinic_id: str
    expected_name: str
    ishrs_url: str | None = None
    iahrs_url: str | None = None


@dataclass
class MergedDoctor:
    """One canonical doctor record after merging sources for a single seed."""

    clinic_id: str
    expected_name: str
    full_name: str
    external_ids: dict[str, str] = field(default_factory=dict)
    qualifications: list[tuple[str, str, str]] = field(default_factory=list)
    """List of (qualification, source, source_url) tuples."""
