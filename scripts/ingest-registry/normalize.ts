/**
 * Normalizes raw registry data from the Turkish Ministry of Health (MOH)
 * into a consistent shape before upserting to the database.
 */

export type RegistrySource = 'turkish_ministry_of_health'
export type LicenseStatus = 'active' | 'expired' | 'suspended' | 'revoked' | 'pending'
export type ComplianceEventType =
  | 'disciplinary_action'
  | 'license_suspension'
  | 'license_revocation'
  | 'warning'
  | 'fine'
  | 'reinstatement'
  | 'audit_finding'
export type ComplianceSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface NormalizedRegistryRecord {
  source: RegistrySource
  licenseNumber: string
  licenseStatus: LicenseStatus
  licensedSince: string | null   // ISO date string YYYY-MM-DD
  expiresAt: string | null
  authorizedSpecialties: string[]
  registeredLegalName: string | null
  registeredAddress: string | null
  registryUrl: string | null
  rawData: Record<string, unknown>
}

export interface NormalizedComplianceEvent {
  source: RegistrySource
  eventType: ComplianceEventType
  eventDate: string              // ISO date string YYYY-MM-DD
  description: string | null
  resolvedAt: string | null
  severity: ComplianceSeverity
  rawData: Record<string, unknown>
}

export interface NormalizedClinicData {
  matchKey: string               // The value used to match against our clinics table (e.g. legal name)
  registry: NormalizedRegistryRecord
  complianceEvents: NormalizedComplianceEvent[]
}

// ─── Date helpers ────────────────────────────────────────────────────────────

/**
 * Parses Turkish-format dates (DD.MM.YYYY or DD/MM/YYYY) into ISO format.
 * Returns null if unparseable.
 */
export function parseTurkishDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // DD.MM.YYYY or DD/MM/YYYY
  const match = trimmed.match(/^(\d{2})[./](\d{2})[./](\d{4})$/)
  if (match) {
    const [, day, month, year] = match
    return `${year}-${month}-${day}`
  }

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  return null
}

/**
 * Maps Turkish license status strings to our enum values.
 */
export function normalizeLicenseStatus(raw: string | null | undefined): LicenseStatus {
  if (!raw) return 'pending'
  // Turkish İ lowercases to i + U+0307 (combining dot above) in Unicode — normalize it to plain i
  const lower = raw.toLowerCase().replace(/i\u0307/g, 'i').trim()

  if (lower.includes('aktif') || lower.includes('active') || lower.includes('geçerli')) return 'active'
  if (lower.includes('askıya') || lower.includes('suspend')) return 'suspended'
  if (lower.includes('iptal') || lower.includes('revok')) return 'revoked'
  if (lower.includes('süresi dolmuş') || lower.includes('expire')) return 'expired'
  return 'pending'
}

/**
 * Normalizes specialty strings from Turkish to consistent English labels.
 */
export function normalizeSpecialties(raw: string[]): string[] {
  const map: Record<string, string> = {
    'saç ekimi': 'Hair Transplant',
    'estetik cerrahi': 'Aesthetic Surgery',
    'diş': 'Dentistry',
    'ortopedi': 'Orthopedics',
    'göz': 'Ophthalmology',
    'plastik cerrahi': 'Plastic Surgery',
  }

  return raw
    .map((s) => {
      const lower = s.toLowerCase().trim()
      return map[lower] ?? s.trim()
    })
    .filter(Boolean)
}
