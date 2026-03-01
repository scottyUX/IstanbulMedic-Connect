import { createClient } from '@/lib/supabase/server';
import type { Tables, Json } from '@/lib/supabase/database.types';
import { aggregateClinicRatings } from './clinicRatings';

// Database row types
type ClinicRow = Tables<'clinics'>;
type ClinicScoreRow = Tables<'clinic_scores'>;
type ClinicServiceRow = Tables<'clinic_services'>;
type ClinicLocationRow = Tables<'clinic_locations'>;
type ClinicLanguageRow = Tables<'clinic_languages'>;
type ClinicCredentialRow = Tables<'clinic_credentials'>;
type ClinicMediaRow = Tables<'clinic_media'>;
type ClinicMentionRow = Tables<'clinic_mentions'>;
type ClinicFactRow = Tables<'clinic_facts'>;
type SourceRow = Tables<'sources'>;
type ClinicPricingRow = Tables<'clinic_pricing'>;
type ClinicTeamRow = Tables<'clinic_team'>;
type ClinicPackageRow = Tables<'clinic_packages'>;
type ClinicReviewRow = Tables<'clinic_reviews'>;
type ClinicScoreComponentRow = Tables<'clinic_score_components'>;

export type ClinicSortOption =
  | 'Alphabetical'
  | 'Best Match'
  | 'Highest Rated'
  | 'Most Transparent'
  | 'Price: Low to High'
  | 'Price: High to Low';

export interface ClinicsQuery {
  searchQuery?: string;
  location?: string;
  treatments?: string[];
  languages?: string[];
  accreditations?: string[];
  minTrustScore?: number;
  minRating?: number;
  minReviews?: number;
  page?: number;
  pageSize?: number;
  sort?: ClinicSortOption;
}

