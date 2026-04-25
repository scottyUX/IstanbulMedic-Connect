import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';
import type { InstagramSignalsData } from '@/components/istanbulmedic-connect/profile/InstagramSignalsCard';
import { getInstagramSignals } from './instagram';
import { getForumSignals, type ClinicForumProfile } from './forumSignals';

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
type ClinicGooglePlacesRow = Tables<'clinic_google_places'>;
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
  | 'Lowest Rated'
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
  description: string | null;  // null for unscraped clinics
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
  /** Instagram signals data for trust indicators (null if no Instagram data exists) */
  instagramSignals: InstagramSignalsData | null;
  /** Reddit community signals (null if no Reddit data exists) */
  redditSignals: ClinicForumProfile | null;
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
type ClinicGooglePlacesPartial = Pick<ClinicGooglePlacesRow, 'rating' | 'user_ratings_total'>;
type ClinicScrapedDataPartial = { description: string | null; techniques: string[] | null };

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
  clinic_google_places?: ClinicGooglePlacesPartial[] | ClinicGooglePlacesPartial | null;
  clinic_scraped_data?: ClinicScrapedDataPartial[] | ClinicScrapedDataPartial | null;
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

  // Get rating from clinic_google_places (direct columns)
  const googlePlaces = Array.isArray(clinic.clinic_google_places)
    ? clinic.clinic_google_places[0]
    : clinic.clinic_google_places;

  const scrapedData = Array.isArray(clinic.clinic_scraped_data)
    ? clinic.clinic_scraped_data[0]
    : clinic.clinic_scraped_data;

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
    description: scrapedData?.description ?? null,
    rating: googlePlaces?.rating ?? undefined,
    reviewCount: googlePlaces?.user_ratings_total ?? undefined,
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
  // These sorts require the view for proper ORDER BY
  const needsViewSort = sort === 'Highest Rated' || sort === 'Lowest Rated' || sort === 'Best Match' || sort === 'Most Transparent';

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

  // Filter by minimum rating and/or minimum reviews using clinic_google_places
  if (typeof minRating === 'number' || typeof minReviews === 'number') {
    let ratingQuery = supabase
      .from('clinic_google_places')
      .select('clinic_id');

    if (typeof minRating === 'number') {
      ratingQuery = ratingQuery.gte('rating', minRating);
    }
    if (typeof minReviews === 'number') {
      ratingQuery = ratingQuery.gte('user_ratings_total', minReviews);
    }

    const { data: ratingData, error: ratingError } = await ratingQuery;

    if (ratingError) {
      console.error('Error filtering clinics by rating/reviews:', ratingError);
      throw new Error(`Failed to filter clinics: ${ratingError.message}`);
    }

    const ratingFilteredIds = (ratingData ?? []).map((row) => row.clinic_id);
    filteredIds = applyIdFilter(filteredIds, ratingFilteredIds);
  }

  if (filteredIds && filteredIds.size === 0) {
    return { clinics: [], total: 0, page, pageSize };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // For sorts that need score/rating, use the view to get sorted IDs first
  let sortedClinicIds: string[] | null = null;
  let totalCount = 0;

  if (needsViewSort) {
    // Query the view for sorted, paginated clinic IDs
    // Note: Regenerate Supabase types after applying the view migration
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewQuery = (supabase.from as any)('clinics_with_scores')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    if (filteredIds) {
      viewQuery = viewQuery.in('id', Array.from(filteredIds));
    }

    if (locationQuery) {
      viewQuery = viewQuery.or(
        `primary_city.ilike.%${locationQuery}%,primary_country.ilike.%${locationQuery}%`
      );
    }

    // Apply sort on the view (direct column access, no referencedTable needed)
    switch (sort) {
      case 'Highest Rated':
        viewQuery = viewQuery
          .order('google_rating', { ascending: false, nullsFirst: false })
          .order('google_review_count', { ascending: false, nullsFirst: false })
          .order('display_name', { ascending: true });
        break;
      case 'Lowest Rated':
        viewQuery = viewQuery
          .order('google_rating', { ascending: true, nullsFirst: false })
          .order('google_review_count', { ascending: true, nullsFirst: false })
          .order('display_name', { ascending: true });
        break;
      case 'Best Match':
      case 'Most Transparent':
        viewQuery = viewQuery
          .order('overall_score', { ascending: false, nullsFirst: false })
          .order('display_name', { ascending: true });
        break;
    }

    const { data: sortedRows, error: viewError, count: viewCount } = await viewQuery.range(from, to) as {
      data: { id: string }[] | null;
      error: Error | null;
      count: number | null;
    };

    if (viewError) {
      console.error('Error fetching sorted clinic IDs:', viewError);
      throw new Error(`Failed to fetch clinics: ${viewError.message}`);
    }

    if (!sortedRows || sortedRows.length === 0) {
      return { clinics: [], total: viewCount ?? 0, page, pageSize };
    }

    sortedClinicIds = sortedRows.map((row) => row.id);
    totalCount = viewCount ?? 0;
  }

  // Build main query for full clinic data with relations
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
      clinic_google_places (
        rating,
        user_ratings_total
      ),
      clinic_scraped_data (
        description,
        techniques
      )
    `,
      { count: needsViewSort ? undefined : 'exact' }
    )
    .eq('status', 'active');

  if (needsViewSort && sortedClinicIds) {
    // Use the pre-sorted IDs from the view query
    queryBuilder = queryBuilder.in('id', sortedClinicIds);
  } else {
    // Apply filters directly for non-view sorts
    if (filteredIds) {
      queryBuilder = queryBuilder.in('id', Array.from(filteredIds));
    }

    if (locationQuery) {
      queryBuilder = queryBuilder.or(
        `primary_city.ilike.%${locationQuery}%,primary_country.ilike.%${locationQuery}%`
      );
    }
  }

  // Apply sort for non-view sorts
  if (!needsViewSort) {
    switch (sort) {
      case 'Alphabetical':
        queryBuilder = queryBuilder.order('display_name', { ascending: true });
        break;
      case 'Price: Low to High':
        queryBuilder = queryBuilder.order('display_name', { ascending: true });
        break;
      case 'Price: High to Low':
        queryBuilder = queryBuilder.order('display_name', { ascending: false });
        break;
      default:
        queryBuilder = queryBuilder.order('display_name', { ascending: true });
        break;
    }
  }

  const { data: clinics, error, count } = needsViewSort
    ? await queryBuilder
    : await queryBuilder.range(from, to);

  if (error) {
    console.error('Error fetching clinics:', error);
    throw new Error(`Failed to fetch clinics: ${error.message}`);
  }

  if (!clinics) return { clinics: [], total: 0, page, pageSize };

  let mappedClinics = clinics.map(mapClinicRow);

  // For view-based sorts, preserve the order from sortedClinicIds
  if (needsViewSort && sortedClinicIds) {
    const idOrder = new Map(sortedClinicIds.map((id, index) => [id, index]));
    mappedClinics = mappedClinics.sort((a, b) => {
      const aIndex = idOrder.get(a.id) ?? 999;
      const bIndex = idOrder.get(b.id) ?? 999;
      return aIndex - bIndex;
    });
  }

  return {
    clinics: mappedClinics,
    total: needsViewSort ? totalCount : (count ?? 0),
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
      clinic_google_places (*),
      clinic_pricing (*),
      clinic_team (*),
      clinic_packages (*),
      clinic_reviews (*, sources (source_name, source_type)),
      clinic_scraped_data (*)
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

  // Get rating and review count from clinic_google_places
  const googlePlaces = Array.isArray(clinic.clinic_google_places)
    ? (clinic.clinic_google_places as ClinicGooglePlacesRow[])[0]
    : (clinic.clinic_google_places as ClinicGooglePlacesRow | null);

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

  // Fetch Instagram signals data (returns null if no Instagram profile exists)
  const instagramSignals = await getInstagramSignals(clinic.id);

  // Fetch Reddit signals data (returns null if no Reddit profile exists)
  const redditSignals = await getForumSignals(clinic.id, 'reddit');

  const scrapedData = Array.isArray(clinic.clinic_scraped_data)
    ? clinic.clinic_scraped_data[0]
    : (clinic.clinic_scraped_data as unknown as { description: string | null; techniques: string[] | null } | null);

  return {
    id: clinic.id,
    name: clinic.display_name,
    legalName: clinic.legal_name,
    location: locationStr,
    image: imageUrl,
    specialties: specialties.length > 0 ? specialties : ['Medical Tourism'],
    trustScore: score?.overall_score ?? 0,
    trustBand: score?.band ?? null,
    description: scrapedData?.description ?? null,
    rating: googlePlaces?.rating ?? undefined,
    reviewCount: googlePlaces?.user_ratings_total ?? undefined,
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
    totalReviewCount: googlePlaces?.user_ratings_total ?? 0,
    instagramSignals,
    redditSignals,
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