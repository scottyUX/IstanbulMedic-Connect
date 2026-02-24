import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import {
  getClinics,
  getClinicById,
  getClinicCities,
  getServiceCategories,
  type ClinicsQuery,
} from '@/lib/api/clinics';

// Mock the Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

// Helper to create a mock query builder with chainable methods
const createMockQueryBuilder = (data: unknown = [], error: unknown = null, count: number | null = null) => {
  const builder: Record<string, Mock> = {};

  const chainable = () => builder;

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.ilike = vi.fn().mockReturnValue(builder);
  builder.or = vi.fn().mockReturnValue(builder);
  builder.in = vi.fn().mockReturnValue(builder);
  builder.gte = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.range = vi.fn().mockResolvedValue({ data, error, count });
  builder.single = vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error });

  // For direct queries without range (like filter queries)
  builder.then = (resolve: (value: unknown) => unknown) => {
    return Promise.resolve({ data, error }).then(resolve);
  };

  return builder;
};

// Helper to create a mock Supabase client
const createMockSupabase = () => {
  const mockFrom = vi.fn();
  return {
    from: mockFrom,
    _mockFrom: mockFrom,
  };
};

describe('getClinics', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  const sampleClinicRow = {
    id: 'clinic-1',
    display_name: 'Test Clinic',
    primary_city: 'Istanbul',
    primary_country: 'Turkey',
    clinic_scores: [{ overall_score: 85, band: 'A' as const }],
    clinic_services: [
      { service_name: 'Hair Transplant', service_category: 'Hair', is_primary_service: true },
    ],
    clinic_languages: [{ language: 'English' }, { language: 'Turkish' }],
    clinic_credentials: [{ credential_name: 'JCI Accredited', credential_type: 'accreditation' }],
    clinic_media: [{ url: 'https://example.com/img.jpg', is_primary: true, display_order: 0, media_type: 'image' }],
  };

  it('returns empty result when no clinics found', async () => {
    const mockBuilder = createMockQueryBuilder([], null, 0);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result).toEqual({
      clinics: [],
      total: 0,
      page: 1,
      pageSize: 12,
    });
  });

  it('returns transformed clinic list items', async () => {
    const mockBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics).toHaveLength(1);
    expect(result.clinics[0]).toMatchObject({
      id: 'clinic-1',
      name: 'Test Clinic',
      location: 'Istanbul, Turkey',
      trustScore: 85,
      trustBand: 'A',
      specialties: expect.arrayContaining(['Hair Transplant']),
      languages: expect.arrayContaining(['English', 'Turkish']),
      accreditations: expect.arrayContaining(['JCI']),
    });
  });

  it('applies pagination correctly', async () => {
    const mockBuilder = createMockQueryBuilder([sampleClinicRow], null, 25);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({ page: 2, pageSize: 10 });

    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(mockBuilder.range).toHaveBeenCalledWith(10, 19); // (page-1)*pageSize to from+pageSize-1
  });

  it('clamps pageSize to valid range', async () => {
    const mockBuilder = createMockQueryBuilder([], null, 0);
    mockSupabase.from.mockReturnValue(mockBuilder);

    // Test max clamping
    await getClinics({ pageSize: 100 });
    expect(mockBuilder.range).toHaveBeenCalledWith(0, 49); // max is 50

    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);

    // Test min clamping
    await getClinics({ pageSize: 0 });
    expect(mockBuilder.range).toHaveBeenCalledWith(0, 0); // min is 1
  });

  it('applies location filter', async () => {
    const mockBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    await getClinics({ location: 'Istanbul' });

    expect(mockBuilder.or).toHaveBeenCalledWith(
      'primary_city.ilike.%istanbul%,primary_country.ilike.%istanbul%'
    );
  });

  it('handles search query filtering', async () => {
    // For search, multiple queries are made
    const nameMatchBuilder = createMockQueryBuilder([{ id: 'clinic-1' }], null);
    const serviceMatchBuilder = createMockQueryBuilder([{ clinic_id: 'clinic-1' }], null);
    const mainBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);

    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'clinics' && callCount === 0) {
        callCount++;
        return nameMatchBuilder;
      }
      if (table === 'clinic_services') {
        return serviceMatchBuilder;
      }
      return mainBuilder;
    });

    const result = await getClinics({ searchQuery: 'hair' });

    expect(mockSupabase.from).toHaveBeenCalledWith('clinics');
    expect(mockSupabase.from).toHaveBeenCalledWith('clinic_services');
    expect(result.clinics).toBeDefined();
  });

  it('returns empty result when search matches no clinics', async () => {
    const emptyBuilder = createMockQueryBuilder([], null);
    mockSupabase.from.mockReturnValue(emptyBuilder);

    const result = await getClinics({ searchQuery: 'nonexistent' });

    expect(result.clinics).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('applies language filter', async () => {
    const languageBuilder = createMockQueryBuilder([{ clinic_id: 'clinic-1' }], null);
    const mainBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'clinic_languages') return languageBuilder;
      return mainBuilder;
    });

    await getClinics({ languages: ['English', 'Arabic'] });

    expect(mockSupabase.from).toHaveBeenCalledWith('clinic_languages');
    expect(languageBuilder.in).toHaveBeenCalledWith('language', ['English', 'Arabic']);
  });

  it('applies trust score filter', async () => {
    const scoreBuilder = createMockQueryBuilder([{ clinic_id: 'clinic-1' }], null);
    const mainBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'clinic_scores') return scoreBuilder;
      return mainBuilder;
    });

    await getClinics({ minTrustScore: 80 });

    expect(mockSupabase.from).toHaveBeenCalledWith('clinic_scores');
    expect(scoreBuilder.gte).toHaveBeenCalledWith('overall_score', 80);
  });

  it('throws error on Supabase query failure', async () => {
    const errorBuilder = createMockQueryBuilder(null, { message: 'Database error' });
    mockSupabase.from.mockReturnValue(errorBuilder);

    await expect(getClinics({})).rejects.toThrow('Failed to fetch clinics: Database error');
  });

  it('applies sorting correctly', async () => {
    const mockBuilder = createMockQueryBuilder([sampleClinicRow], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    // Test Highest Rated sort
    await getClinics({ sort: 'Highest Rated' });
    expect(mockBuilder.order).toHaveBeenCalledWith('overall_score', {
      foreignTable: 'clinic_scores',
      ascending: false,
    });

    vi.clearAllMocks();
    mockSupabase.from.mockReturnValue(mockBuilder);

    // Test Price: Low to High sort
    await getClinics({ sort: 'Price: Low to High' });
    expect(mockBuilder.order).toHaveBeenCalledWith('display_name', { ascending: true });
  });

  it('handles clinic with no scores gracefully', async () => {
    const clinicNoScores = {
      ...sampleClinicRow,
      clinic_scores: null,
    };
    const mockBuilder = createMockQueryBuilder([clinicNoScores], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].trustScore).toBe(0);
    expect(result.clinics[0].trustBand).toBeNull();
  });

  it('handles clinic with no media gracefully', async () => {
    const clinicNoMedia = {
      ...sampleClinicRow,
      clinic_media: [],
    };
    const mockBuilder = createMockQueryBuilder([clinicNoMedia], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].image).toBeNull();
  });

  it('deduplicates languages', async () => {
    const clinicDuplicateLangs = {
      ...sampleClinicRow,
      clinic_languages: [
        { language: 'English' },
        { language: 'English' },
        { language: 'Turkish' },
      ],
    };
    const mockBuilder = createMockQueryBuilder([clinicDuplicateLangs], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].languages).toEqual(['English', 'Turkish']);
  });

  it('maps accreditations correctly', async () => {
    const clinicWithCreds = {
      ...sampleClinicRow,
      clinic_credentials: [
        { credential_name: 'JCI Accredited', credential_type: 'accreditation' },
        { credential_name: 'ISO 9001', credential_type: 'certification' },
        { credential_name: 'Ministry of Health License', credential_type: 'license' },
      ],
    };
    const mockBuilder = createMockQueryBuilder([clinicWithCreds], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].accreditations).toContain('JCI');
    expect(result.clinics[0].accreditations).toContain('ISO');
    expect(result.clinics[0].accreditations).toContain('Ministry Licensed');
  });
});