export interface ClinicsResult {
  clinics: ClinicListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// UI types (what components expect)
export interface ClinicListItem {
  id: string;
  name: string;
  location: string;
  image: string | null;
  specialties: string[];
  languages: string[];
  accreditations: string[];
  trustScore: number;
  trustBand: 'A' | 'B' | 'C' | 'D' | null;
  description: string;
  rating?: number;
  reviewCount?: number;
  aiInsight?: string;
}

export interface ClinicDetail extends Omit<ClinicListItem, 'languages'> {
  legalName: string | null;
  websiteUrl: string | null;
  whatsappContact: string | null;
  emailContact: string | null;
  phoneContact: string | null;
  status: ClinicRow['status'];
  locations: ClinicLocationRow[];
  services: ClinicServiceRow[];
  languages: ClinicLanguageRow[];
  languageNames: string[]; // Derived string array for display
  credentials: ClinicCredentialRow[];
  media: ClinicMediaRow[];
  mentions: (ClinicMentionRow & { sources?: SourceRow | SourceRow[] | null })[];
  facts: ClinicFactRow[];
  pricing: ClinicPricingRow[];
  team: ClinicTeamRow[];
  packages: ClinicPackageRow[];
  reviews: (ClinicReviewRow & { sources?: { source_name: string; source_type: string } | null })[];
  scoreComponents: ClinicScoreComponentRow[];
  yearsInOperation: number | null;
  proceduresPerformed: number | null;
  /** Total review count from clinic_facts (actual Google total, not scraped count) */
  totalReviewCount: number;
}

const normalizeString = (value?: string | null) => value?.trim().toLowerCase() ?? '';

const applyIdFilter = (current: Set<string> | null, nextIds: string[]) => {
  if (nextIds.length === 0) return new Set<string>();
  const nextSet = new Set(nextIds);
  if (!current) return nextSet;
  return new Set([...current].filter((id) => nextSet.has(id)));
};

// Partial types matching what we select in the list query
type ClinicScorePartial = Pick<ClinicScoreRow, 'overall_score' | 'band'>;
type ClinicServicePartial = Pick<ClinicServiceRow, 'service_name' | 'service_category' | 'is_primary_service'>;
type ClinicLanguagePartial = Pick<ClinicLanguageRow, 'language'>;
type ClinicCredentialPartial = Pick<ClinicCredentialRow, 'credential_type' | 'credential_name'>;
type ClinicMediaPartial = Pick<ClinicMediaRow, 'url' | 'is_primary' | 'display_order' | 'media_type'>;
type ClinicFactPartial = Pick<ClinicFactRow, 'fact_key' | 'fact_value'>;

type ClinicListQueryRow = {
  id: string;
  display_name: string;
  primary_city: string;
  primary_country: string;
  clinic_scores?: ClinicScorePartial[] | ClinicScorePartial | null;
  clinic_services?: ClinicServicePartial[] | null;
  clinic_languages?: ClinicLanguagePartial[] | null;
  clinic_credentials?: ClinicCredentialPartial[] | null;
  clinic_media?: ClinicMediaPartial[] | null;
  clinic_facts?: ClinicFactPartial[] | null;
};

const mapClinicRow = (clinic: ClinicListQueryRow): ClinicListItem => {
  const score = Array.isArray(clinic.clinic_scores)
    ? clinic.clinic_scores[0]
    : clinic.clinic_scores;

  const services = Array.isArray(clinic.clinic_services)
    ? clinic.clinic_services
    : [];

  const specialties: string[] = [
    ...services.filter((s) => s.is_primary_service).map((s) => s.service_name as string),
    ...services.filter((s) => !s.is_primary_service).map((s) => s.service_category as string),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);

  const languageRows = Array.isArray(clinic.clinic_languages)
    ? clinic.clinic_languages
    : [];
  const languages = languageRows
    .map((l) => l.language)
    .filter((v, i, a) => v && a.indexOf(v) === i);

  const credentialRows = Array.isArray(clinic.clinic_credentials)
    ? clinic.clinic_credentials
    : [];

  const accreditations = credentialRows
    .map((c): string | null => {
      const name = (c.credential_name || '').toLowerCase();
      const type = (c.credential_type || '').toLowerCase();

      if (name.includes('jci')) return 'JCI';
      if (name.includes('iso')) return 'ISO';
      if (type === 'license' && name.includes('ministry')) return 'Ministry Licensed';
      if (name.includes('ministry')) return 'Ministry Licensed';
      return null;
    })
    .filter((v): v is string => v !== null)
    .filter((v, i, a) => a.indexOf(v) === i);

  const mediaRows = Array.isArray(clinic.clinic_media) ? clinic.clinic_media : [];
  const imageMedia = mediaRows
    .filter((m) => m.media_type === 'image')
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });
  const imageUrl = imageMedia[0]?.url ?? null;

  // Aggregate rating from clinic_facts (Google rating, etc.)
  const factRows = Array.isArray(clinic.clinic_facts) ? clinic.clinic_facts : [];
  const ratingData = aggregateClinicRatings(factRows);

  return {
    id: clinic.id,
    name: clinic.display_name,
    location: `${clinic.primary_city}, ${clinic.primary_country}`,
    image: imageUrl,
    specialties: specialties.length > 0 ? specialties : ['Medical Tourism'],
    languages,
    accreditations,
    trustScore: score?.overall_score ?? 0,
    trustBand: score?.band ?? null,
    description: `Quality healthcare clinic in ${clinic.primary_city}.`,
    rating: ratingData.rating ?? undefined,
    reviewCount: ratingData.reviewCount > 0 ? ratingData.reviewCount : undefined,
    aiInsight: undefined,
  };
};

/**
 * Fetches active clinics with server-side filtering + pagination
 */
