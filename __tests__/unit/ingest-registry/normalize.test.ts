import { describe, it, expect } from 'vitest'
import {
  parseTurkishDate,
  normalizeLicenseStatus,
  normalizeSpecialties,
} from '@/scripts/ingest-registry/normalize'

describe('parseTurkishDate', () => {
  it('parses DD.MM.YYYY format', () => {
    expect(parseTurkishDate('15.06.2023')).toBe('2023-06-15')
  })

  it('parses DD/MM/YYYY format', () => {
    expect(parseTurkishDate('01/01/2020')).toBe('2020-01-01')
  })

  it('passes through ISO format unchanged', () => {
    expect(parseTurkishDate('2024-03-10')).toBe('2024-03-10')
  })

  it('returns null for null input', () => {
    expect(parseTurkishDate(null)).toBeNull()
  })

  it('returns null for undefined input', () => {
    expect(parseTurkishDate(undefined)).toBeNull()
  })

  it('returns null for unparseable string', () => {
    expect(parseTurkishDate('not a date')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseTurkishDate('')).toBeNull()
  })
})

describe('normalizeLicenseStatus', () => {
  it('recognizes Turkish "aktif"', () => {
    expect(normalizeLicenseStatus('aktif')).toBe('active')
  })

  it('recognizes English "active"', () => {
    expect(normalizeLicenseStatus('active')).toBe('active')
  })

  it('recognizes "geçerli"', () => {
    expect(normalizeLicenseStatus('geçerli')).toBe('active')
  })

  it('recognizes "askıya" as suspended', () => {
    expect(normalizeLicenseStatus('askıya alındı')).toBe('suspended')
  })

  it('recognizes "iptal" as revoked', () => {
    expect(normalizeLicenseStatus('iptal edildi')).toBe('revoked')
  })

  it('recognizes "süresi dolmuş" as expired', () => {
    expect(normalizeLicenseStatus('süresi dolmuş')).toBe('expired')
  })

  it('returns pending for unknown string', () => {
    expect(normalizeLicenseStatus('belirsiz')).toBe('pending')
  })

  it('returns pending for null', () => {
    expect(normalizeLicenseStatus(null)).toBe('pending')
  })

  it('is case-insensitive', () => {
    expect(normalizeLicenseStatus('AKTİF')).toBe('active')
  })
})

describe('normalizeSpecialties', () => {
  it('maps Turkish "saç ekimi" to Hair Transplant', () => {
    expect(normalizeSpecialties(['saç ekimi'])).toEqual(['Hair Transplant'])
  })

  it('maps "estetik cerrahi" to Aesthetic Surgery', () => {
    expect(normalizeSpecialties(['estetik cerrahi'])).toEqual(['Aesthetic Surgery'])
  })

  it('maps "plastik cerrahi" to Plastic Surgery', () => {
    expect(normalizeSpecialties(['plastik cerrahi'])).toEqual(['Plastic Surgery'])
  })

  it('passes through unknown specialties unchanged', () => {
    expect(normalizeSpecialties(['Kardiyoloji'])).toEqual(['Kardiyoloji'])
  })

  it('handles a mix of known and unknown', () => {
    expect(normalizeSpecialties(['saç ekimi', 'Kardiyoloji'])).toEqual([
      'Hair Transplant',
      'Kardiyoloji',
    ])
  })

  it('filters out empty strings', () => {
    expect(normalizeSpecialties(['', 'saç ekimi'])).toEqual(['Hair Transplant'])
  })

  it('returns empty array for empty input', () => {
    expect(normalizeSpecialties([])).toEqual([])
  })
})
