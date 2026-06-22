// lib/scoring/metrics/credentials.ts
// Derives a credentials score from clinic_team and clinic_team_qualifications.
//
// Score is based on:
// - Whether the clinic has any verified qualifications at all
// - Number of distinct verified qualifications (breadth)
// - Source authority (ISHRS and similar = higher weight)
// - Recency of verification (verified in last 2 years = full credit)

export interface TeamMemberRaw {
  id: string;
  role: string;
  last_verified_at: string | null;
}

export interface QualificationRaw {
  team_member_id: string;
  qualification: string;
  source: string;
  verified_at: string | null;
}

export interface CredentialsMetrics {
  credentials_score: number; // 0–100
  verified_qualification_count: number;
  has_authoritative_credential: boolean;
}

// Sources considered authoritative — add more as you discover them
const AUTHORITATIVE_SOURCES = [
  "ishrs",
  "abhrs",
  "ebopras",
  "tprecd",   // Turkish board-certified plastic surgeons association
  "iahrs",    // International Alliance of Hair Restoration Surgeons
  "turkish_medical_association",
  "ministry_of_health",
];

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

function isRecent(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() < TWO_YEARS_MS;
}

function isAuthoritative(source: string): boolean {
  return AUTHORITATIVE_SOURCES.includes(source.toLowerCase());
}

export function computeCredentialsMetrics(
  teamMembers: TeamMemberRaw[],
  qualifications: QualificationRaw[]
): CredentialsMetrics {
  if (!teamMembers.length || !qualifications.length) {
    return {
      credentials_score: 0,
      verified_qualification_count: 0,
      has_authoritative_credential: false,
    };
  }

  const has_authoritative_credential = qualifications.some((q) =>
    isAuthoritative(q.source)
  );

  // Score each qualification and sum up
  let rawScore = 0;

  for (const q of qualifications) {
    let points = 10; // base points per qualification

    if (isAuthoritative(q.source)) points += 20;   // authoritative source bonus
    if (isRecent(q.verified_at)) points += 10;      // recently verified bonus

    rawScore += points;
  }

  // Diminishing returns — additional qualifications matter less after ~5
  // Scale so that ~5 strong qualifications → ~80, 10+ → ~100
  const credentials_score = Math.round(
    Math.min((rawScore / (qualifications.length + 5)) * 25, 100)
  );

  return {
    credentials_score,
    verified_qualification_count: qualifications.length,
    has_authoritative_credential,
  };
}
