import { describe, it, expect } from 'vitest'
import { parseRows } from '@/scripts/ingest-registry/sources/moh-pdf'

// Simulates the tab-separated text output from pdf-parse v2 CJS
// Format per row: NUMBER PROVINCE NAME\tTYPE\tADDRESS\tPHONE
const SAMPLE_TEXT = `
SIRA NO İL SAĞLIK TESİSİ ADI SAĞLIK TESİSİ TÜRÜ ADRES TELEFON
1 İstanbul Özel Cosmedica Tıp Merkezi\tÖzel Tıp Merkezi\tEsentepe Mah. Kore Şehitleri Cad. No:2/1 Şişli/İstanbul\t0 537 433 00 18
2 İstanbul Özel Dr. Cinik Tıp Merkezi\tÖzel Tıp Merkezi\tGayrettepe Mah. Mevlüt Pehlivan Cad. No:23
Şişli/İstanbul
0 212 999 88 77
3 Ankara Özel Medipark Tıp Merkezi\tÖzel Tıp Merkezi\tReşit Galip Cad. No:10 Küçükesat/Ankara\t0 312 446 88 89
`

describe('parseRows', () => {
  it('returns one row per numbered entry', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows).toHaveLength(3)
  })

  it('extracts siraNo correctly', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].siraNo).toBe('1')
    expect(rows[1].siraNo).toBe('2')
    expect(rows[2].siraNo).toBe('3')
  })

  it('extracts province (il) correctly', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].il).toBe('İSTANBUL')
    expect(rows[2].il).toBe('ANKARA')
  })

  it('extracts facility name (saglikTesisiAdi) without type or address', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].saglikTesisiAdi).toBe('Özel Cosmedica Tıp Merkezi')
  })

  it('extracts facility type (saglikTesisiTuru)', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].saglikTesisiTuru).toBe('Özel Tıp Merkezi')
  })

  it('extracts phone number', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].telefon).toBe('05374330018')
  })

  it('extracts address without phone number', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[0].adres).not.toContain('0 537')
    expect(rows[0].adres).toContain('Esentepe')
  })

  it('handles multi-line rows (address on continuation lines)', () => {
    const rows = parseRows(SAMPLE_TEXT)
    expect(rows[1].saglikTesisiAdi).toBe('Özel Dr. Cinik Tıp Merkezi')
    expect(rows[1].adres).toContain('Gayrettepe')
  })

  it('skips header lines and non-row lines', () => {
    const rows = parseRows(SAMPLE_TEXT)
    // No row should have siraNo matching header text
    expect(rows.every((r) => /^\d+$/.test(r.siraNo))).toBe(true)
  })

  it('returns empty array for empty text', () => {
    expect(parseRows('')).toEqual([])
  })
})
