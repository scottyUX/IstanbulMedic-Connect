/**
 * Turkish Ministry of Health — PDF registry parser
 *
 * Parses the MOH "Tıp Merkezleri" (Medical Centers) PDF which lists
 * registered private health facilities with columns:
 *
 *   SIRA NO | İL | SAĞLIK TESİSİ ADI | SAĞLIK TESİSİ TÜRÜ | ADRES | TELEFON
 *
 * Usage:
 *   npx tsx scripts/ingest-registry/index.ts --source=moh-pdf --file=data/moh-registry.pdf
 *
 * The PDF lists all currently registered facilities, so all entries are
 * treated as license_status = 'active'.
 *
 * Since the PDF has no license number column, we derive a stable key from
 * the row number (SIRA NO) prefixed with "MOH-".
 */

import fs from 'fs'
import { createRequire } from 'module'
import { NormalizedClinicData, normalizeSpecialties } from '../normalize'

// pdfjs-dist (pdf-parse dependency) needs DOMMatrix which isn't in Node.js — stub it
if (typeof globalThis.DOMMatrix === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).DOMMatrix = class {
    a=1;b=0;c=0;d=1;e=0;f=0
    m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0
    m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1
    is2D=true;isIdentity=true
    transformPoint(p: {x:number;y:number}) { return p }
    multiply() { return this }
    inverse() { return this }
    translate() { return this }
    scale() { return this }
    rotate() { return this }
  }
}

// pdf-parse is CJS-only; use createRequire to load it from ESM context
const require = createRequire(import.meta.url)
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse } = require('pdf-parse') as { PDFParse: new (opts: { data: Buffer }) => { getText(): Promise<{ text: string }> } }

export interface MOHPDFRow {
  siraNo: string
  il: string
  saglikTesisiAdi: string
  saglikTesisiTuru: string
  adres: string
  telefon: string
}

/**
 * Maps Turkish facility type strings to normalized specialty labels.
 */
function mapFacilityType(tur: string): string[] {
  const lower = tur.toLowerCase().trim()

  if (lower.includes('saç') || lower.includes('trikolo')) return ['Hair Transplant']
  if (lower.includes('estetik') || lower.includes('plastik')) return ['Aesthetic Surgery']
  if (lower.includes('diş') || lower.includes('ağız')) return ['Dentistry']
  if (lower.includes('göz') || lower.includes('oftalmoloji')) return ['Ophthalmology']
  if (lower.includes('ortopedi')) return ['Orthopedics']
  if (lower.includes('tıp merkezi') || lower.includes('poliklinik')) return ['General Medical Center']
  return [tur.trim()]
}

/**
 * Parses raw PDF text into structured rows.
 *
 * The MOH PDF renders each row across 1-3 lines depending on address length.
 * We detect row boundaries by looking for lines that start with a number
 * followed by a Turkish province name (İL).
 */
