/**
 * tests/unit/api/clinics-scraped-data.test.ts
 *
 * Tests for clinic_scraped_data integration.
 * Covers: description resolution, techniques, overview visibility logic
 * added as part of the website-scraping feature.
 */

import { describe, it, expect, vi } from 'vitest';

// ── Pure logic extracted from lib/api/clinics.ts ──────────────────────────────

function resolveDescription(
  scrapedData: { description: string | null } | null | undefined
): string | null {
  return scrapedData?.description ?? null;
}

function resolveTechniques(
  scrapedData: { techniques?: string[] | null } | null | undefined
): string[] {
  return scrapedData?.techniques ?? [];
}

function shouldShowOverview(
  description: string | null,
  techniques: string[]
): boolean {
  return !!description || techniques.length > 0;
}

// Mirrors normalize_url() in scripts/push-clinics.py
function normalizeUrl(url: string): string {
  return url.split('?')[0].toLowerCase();
}

// ── Description resolution ─────────────────────────────────────────────────────

describe('resolveDescription — clinic_scraped_data.description', () => {
  it('returns scraped description for a clinic like AEK Hair Clinic', () => {
    const scrapedData = {
      description:
        'Located in Turkey, AEK Hair Clinic specializes in high-quality hair transplants using FUT and FUE techniques.',
    };
    expect(resolveDescription(scrapedData)).toBe(scrapedData.description);
  });

  it('returns null for unscraped clinics like Dr. Cinik Clinic', () => {
    // Clinic exists in clinics table but has no row in clinic_scraped_data
    expect(resolveDescription(null)).toBeNull();
  });

  it('returns null when clinic_scraped_data row exists but description is null', () => {
    expect(resolveDescription({ description: null })).toBeNull();
  });

  it('returns null when scrapedData is undefined (no join result)', () => {
    expect(resolveDescription(undefined)).toBeNull();
  });
});

// ── Techniques resolution ──────────────────────────────────────────────────────

describe('resolveTechniques — clinic_scraped_data.techniques', () => {
  it('returns techniques for Lenus Clinic which has FUE, DHI, Sapphire FUE', () => {
    const scrapedData = { techniques: ['FUE', 'DHI', 'Sapphire FUE'] };
    expect(resolveTechniques(scrapedData)).toEqual(['FUE', 'DHI', 'Sapphire FUE']);
  });

  it('returns empty array for clinics with no scraped data', () => {
    expect(resolveTechniques(null)).toEqual([]);
  });

  it('returns empty array when techniques field is null', () => {
    expect(resolveTechniques({ techniques: null })).toEqual([]);
  });

  it('returns empty array when techniques field is missing from scraped row', () => {
    expect(resolveTechniques({})).toEqual([]);
  });
});

// ── Overview section visibility ────────────────────────────────────────────────

describe('shouldShowOverview — profileOverview feature flag logic', () => {
  it('shows overview for AHD Clinic which has both description and techniques', () => {
    const description = 'AHD Clinic, founded by Dr. Hakan Doğanay, is a pioneer in hair transplant Turkey.';
    const techniques = ['DHI'];
    expect(shouldShowOverview(description, techniques)).toBe(true);
  });

  it('shows overview when only description is present', () => {
    expect(shouldShowOverview('A clinic in Istanbul.', [])).toBe(true);
  });

  it('shows overview when only techniques are present', () => {
    expect(shouldShowOverview(null, ['FUE', 'FUT'])).toBe(true);
  });

  it('hides overview for unscraped clinics like Dr. Cinik Clinic', () => {
    // No description, no techniques — Overview card should not render
    expect(shouldShowOverview(null, [])).toBe(false);
  });

  it('hides overview when description is empty string', () => {
    expect(shouldShowOverview('', [])).toBe(false);
  });
});

// ── URL normalization (mirrors push-clinics.py normalize_url) ──────────────────

describe('normalizeUrl — used to match clinics JSON to clinics table', () => {
  it('strips UTM params from Vera Clinic URL', () => {
    expect(
      normalizeUrl('https://www.veraclinic.net/?utm_source=google&utm_medium=organic&utm_campaign=gmb-listing')
    ).toBe('https://www.veraclinic.net/');
  });

  it('lowercases the URL for case-insensitive matching', () => {
    expect(normalizeUrl('https://www.DrSerkanAygin.com/')).toBe(
      'https://www.drserkanaygin.com/'
    );
  });

  it('preserves trailing slash so lenusclinic.com/ matches DB row', () => {
    expect(normalizeUrl('https://lenusclinic.com/')).toBe('https://lenusclinic.com/');
  });

  it('handles clinic URLs with paths like Memorial hospital', () => {
    expect(
      normalizeUrl('https://www.memorial.com.tr/hastane-ve-tip-merkezleri/sisli/')
    ).toBe('https://www.memorial.com.tr/hastane-ve-tip-merkezleri/sisli/');
  });

  it('handles http clinics like estefavor and drterziler', () => {
    expect(normalizeUrl('http://www.estefavor.com/')).toBe('http://www.estefavor.com/');
    expect(normalizeUrl('http://drterziler.com/')).toBe('http://drterziler.com/');
  });
});