describe('getClinicById', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  const sampleFullClinic = {
    id: 'clinic-1',
    display_name: 'Test Clinic',
    legal_name: 'Test Clinic LLC',
    primary_city: 'Istanbul',
    primary_country: 'Turkey',
    website_url: 'https://testclinic.com',
    whatsapp_contact: '+905551234567',
    email_contact: 'info@testclinic.com',
    phone_contact: '+905551234567',
    status: 'active',
    years_in_operation: 10,
    procedures_performed: 5000,
    clinic_scores: [{ overall_score: 90, band: 'A' }],
    clinic_score_components: [{ component_name: 'transparency', score: 95 }],
    clinic_services: [
      { service_name: 'Hair Transplant', service_category: 'Hair', is_primary_service: true },
    ],
    clinic_locations: [
      { location_name: 'Main Office', is_primary: true },
    ],
    clinic_languages: [{ language: 'English' }],
    clinic_credentials: [{ credential_name: 'JCI', credential_type: 'accreditation' }],
    clinic_media: [{ url: 'https://example.com/img.jpg', is_primary: true, display_order: 0, media_type: 'image' }],
    clinic_mentions: [],
    clinic_facts: [],
    clinic_pricing: [],
    clinic_team: [],
    clinic_packages: [],
    clinic_reviews: [
      { rating: '4.5/5', review_text: 'Great experience' },
      { rating: '5/5', review_text: 'Excellent!' },
    ],
  };

  it('returns null when clinic not found', async () => {
    const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST116' });
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('nonexistent');

    expect(result).toBeNull();
  });

  it('returns transformed clinic detail', async () => {
    const mockBuilder = createMockQueryBuilder(sampleFullClinic, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result).not.toBeNull();
    expect(result!.id).toBe('clinic-1');
    expect(result!.name).toBe('Test Clinic');
    expect(result!.legalName).toBe('Test Clinic LLC');
    expect(result!.websiteUrl).toBe('https://testclinic.com');
    expect(result!.trustScore).toBe(90);
    expect(result!.trustBand).toBe('A');
    expect(result!.yearsInOperation).toBe(10);
    expect(result!.proceduresPerformed).toBe(5000);
  });

  it('calculates average rating from reviews', async () => {
    const mockBuilder = createMockQueryBuilder(sampleFullClinic, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    // (4.5 + 5) / 2 = 4.75
    expect(result!.rating).toBe(4.75);
  });

  it('handles clinic with no reviews', async () => {
    const clinicNoReviews = {
      ...sampleFullClinic,
      clinic_reviews: [],
    };
    const mockBuilder = createMockQueryBuilder(clinicNoReviews, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result!.rating).toBeUndefined();
  });

  it('uses primary location for location string', async () => {
    const mockBuilder = createMockQueryBuilder(sampleFullClinic, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result!.location).toBe('Main Office, Istanbul');
  });

  it('falls back to city/country when no locations', async () => {
    const clinicNoLocations = {
      ...sampleFullClinic,
      clinic_locations: [],
    };
    const mockBuilder = createMockQueryBuilder(clinicNoLocations, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result!.location).toBe('Istanbul, Turkey');
  });

  it('throws error on non-404 Supabase error', async () => {
    const mockBuilder = createMockQueryBuilder(null, { code: 'PGRST500', message: 'Server error' });
    mockSupabase.from.mockReturnValue(mockBuilder);

    await expect(getClinicById('clinic-1')).rejects.toThrow('Failed to fetch clinic: Server error');
  });

  it('extracts language names for display', async () => {
    const clinicMultiLang = {
      ...sampleFullClinic,
      clinic_languages: [
        { language: 'English' },
        { language: 'Turkish' },
        { language: 'Arabic' },
      ],
    };
    const mockBuilder = createMockQueryBuilder(clinicMultiLang, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result!.languageNames).toEqual(['English', 'Turkish', 'Arabic']);
  });

  it('returns all related data arrays', async () => {
    const mockBuilder = createMockQueryBuilder(sampleFullClinic, null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicById('clinic-1');

    expect(result!.services).toBeDefined();
    expect(result!.locations).toBeDefined();
    expect(result!.credentials).toBeDefined();
    expect(result!.media).toBeDefined();
    expect(result!.pricing).toBeDefined();
    expect(result!.team).toBeDefined();
    expect(result!.packages).toBeDefined();
    expect(result!.reviews).toBeDefined();
    expect(result!.scoreComponents).toBeDefined();
  });
});

describe('getClinicCities', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  it('returns sorted unique cities', async () => {
    const mockBuilder = createMockQueryBuilder([
      { primary_city: 'Istanbul' },
      { primary_city: 'Ankara' },
      { primary_city: 'Istanbul' }, // duplicate
      { primary_city: 'Izmir' },
    ], null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicCities();

    expect(result).toEqual(['Ankara', 'Istanbul', 'Izmir']);
  });

  it('returns empty array on error', async () => {
    const mockBuilder = createMockQueryBuilder(null, { message: 'Error' });
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicCities();

    expect(result).toEqual([]);
  });

  it('returns empty array when no clinics', async () => {
    const mockBuilder = createMockQueryBuilder([], null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinicCities();

    expect(result).toEqual([]);
  });

  it('only queries active clinics', async () => {
    const mockBuilder = createMockQueryBuilder([], null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    await getClinicCities();

    expect(mockBuilder.eq).toHaveBeenCalledWith('status', 'active');
  });
});

describe('getServiceCategories', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  it('returns sorted unique service categories', async () => {
    const mockBuilder = createMockQueryBuilder([
      { service_category: 'Hair' },
      { service_category: 'Dental' },
      { service_category: 'Hair' }, // duplicate
      { service_category: 'Cosmetic' },
    ], null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getServiceCategories();

    expect(result).toEqual(['Cosmetic', 'Dental', 'Hair']);
  });

  it('returns empty array on error', async () => {
    const mockBuilder = createMockQueryBuilder(null, { message: 'Error' });
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getServiceCategories();

    expect(result).toEqual([]);
  });

  it('returns empty array when no services', async () => {
    const mockBuilder = createMockQueryBuilder([], null);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getServiceCategories();

    expect(result).toEqual([]);
  });
});

// Test the helper functions indirectly through the main functions
describe('mapClinicRow (tested via getClinics)', () => {
  let mockSupabase: ReturnType<typeof createMockSupabase>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabase();
    (createClient as Mock).mockResolvedValue(mockSupabase);
  });

  it('handles score as single object instead of array', async () => {
    const clinicSingleScore = {
      id: 'clinic-1',
      display_name: 'Test Clinic',
      primary_city: 'Istanbul',
      primary_country: 'Turkey',
      clinic_scores: { overall_score: 75, band: 'B' as const }, // Single object, not array
      clinic_services: [],
      clinic_languages: [],
      clinic_credentials: [],
      clinic_media: [],
    };
    const mockBuilder = createMockQueryBuilder([clinicSingleScore], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].trustScore).toBe(75);
    expect(result.clinics[0].trustBand).toBe('B');
  });

  it('falls back to "Medical Tourism" when no specialties', async () => {
    const clinicNoServices = {
      id: 'clinic-1',
      display_name: 'Test Clinic',
      primary_city: 'Istanbul',
      primary_country: 'Turkey',
      clinic_scores: null,
      clinic_services: [],
      clinic_languages: [],
      clinic_credentials: [],
      clinic_media: [],
    };
    const mockBuilder = createMockQueryBuilder([clinicNoServices], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].specialties).toEqual(['Medical Tourism']);
  });

  it('limits specialties to 4 items', async () => {
    const clinicManyServices = {
      id: 'clinic-1',
      display_name: 'Test Clinic',
      primary_city: 'Istanbul',
      primary_country: 'Turkey',
      clinic_scores: null,
      clinic_services: [
        { service_name: 'Service 1', service_category: 'Cat 1', is_primary_service: true },
        { service_name: 'Service 2', service_category: 'Cat 2', is_primary_service: true },
        { service_name: 'Service 3', service_category: 'Cat 3', is_primary_service: true },
        { service_name: 'Service 4', service_category: 'Cat 4', is_primary_service: true },
        { service_name: 'Service 5', service_category: 'Cat 5', is_primary_service: true },
        { service_name: 'Service 6', service_category: 'Cat 6', is_primary_service: true },
      ],
      clinic_languages: [],
      clinic_credentials: [],
      clinic_media: [],
    };
    const mockBuilder = createMockQueryBuilder([clinicManyServices], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    expect(result.clinics[0].specialties).toHaveLength(4);
  });

  it('sorts media by is_primary and display_order', async () => {
    const clinicMultiMedia = {
      id: 'clinic-1',
      display_name: 'Test Clinic',
      primary_city: 'Istanbul',
      primary_country: 'Turkey',
      clinic_scores: null,
      clinic_services: [],
      clinic_languages: [],
      clinic_credentials: [],
      clinic_media: [
        { url: 'https://example.com/3.jpg', is_primary: false, display_order: 0, media_type: 'image' },
        { url: 'https://example.com/1.jpg', is_primary: true, display_order: 2, media_type: 'image' },
        { url: 'https://example.com/2.jpg', is_primary: false, display_order: 1, media_type: 'image' },
      ],
    };
    const mockBuilder = createMockQueryBuilder([clinicMultiMedia], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    // Primary image should be first regardless of display_order
    expect(result.clinics[0].image).toBe('https://example.com/1.jpg');
  });

  it('filters out non-image media', async () => {
    const clinicMixedMedia = {
      id: 'clinic-1',
      display_name: 'Test Clinic',
      primary_city: 'Istanbul',
      primary_country: 'Turkey',
      clinic_scores: null,
      clinic_services: [],
      clinic_languages: [],
      clinic_credentials: [],
      clinic_media: [
        { url: 'https://example.com/video.mp4', is_primary: true, display_order: 0, media_type: 'video' },
        { url: 'https://example.com/img.jpg', is_primary: false, display_order: 1, media_type: 'image' },
      ],
    };
    const mockBuilder = createMockQueryBuilder([clinicMixedMedia], null, 1);
    mockSupabase.from.mockReturnValue(mockBuilder);

    const result = await getClinics({});

    // Should pick the image, not the video
    expect(result.clinics[0].image).toBe('https://example.com/img.jpg');
  });
});
