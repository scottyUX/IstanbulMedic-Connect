import { describe, it, expect, vi, beforeEach } from 'vitest';

// ===========================================================================
// Mock data fixtures
// ===========================================================================

const MOCK_CLINIC = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  display_name: 'Vera Clinic',
  legal_name: 'Vera Clinic Ltd.',
  status: 'active',
  primary_city: 'Istanbul',
  primary_country: 'Turkey',
  description: 'A leading hair transplant clinic in Istanbul.',
  short_description: 'Leading hair transplant clinic.',
  website_url: 'https://veraclinic.net',
  phone_contact: '+90 555 123 4567',
  email_contact: 'info@veraclinic.net',
  whatsapp_contact: '+90 555 123 4567',
  years_in_operation: 10,
  procedures_performed: 25000,
  thumbnail_url: 'https://example.com/thumb.jpg',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const MOCK_CLINIC_MINIMAL = {
  id: '660e8400-e29b-41d4-a716-446655440001',
  display_name: 'Basic Clinic',
  legal_name: null,
  status: 'active',
  primary_city: 'Ankara',
  primary_country: 'Turkey',
  description: null,
  short_description: null,
  website_url: null,
  phone_contact: null,
  email_contact: null,
  whatsapp_contact: null,
  years_in_operation: null,
  procedures_performed: null,
  thumbnail_url: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-01T00:00:00Z',
};

const MOCK_LOCATION = {
  city: 'Istanbul',
  country: 'Turkey',
  address_line: '123 Medical Ave, Sisli',
  postal_code: '34394',
  opening_hours: { mon: '09:00-18:00' },
  payment_methods: ['credit_card', 'bank_transfer'],
  is_primary: true,
};

const MOCK_SERVICES = [
  { service_name: 'Hair Transplant', service_category: 'Medical Tourism', is_primary_service: true },
  { service_name: 'Other', service_category: 'Cosmetic', is_primary_service: false },
];

const MOCK_CREDENTIALS = [
  {
    credential_name: 'JCI Accreditation',
    credential_type: 'accreditation',
    issuing_body: 'Joint Commission International',
    valid_from: '2023-01-01',
    valid_to: '2026-01-01',
  },
  {
    credential_name: 'Turkish Ministry License',
    credential_type: 'license',
    issuing_body: null,
    valid_from: null,
    valid_to: null,
  },
];

const MOCK_PRICING = [
  {
    service_name: 'FUE Hair Transplant',
    price_min: 1500,
    price_max: 3000,
    currency: 'EUR',
    pricing_type: 'range',
    is_verified: true,
  },
];

const MOCK_PACKAGES = [
  {
    package_name: 'Premium Package',
    includes: ['hotel', 'transport', 'PRP'],
    excludes: ['flights'],
    nights_included: 3,
    transport_included: true,
    aftercare_duration_days: 365,
    price_min: 2500,
    price_max: 4000,
    currency: 'EUR',
  },
];

const MOCK_SCORE = {
  overall_score: 85,
  band: 'A',
};

const MOCK_LANGUAGES = [
  { language: 'English', support_type: 'staff' },
  { language: 'Arabic', support_type: 'translator' },
];

const MOCK_TEAM = [
  { name: 'Dr. Ahmet Yilmaz', role: 'surgeon', credentials: 'MD, ISHRS Fellow', years_experience: 15 },
  { name: null, role: 'coordinator', credentials: 'Patient coordinator', years_experience: null },
];

// ===========================================================================
// Supabase mock setup
// ===========================================================================

