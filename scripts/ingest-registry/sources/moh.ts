/**
 * Turkish Ministry of Health (Sağlık Bakanlığı) scraper
 *
 * Target: https://kuvap.saglik.gov.tr — public registry of licensed private clinics
 *
 * The MOH portal lists private health facilities with:
 *   - Facility name, license number, license status
 *   - Licensed date, expiry date
 *   - Authorized specialties (branşlar)
 *   - Address
 *
 * Usage:
 *   Pass a search term (e.g. clinic legal name) to fetchMOHRecord().
 *   The function scrapes the search results page and returns normalized raw data.
 */

import * as cheerio from 'cheerio'
import {
  NormalizedClinicData,
  parseTurkishDate,
  normalizeLicenseStatus,
  normalizeSpecialties,
} from '../normalize'

const MOH_SEARCH_URL = 'https://kuvap.saglik.gov.tr/SaglikTesisleri/OzelSaglikTesisleri'

interface MOHRawRecord {
  facilityName: string
  licenseNumber: string
  status: string
  licensedSince: string
  expiresAt: string
  specialties: string[]
  address: string
}

/**
 * Fetches the MOH search results page for a given clinic name.
 * Returns the raw HTML.
 */
async function fetchSearchPage(clinicName: string): Promise<string> {
  const params = new URLSearchParams({ q: clinicName })
  const url = `${MOH_SEARCH_URL}?${params}`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; IstanbulMedicBot/1.0)',
      'Accept-Language': 'tr-TR,tr;q=0.9',
    },
  })

  if (!res.ok) {
    throw new Error(`MOH fetch failed: ${res.status} ${res.statusText}`)
  }

  return res.text()
}

/**
 * Parses the HTML search results from the MOH portal.
 * Returns raw records as scraped (not yet normalized).
 *
 * NOTE: Update the CSS selectors below after inspecting the actual MOH portal HTML.
 */
function parseSearchResults(html: string): MOHRawRecord[] {
  const $ = cheerio.load(html)
  const records: MOHRawRecord[] = []

  // Adjust selector to match the actual table structure on the MOH portal
  $('table.facility-list tbody tr').each((_, row) => {
    const cells = $(row).find('td')
    if (cells.length < 6) return

    records.push({
      facilityName: $(cells[0]).text().trim(),
      licenseNumber: $(cells[1]).text().trim(),
      status: $(cells[2]).text().trim(),
      licensedSince: $(cells[3]).text().trim(),
      expiresAt: $(cells[4]).text().trim(),
      specialties: $(cells[5])
        .text()
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      address: $(cells[6])?.text().trim() ?? '',
    })
  })

  return records
}

/**
 * Fetches and parses the MOH record for a given clinic legal name.
 * Returns null if no matching record is found.
 */
export async function fetchMOHRecord(clinicLegalName: string): Promise<NormalizedClinicData | null> {
  const html = await fetchSearchPage(clinicLegalName)
  const rawRecords = parseSearchResults(html)

  if (rawRecords.length === 0) return null

  // Take the first result — closest name match
  const raw = rawRecords[0]

  return {
    matchKey: clinicLegalName,
    registry: {
      source: 'turkish_ministry_of_health',
      licenseNumber: raw.licenseNumber,
      licenseStatus: normalizeLicenseStatus(raw.status),
      licensedSince: parseTurkishDate(raw.licensedSince),
      expiresAt: parseTurkishDate(raw.expiresAt),
      authorizedSpecialties: normalizeSpecialties(raw.specialties),
      registeredLegalName: raw.facilityName,
      registeredAddress: raw.address || null,
      registryUrl: `${MOH_SEARCH_URL}?q=${encodeURIComponent(clinicLegalName)}`,
      rawData: raw as unknown as Record<string, unknown>,
    },
    // MOH portal doesn't expose compliance history — handled separately if they publish it
    complianceEvents: [],
  }
}
