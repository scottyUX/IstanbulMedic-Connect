"""Per-source scrapers. Each module exposes a `scrape(url, html=None)` function
returning a `ScrapedDoctor` or raising `ScrapeError`.
"""

from scraper.sources import iahrs, ishrs

__all__ = ["ishrs", "iahrs"]