const { mockCreateClient } = vi.hoisted(() => {
  const mockCreateClient = vi.fn();
  return { mockCreateClient };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

/**
 * Helper to build a mock Supabase client with configurable responses
 * per table. Each table mock supports chained .select().eq().eq().limit() etc.
 */
function buildMockSupabase(overrides: Record<string, unknown> = {}) {
  const defaults: Record<string, { data: unknown; error: unknown; count?: number }> = {
    clinics: { data: [MOCK_CLINIC], error: null },
    clinic_locations: { data: [MOCK_LOCATION], error: null },
    clinic_services: { data: MOCK_SERVICES, error: null },
    clinic_credentials: { data: MOCK_CREDENTIALS, error: null },
    clinic_pricing: { data: MOCK_PRICING, error: null },
    clinic_packages: { data: MOCK_PACKAGES, error: null },
    clinic_scores: { data: [MOCK_SCORE], error: null },
    clinic_languages: { data: MOCK_LANGUAGES, error: null },
    clinic_team: { data: MOCK_TEAM, error: null },
    clinic_reviews: { data: null, error: null, count: 42 },
  };

  const tableResults = { ...defaults, ...overrides };

  function chainFor(table: string) {
    const result = tableResults[table] ?? { data: [], error: null };
    // Create an object that returns itself for any chained method,
    // but resolves to the result when awaited (via .then)
    const chain: Record<string, unknown> = {};
    const chainProxy = new Proxy(chain, {
      get(_target, prop) {
        if (prop === 'then') {
          // Make it thenable — resolves to the table result
          return (resolve: (val: unknown) => void) => resolve(result);
        }
        // Any method call returns the chain itself
        return () => chainProxy;
      },
    });
    return chainProxy;
  }

  return {
    from: vi.fn((table: string) => chainFor(table)),
  };
}

import { clinicSummaryTool } from '@/lib/agents/langchain/tools/clinicSummary';

// ===========================================================================
// Tests
// ===========================================================================

describe('clinicSummaryTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // Tool metadata
  // =========================================================================

  describe('metadata', () => {
    it('has the correct name', () => {
      expect(clinicSummaryTool.name).toBe('clinic_summary');
    });

    it('description mentions key summary fields', () => {
      const desc = clinicSummaryTool.description;
      expect(desc).toContain('clinic_id');
      expect(desc).toContain('clinic_name');
      expect(desc).toContain('accreditations');
      expect(desc).toContain('pricing');
      expect(desc).toContain('overview');
    });
  });

  // =========================================================================
  // Schema validation
  // =========================================================================

  describe('schema validation', () => {
    it('rejects when neither clinic_id nor clinic_name is provided', async () => {
      await expect(clinicSummaryTool.invoke({})).rejects.toThrow();
    });

    it('rejects invalid UUID for clinic_id', async () => {
      await expect(
        clinicSummaryTool.invoke({ clinic_id: 'not-a-uuid' })
      ).rejects.toThrow();
    });

    it('accepts a valid UUID for clinic_id', async () => {
      const mockSupabase = buildMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({
        clinic_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      const parsed = JSON.parse(result);
      expect(parsed.summary).toBeDefined();
    });

    it('accepts a clinic_name string', async () => {
      const mockSupabase = buildMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);
      expect(parsed.summary).toBeDefined();
    });
  });

  // =========================================================================
  // Clinic resolution
  // =========================================================================

  describe('clinic resolution', () => {
    it('looks up clinic by ID', async () => {
      const mockSupabase = buildMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({
        clinic_id: '550e8400-e29b-41d4-a716-446655440000',
      });
      const parsed = JSON.parse(result);

      expect(parsed.summary.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(parsed.summary.display_name).toBe('Vera Clinic');
    });

    it('looks up clinic by name', async () => {
      const mockSupabase = buildMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      expect(parsed.summary.display_name).toBe('Vera Clinic');
    });

    it('prefers active clinic when name search returns multiple', async () => {
      const inactiveClinic = { ...MOCK_CLINIC, id: 'inactive-id', status: 'inactive' };
      const activeClinic = { ...MOCK_CLINIC, id: 'active-id', status: 'active' };

      const mockSupabase = buildMockSupabase({
        clinics: { data: [inactiveClinic, activeClinic], error: null },
      });
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      expect(parsed.summary.id).toBe('active-id');
    });

    it('returns error when no clinic is found', async () => {
      const mockSupabase = buildMockSupabase({
        clinics: { data: [], error: null },
      });
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Nonexistent' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('No clinic found matching the given criteria');
      expect(parsed.metadata.clinic_name).toBe('Nonexistent');
    });

    it('returns error when clinic lookup has a database error', async () => {
      const mockSupabase = buildMockSupabase({
        clinics: { data: null, error: { message: 'DB error' } },
      });
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('No clinic found matching the given criteria');
    });
  });

  // =========================================================================
  // Full summary — all fields populated
  // =========================================================================

  describe('full summary with all data', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any>;

    beforeEach(async () => {
      const mockSupabase = buildMockSupabase();
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      parsed = JSON.parse(result);
    });

    it('includes core clinic info', () => {
      expect(parsed.summary.id).toBe(MOCK_CLINIC.id);
      expect(parsed.summary.display_name).toBe('Vera Clinic');
      expect(parsed.summary.status).toBe('active');
      expect(parsed.summary.description).toBe(MOCK_CLINIC.description);
      expect(parsed.summary.short_description).toBe(MOCK_CLINIC.short_description);
      expect(parsed.summary.website_url).toBe(MOCK_CLINIC.website_url);
      expect(parsed.summary.years_in_operation).toBe(10);
      expect(parsed.summary.procedures_performed).toBe(25000);
    });

    it('includes contact info', () => {
      expect(parsed.summary.contact).toEqual({
        phone: MOCK_CLINIC.phone_contact,
        email: MOCK_CLINIC.email_contact,
        whatsapp: MOCK_CLINIC.whatsapp_contact,
      });
    });

    it('includes primary location', () => {
      expect(parsed.summary.location).toEqual({
        city: 'Istanbul',
        country: 'Turkey',
        address: '123 Medical Ave, Sisli',
        postal_code: '34394',
        opening_hours: { mon: '09:00-18:00' },
        payment_methods: ['credit_card', 'bank_transfer'],
      });
    });

    it('includes specialties', () => {
      expect(parsed.summary.specialties).toHaveLength(2);
      expect(parsed.summary.specialties[0]).toEqual({
        service_name: 'Hair Transplant',
        service_category: 'Medical Tourism',
        is_primary: true,
      });
    });

    it('includes accreditations with null fields stripped', () => {
      expect(parsed.summary.accreditations).toHaveLength(2);
      // First credential has all fields
      expect(parsed.summary.accreditations[0]).toEqual({
        credential_name: 'JCI Accreditation',
        credential_type: 'accreditation',
        issuing_body: 'Joint Commission International',
        valid_from: '2023-01-01',
        valid_to: '2026-01-01',
      });
      // Second credential has nulls stripped
      expect(parsed.summary.accreditations[1]).toEqual({
        credential_name: 'Turkish Ministry License',
        credential_type: 'license',
      });
    });

    it('includes pricing', () => {
      expect(parsed.summary.pricing).toHaveLength(1);
      expect(parsed.summary.pricing[0]).toEqual({
        service_name: 'FUE Hair Transplant',
        price_min: 1500,
        price_max: 3000,
        currency: 'EUR',
        pricing_type: 'range',
        is_verified: true,
      });
    });

    it('includes packages', () => {
      expect(parsed.summary.packages).toHaveLength(1);
      expect(parsed.summary.packages[0].package_name).toBe('Premium Package');
      expect(parsed.summary.packages[0].nights_included).toBe(3);
      expect(parsed.summary.packages[0].transport_included).toBe(true);
    });

    it('includes trust score', () => {
      expect(parsed.summary.score).toEqual({
        overall_score: 85,
        band: 'A',
      });
    });

    it('includes languages', () => {
      expect(parsed.summary.languages).toHaveLength(2);
      expect(parsed.summary.languages[0]).toEqual({
        language: 'English',
        support_type: 'staff',
      });
    });

    it('includes team with null fields stripped', () => {
      expect(parsed.summary.team).toHaveLength(2);
      expect(parsed.summary.team[0]).toEqual({
        name: 'Dr. Ahmet Yilmaz',
        role: 'surgeon',
        credentials: 'MD, ISHRS Fellow',
        years_experience: 15,
      });
      // Second team member has nulls stripped
      expect(parsed.summary.team[1]).toEqual({
        role: 'coordinator',
        credentials: 'Patient coordinator',
      });
    });

    it('includes review count', () => {
      expect(parsed.summary.review_count).toBe(42);
    });

    it('includes metadata with timing', () => {
      expect(parsed.metadata).toBeDefined();
      expect(typeof parsed.metadata.tookMs).toBe('number');
    });
  });

  // =========================================================================
  // Minimal summary — only required fields, no optional data
  // =========================================================================

  describe('minimal summary (sparse data)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any>;

    beforeEach(async () => {
      const mockSupabase = buildMockSupabase({
        clinics: { data: [MOCK_CLINIC_MINIMAL], error: null },
        clinic_locations: { data: [], error: null },
        clinic_services: { data: [], error: null },
        clinic_credentials: { data: [], error: null },
        clinic_pricing: { data: [], error: null },
        clinic_packages: { data: [], error: null },
        clinic_scores: { data: [], error: null },
        clinic_languages: { data: [], error: null },
        clinic_team: { data: [], error: null },
        clinic_reviews: { data: null, error: null, count: 0 },
      });
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Basic' });
      parsed = JSON.parse(result);
    });

    it('includes required fields', () => {
      expect(parsed.summary.id).toBe(MOCK_CLINIC_MINIMAL.id);
      expect(parsed.summary.display_name).toBe('Basic Clinic');
      expect(parsed.summary.status).toBe('active');
    });

    it('omits null optional fields (no hallucination fallback)', () => {
      expect(parsed.summary.description).toBeUndefined();
      expect(parsed.summary.short_description).toBeUndefined();
      expect(parsed.summary.website_url).toBeUndefined();
      expect(parsed.summary.years_in_operation).toBeUndefined();
      expect(parsed.summary.procedures_performed).toBeUndefined();
      expect(parsed.summary.contact).toBeUndefined();
    });

    it('omits empty related data arrays', () => {
      expect(parsed.summary.location).toBeUndefined();
      expect(parsed.summary.specialties).toBeUndefined();
      expect(parsed.summary.accreditations).toBeUndefined();
      expect(parsed.summary.pricing).toBeUndefined();
      expect(parsed.summary.packages).toBeUndefined();
      expect(parsed.summary.score).toBeUndefined();
      expect(parsed.summary.languages).toBeUndefined();
      expect(parsed.summary.team).toBeUndefined();
      expect(parsed.summary.review_count).toBeUndefined();
    });
  });

  // =========================================================================
  // Error handling
  // =========================================================================

  describe('error handling', () => {
    it('returns error JSON when createClient throws', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('Missing Supabase env'));

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Missing Supabase env');
      expect(parsed.metadata.clinic_name).toBe('Vera');
    });

    it('still builds summary even if some related queries fail', async () => {
      // Credentials and pricing fail, but everything else succeeds
      const mockSupabase = buildMockSupabase({
        clinic_credentials: { data: null, error: { message: 'timeout' } },
        clinic_pricing: { data: null, error: { message: 'timeout' } },
      });
      mockCreateClient.mockResolvedValue(mockSupabase);

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      // Summary should still be returned
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.display_name).toBe('Vera Clinic');
      // Failed tables should be omitted (null data treated as empty)
      expect(parsed.summary.accreditations).toBeUndefined();
      expect(parsed.summary.pricing).toBeUndefined();
      // Successful tables should still be present
      expect(parsed.summary.specialties).toBeDefined();
      expect(parsed.summary.languages).toBeDefined();
    });

    it('returns metadata with timing even on error', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('fail'));

      const result = await clinicSummaryTool.invoke({ clinic_name: 'Vera' });
      const parsed = JSON.parse(result);

      expect(parsed.metadata.tookMs).toBeDefined();
      expect(typeof parsed.metadata.tookMs).toBe('number');
    });
  });

  // =========================================================================
  // Integration with agent tool registration
  // =========================================================================

  describe('agent integration', () => {
    it('can be imported and used as a LangChain tool', () => {
      expect(clinicSummaryTool.name).toBe('clinic_summary');
      expect(typeof clinicSummaryTool.invoke).toBe('function');
      expect(clinicSummaryTool.schema).toBeDefined();
    });
  });
});