export function parseRows(text: string): MOHPDFRow[] {
  const rows: MOHPDFRow[] = []
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // Turkish provinces (İL) used to detect row starts
  const TURKISH_PROVINCES = new Set([
    'ADANA', 'ADIYAMAN', 'AFYONKARAHİSAR', 'AĞRI', 'AKSARAY', 'AMASYA', 'ANKARA',
    'ANTALYA', 'ARDAHAN', 'ARTVİN', 'AYDIN', 'BALIKESİR', 'BARTIN', 'BATMAN',
    'BAYBURT', 'BİLECİK', 'BİNGÖL', 'BİTLİS', 'BOLU', 'BURDUR', 'BURSA',
    'ÇANAKKALE', 'ÇANKIRI', 'ÇORUM', 'DENİZLİ', 'DİYARBAKIR', 'DÜZCE', 'EDİRNE',
    'ELAZIĞ', 'ERZİNCAN', 'ERZURUM', 'ESKİŞEHİR', 'GAZİANTEP', 'GİRESUN',
    'GÜMÜŞHANE', 'HAKKARİ', 'HATAY', 'IĞDIR', 'ISPARTA', 'İSTANBUL', 'İZMİR',
    'KAHRAMANMARAŞ', 'KARABÜK', 'KARAMAN', 'KARS', 'KASTAMONU', 'KAYSERİ',
    'KİLİS', 'KİRKLARELİ', 'KİRŞEHİR', 'KOCAELİ', 'KONYA', 'KÜTAHYA', 'MALATYA',
    'MANİSA', 'MARDİN', 'MERSİN', 'MUĞLA', 'MUŞ', 'NEVŞEHİR', 'NİĞDE', 'ORDU',
    'OSMANİYE', 'RİZE', 'SAKARYA', 'SAMSUN', 'SİİRT', 'SİNOP', 'SİVAS',
    'ŞANLIURFA', 'ŞIRNAK', 'TEKİRDAĞ', 'TOKAT', 'TRABZON', 'TUNCELİ', 'UŞAK',
    'VAN', 'YALOVA', 'YOZGAT', 'ZONGULDAK',
  ])

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Row starts with a number (SIRA NO)
    const siraMatch = line.match(/^(\d+)\s+(.+)$/)
    if (!siraMatch) { i++; continue }

    const siraNo = siraMatch[1]
    const rest = siraMatch[2].toUpperCase()

    // Next token should be a province name
    const province = [...TURKISH_PROVINCES].find((p) => rest.startsWith(p))
    if (!province) { i++; continue }

    // Everything after the province on this line
    const afterProvince = siraMatch[2].slice(province.length).trim()

    // Collect continuation lines (address overflow) until next numbered row
    let j = i + 1
    while (j < lines.length && !lines[j].match(/^\d+\s+/)) {
      j++
    }
    const continuationLines = lines.slice(i + 1, j)

    // The PDF uses tabs to separate columns: NAME \t TYPE \t ADDRESS \t PHONE
    // Some rows have the address/phone on continuation lines instead
    const tabParts = afterProvince.split('\t').map((s) => s.trim())

    const saglikTesisiAdi = tabParts[0] ?? ''

    // tabParts[1] is TYPE, but may include address run-on when the tab is missing
    let saglikTesisiTuru = ''
    let inlineAdres = ''
    if (tabParts[1]) {
      // TYPE is always "Tıp Merkezi" or "Özel Tıp Merkezi"; anything after it is address
      const typeMatch = tabParts[1].match(/^((?:Özel\s+)?Tıp\s+Merkezi)(.*)/i)
      if (typeMatch) {
        saglikTesisiTuru = typeMatch[1].trim()
        inlineAdres = typeMatch[2].trim()
      } else {
        saglikTesisiTuru = tabParts[1]
      }
    }

    // tabParts[2] is ADDRESS (if present as its own tab column)
    if (tabParts[2]) inlineAdres = [inlineAdres, tabParts[2]].filter(Boolean).join(' ')

    // tabParts[3] is PHONE (if present as its own tab column)
    const inlinePhone = tabParts[3] ?? ''

    // Merge inline address with any continuation lines
    const fullAdresAndPhone = [inlineAdres, ...continuationLines, inlinePhone]
      .filter(Boolean)
      .join(' ')
      .trim()

    // Extract trailing phone number
    const phoneMatch = fullAdresAndPhone.match(/(\d[\d\s\-()]{6,14}\d)\s*$/)
    const telefon = phoneMatch ? phoneMatch[1].replace(/\s+/g, '') : inlinePhone.replace(/\s+/g, '')
    const adres = phoneMatch
      ? fullAdresAndPhone.slice(0, fullAdresAndPhone.lastIndexOf(phoneMatch[0])).trim()
      : fullAdresAndPhone.trim()

    rows.push({
      siraNo,
      il: province,
      saglikTesisiAdi: saglikTesisiAdi.trim(),
      saglikTesisiTuru: saglikTesisiTuru.trim(),
      adres,
      telefon,
    })

    i = j
  }

  return rows
}

/**
 * Reads the MOH PDF file and returns normalized clinic data ready for upserting.
 */
export async function parseMOHPdf(filePath: string): Promise<NormalizedClinicData[]> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`)
  }

  const buffer = fs.readFileSync(filePath)
  const { text } = await new PDFParse({ data: buffer }).getText()

  const rows = parseRows(text)
  console.log(`  Parsed ${rows.length} rows from PDF`)

  return rows
    .filter((row) => row.saglikTesisiAdi)
    .map((row) => ({
      matchKey: row.saglikTesisiAdi,
      registry: {
        source: 'turkish_ministry_of_health' as const,
        licenseNumber: `MOH-${row.siraNo}`,
        licenseStatus: 'active' as const,       // published registry = currently registered
        licensedSince: null,                    // not in this PDF
        expiresAt: null,                        // not in this PDF
        authorizedSpecialties: normalizeSpecialties(mapFacilityType(row.saglikTesisiTuru)),
        registeredLegalName: row.saglikTesisiAdi,
        registeredAddress: [row.adres, row.il].filter(Boolean).join(', ') || null,
        registryUrl: null,
        rawData: row as unknown as Record<string, unknown>,
      },
      complianceEvents: [],
    }))
}