export async function getClinics(query: ClinicsQuery = {}): Promise<ClinicsResult> {
  const supabase = await createClient();

  const pageSize = Math.max(1, Math.min(query.pageSize ?? 12, 50));
  const page = Math.max(1, query.page ?? 1);
  const sort = query.sort ?? 'Best Match';

  const searchQuery = normalizeString(query.searchQuery);
  const locationQuery = normalizeString(query.location);
  const selectedTreatments = (query.treatments ?? []).map((t) => t.trim()).filter(Boolean);
  const selectedLanguages = (query.languages ?? []).map((l) => l.trim()).filter(Boolean);
  const selectedAccreditations = (query.accreditations ?? []).map((a) => a.trim()).filter(Boolean);
  const minTrustScore = typeof query.minTrustScore === 'number' ? query.minTrustScore : undefined;
  const minRating = typeof query.minRating === 'number' ? query.minRating : undefined;
  const minReviews = typeof query.minReviews === 'number' ? query.minReviews : undefined;

  let filteredIds: Set<string> | null = null;

  if (searchQuery) {
    // TODO: Implement smart search with text normalization/synonyms to map
    // user input like "hair", "fue", "dhi" to service enums like "Hair Transplant".
    // For now, just search by clinic display name.
    const { data: nameMatches, error: nameError } = await supabase
      .from('clinics')
      .select('id')
      .ilike('display_name', `%${searchQuery}%`)
      .eq('status', 'active');

    if (nameError) {
      console.error('Error searching clinics by name:', nameError);
      throw new Error(`Failed to search clinics: ${nameError.message}`);
    }

    const searchIds = (nameMatches ?? []).map((row: { id: string }) => row.id);
    filteredIds = applyIdFilter(filteredIds, searchIds);
  }

  if (selectedTreatments.length > 0) {
    const treatmentCategories = new Map<string, string>([
      ['Hair Transplant', 'Hair Transplant'],
      ['Dental', 'Dental'],
      ['Cosmetic Surgery', 'Cosmetic'],
      ['Eye Surgery', 'Eye Surgery'],
      ['Bariatric Surgery', 'Bariatric Surgery'],
    ]);

    const serviceNames = selectedTreatments
      .map((t) => treatmentCategories.get(t))
      .filter((v): v is string => v === 'Hair Transplant');
    const serviceCategories = selectedTreatments
      .map((t) => treatmentCategories.get(t))
      .filter((v): v is string => v !== undefined && v !== 'Hair Transplant');

    let treatmentIds: string[] = [];

    if (serviceNames.length > 0) {
      const { data, error } = await supabase
        .from('clinic_services')
        .select('clinic_id')
        .in('service_name', serviceNames as ClinicServiceRow['service_name'][]);
      if (error) {
        console.error('Error filtering clinics by service name:', error);
        throw new Error(`Failed to filter clinics: ${error.message}`);
      }
      treatmentIds = treatmentIds.concat((data ?? []).map((row) => row.clinic_id));
    }

    if (serviceCategories.length > 0) {
      const { data, error } = await supabase
        .from('clinic_services')
        .select('clinic_id')
        .in('service_category', serviceCategories as ClinicServiceRow['service_category'][]);
      if (error) {
        console.error('Error filtering clinics by service category:', error);
        throw new Error(`Failed to filter clinics: ${error.message}`);
      }
      treatmentIds = treatmentIds.concat((data ?? []).map((row) => row.clinic_id));
    }

    filteredIds = applyIdFilter(filteredIds, Array.from(new Set(treatmentIds)));
  }

  if (selectedLanguages.length > 0) {
    const { data, error } = await supabase
      .from('clinic_languages')
      .select('clinic_id')
      .in('language', selectedLanguages as ClinicLanguageRow['language'][]);

    if (error) {
      console.error('Error filtering clinics by languages:', error);
      throw new Error(`Failed to filter clinics: ${error.message}`);
    }

    const languageIds = (data ?? []).map((row) => row.clinic_id);
    filteredIds = applyIdFilter(filteredIds, languageIds);
  }

  if (selectedAccreditations.length > 0) {
    const { data, error } = await supabase
      .from('clinic_credentials')
      .select('clinic_id, credential_type, credential_name');

    if (error) {
      console.error('Error filtering clinics by accreditations:', error);
      throw new Error(`Failed to filter clinics: ${error.message}`);
    }

    const accreditationIds = (data ?? [])
      .filter((row) => {
        const name = (row.credential_name || '').toLowerCase();
        const type = (row.credential_type || '').toLowerCase();

        return selectedAccreditations.some((acc) => {
          const accLower = acc.toLowerCase();
          if (accLower === 'jci') return name.includes('jci');
          if (accLower === 'iso') return name.includes('iso');
          if (accLower === 'ministry licensed') {
            return type === 'license' || name.includes('ministry');
          }
          return false;
        });
      })
      .map((row) => row.clinic_id);

    filteredIds = applyIdFilter(filteredIds, Array.from(new Set(accreditationIds)));
  }

  if (typeof minTrustScore === 'number') {
    const { data, error } = await supabase
      .from('clinic_scores')
      .select('clinic_id')
      .gte('overall_score', minTrustScore);

    if (error) {
      console.error('Error filtering clinics by trust score:', error);
      throw new Error(`Failed to filter clinics: ${error.message}`);
    }

    const scoreIds = (data ?? []).map((row) => row.clinic_id);
    filteredIds = applyIdFilter(filteredIds, scoreIds);
  }

  // Filter by minimum rating and/or minimum reviews using clinic_facts
  if (typeof minRating === 'number' || typeof minReviews === 'number') {
    const { data: factsData, error: factsError } = await supabase
      .from('clinic_facts')
      .select('clinic_id, fact_key, fact_value')
      .in('fact_key', ['google_rating', 'google_review_count']);

    if (factsError) {
      console.error('Error filtering clinics by rating/reviews:', factsError);
      throw new Error(`Failed to filter clinics: ${factsError.message}`);
    }

    // Helper to extract number from fact_value (handles { "value": X } format)
    const extractNumber = (factValue: unknown): number | null => {
      if (factValue === null || factValue === undefined) return null;
      if (typeof factValue === 'number') return factValue;
      if (typeof factValue === 'string') {
        const parsed = parseFloat(factValue);
        return Number.isNaN(parsed) ? null : parsed;
      }
      // Handle { "value": X } format
      if (typeof factValue === 'object' && factValue !== null && 'value' in factValue) {
        const inner = (factValue as { value: unknown }).value;
        if (typeof inner === 'number') return inner;
        if (typeof inner === 'string') {
          const parsed = parseFloat(inner);
          return Number.isNaN(parsed) ? null : parsed;
        }
      }
      return null;
    };

    // Group facts by clinic_id
    const clinicFactsMap = new Map<string, { rating: number | null; reviewCount: number }>();
    for (const fact of factsData ?? []) {
      if (!clinicFactsMap.has(fact.clinic_id)) {
        clinicFactsMap.set(fact.clinic_id, { rating: null, reviewCount: 0 });
      }
      const entry = clinicFactsMap.get(fact.clinic_id)!;
      if (fact.fact_key === 'google_rating') {
        entry.rating = extractNumber(fact.fact_value);
      } else if (fact.fact_key === 'google_review_count') {
        entry.reviewCount = extractNumber(fact.fact_value) ?? 0;
      }
    }

    // Filter clinic IDs based on criteria
    const ratingFilteredIds = Array.from(clinicFactsMap.entries())
      .filter(([, data]) => {
        if (typeof minRating === 'number' && (data.rating === null || data.rating < minRating)) {
          return false;
        }
        if (typeof minReviews === 'number' && data.reviewCount < minReviews) {
          return false;
        }
        return true;
      })
      .map(([clinicId]) => clinicId);

    filteredIds = applyIdFilter(filteredIds, ratingFilteredIds);
  }

  if (filteredIds && filteredIds.size === 0) {
    return { clinics: [], total: 0, page, pageSize };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let queryBuilder = supabase
    .from('clinics')
    .select(
      `
      id,
      display_name,
      primary_city,
      primary_country,
      clinic_services (
        service_name,
        service_category,
        is_primary_service
      ),
      clinic_languages (
        language
      ),
      clinic_credentials (
        credential_type,
        credential_name
      ),
      clinic_media (
        url,
        is_primary,
        display_order,
        media_type
      ),
      clinic_scores (
        overall_score,
        band
      ),
      clinic_facts (
        fact_key,
        fact_value
      )
    `,
      { count: 'exact' }
    )
    .eq('status', 'active');

  if (filteredIds) {
    queryBuilder = queryBuilder.in('id', Array.from(filteredIds));
  }

  if (locationQuery) {
    queryBuilder = queryBuilder.or(
      `primary_city.ilike.%${locationQuery}%,primary_country.ilike.%${locationQuery}%`
    );
  }

  switch (sort) {
    case 'Alphabetical':
      queryBuilder = queryBuilder.order('display_name', { ascending: true });
      break;
    case 'Highest Rated':
      // TODO: Currently sorts by trust score. Will sort by rating once DB view is created.
      queryBuilder = queryBuilder.order('overall_score', {
        foreignTable: 'clinic_scores',
        ascending: false,
      });
      break;
    case 'Most Transparent':
    case 'Best Match':
      queryBuilder = queryBuilder.order('overall_score', {
        foreignTable: 'clinic_scores',
        ascending: false,
      });
      break;
    case 'Price: Low to High':
      queryBuilder = queryBuilder.order('display_name', { ascending: true });
      break;
    case 'Price: High to Low':
      queryBuilder = queryBuilder.order('display_name', { ascending: false });
      break;
    default:
      break;
  }

  const { data: clinics, error, count } = await queryBuilder.range(from, to);

  if (error) {
    console.error('Error fetching clinics:', error);
    throw new Error(`Failed to fetch clinics: ${error.message}`);
  }

  if (!clinics) return { clinics: [], total: 0, page, pageSize };

  return {
    clinics: clinics.map(mapClinicRow),
    total: count ?? 0,
    page,
    pageSize,
  };
}

/**
 * Fetches detailed info for a single clinic by ID
 */
export async function getClinicById(clinicId: string): Promise<ClinicDetail | null> {
  const supabase = await createClient();

  const { data: clinic, error } = await supabase
    .from('clinics')
    .select(`
      *,
      clinic_services (*),
      clinic_scores (*),
      clinic_score_components (*),
      clinic_locations (*),
      clinic_languages (*),
      clinic_credentials (*),
      clinic_media (*),
      clinic_mentions (*, sources (source_type, source_name, url, author_handle)),
      clinic_facts (*),
      clinic_pricing (*),
      clinic_team (*),
      clinic_packages (*),
      clinic_reviews (*, sources (source_name, source_type))
    `)
    .eq('id', clinicId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching clinic:', error);
    throw new Error(`Failed to fetch clinic: ${error.message}`);
  }

  if (!clinic) return null;

  // Extract related data
  const services = (clinic.clinic_services as ClinicServiceRow[]) || [];
  const score = Array.isArray(clinic.clinic_scores)
    ? (clinic.clinic_scores[0] as ClinicScoreRow)
    : (clinic.clinic_scores as ClinicScoreRow | null);
  const locations = (clinic.clinic_locations as ClinicLocationRow[]) || [];
  const languages = (clinic.clinic_languages as ClinicLanguageRow[]) || [];
  const credentials = (clinic.clinic_credentials as ClinicCredentialRow[]) || [];
  const media = (clinic.clinic_media as ClinicMediaRow[]) || [];
  const mentions =
    (clinic.clinic_mentions as (ClinicMentionRow & { sources?: SourceRow | SourceRow[] | null })[]) ||
    [];
  const facts = (clinic.clinic_facts as ClinicFactRow[]) || [];
  const pricing = (clinic.clinic_pricing as ClinicPricingRow[]) || [];
  const team = (clinic.clinic_team as ClinicTeamRow[]) || [];
  const packages = (clinic.clinic_packages as ClinicPackageRow[]) || [];
  const reviews = (clinic.clinic_reviews as (ClinicReviewRow & { sources?: { source_name: string; source_type: string } | null })[]) || [];
  const scoreComponents = (clinic.clinic_score_components as ClinicScoreComponentRow[]) || [];

  // Get rating and review count from clinic_facts (not calculated from scraped reviews)
  const ratingData = aggregateClinicRatings(facts);

  // Build specialties
  const specialties: string[] = [
    ...services.filter((s) => s.is_primary_service).map((s) => s.service_name as string),
    ...services.filter((s) => !s.is_primary_service).map((s) => s.service_category as string),
  ]
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);

  // Build language names for display
  const languageNames = languages
    .map((l) => l.language)
    .filter((v, i, a) => v && a.indexOf(v) === i);

  // Build accreditations from credentials
  const accreditations = credentials
    .map((c): string | null => {
      const name = (c.credential_name || '').toLowerCase();
      const type = (c.credential_type || '').toLowerCase();

      if (name.includes('jci')) return 'JCI';
      if (name.includes('iso')) return 'ISO';
      if (type === 'license' && name.includes('ministry')) return 'Ministry Licensed';
      if (name.includes('ministry')) return 'Ministry Licensed';
      return null;
    })
    .filter((v): v is string => v !== null)
    .filter((v, i, a) => a.indexOf(v) === i);

  // Get primary location
  const primaryLocation = locations.find((l) => l.is_primary) || locations[0];
  const locationStr = primaryLocation
    ? `${primaryLocation.location_name}, ${clinic.primary_city}`
    : `${clinic.primary_city}, ${clinic.primary_country}`;

  const imageMedia = media
    .filter((m) => m.media_type === 'image')
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.display_order ?? 0) - (b.display_order ?? 0);
    });
  const imageUrl = imageMedia[0]?.url ?? null;

  return {
    id: clinic.id,
    name: clinic.display_name,
    legalName: clinic.legal_name,
    location: locationStr,
    image: imageUrl,
    specialties: specialties.length > 0 ? specialties : ['Medical Tourism'],
    trustScore: score?.overall_score ?? 0,
    trustBand: score?.band ?? null,
    description: `${clinic.display_name} - Quality healthcare in ${clinic.primary_city}.`,
    rating: ratingData.rating ?? undefined,
    reviewCount: ratingData.reviewCount > 0 ? ratingData.reviewCount : undefined,
    aiInsight: undefined,
    accreditations,
    websiteUrl: clinic.website_url,
    whatsappContact: clinic.whatsapp_contact,
    emailContact: clinic.email_contact,
    phoneContact: clinic.phone_contact,
    status: clinic.status,
    locations,
    services,
    languages,
    languageNames,
    credentials,
    media,
    mentions,
    facts,
    pricing,
    team,
    packages,
    reviews,
    scoreComponents,
    yearsInOperation: clinic.years_in_operation,
    proceduresPerformed: clinic.procedures_performed,
    totalReviewCount: ratingData.reviewCount,
  };
}

/**
 * Fetches all unique cities where active clinics are located
 */
export async function getClinicCities(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinics')
    .select('primary_city')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching cities:', error);
    return [];
  }

  const cities = [...new Set(data?.map((c) => c.primary_city) || [])];
  return cities.sort();
}

/**
 * Fetches all service categories
 */
export async function getServiceCategories(): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('clinic_services')
    .select('service_category');

  if (error) {
    console.error('Error fetching service categories:', error);
    return [];
  }

  const categories = [...new Set(data?.map((s) => s.service_category) || [])];
  return categories.sort();
}
