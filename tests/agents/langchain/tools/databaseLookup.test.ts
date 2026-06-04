import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available inside the vi.mock factory
const {
  mockCreateClient,
  mockFrom,
  mockSelect,
  mockEq,
  mockOr,
  mockOrder,
  mockLimit,
  mockQueryResult,
} = vi.hoisted(() => {
  const mockQueryResult = { data: [{ id: 1, name: 'Test Clinic' }], error: null };
  const mockLimit = vi.fn().mockResolvedValue(mockQueryResult);
  const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockOr = vi.fn().mockReturnValue({ order: mockOrder, limit: mockLimit });
  const mockEq: ReturnType<typeof vi.fn> = vi.fn();
  mockEq.mockReturnValue({ or: mockOr, order: mockOrder, limit: mockLimit, eq: mockEq });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, or: mockOr, order: mockOrder, limit: mockLimit });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  const mockCreateClient = vi.fn().mockResolvedValue({ from: mockFrom });

  return { mockCreateClient, mockFrom, mockSelect, mockEq, mockOr, mockOrder, mockLimit, mockQueryResult };
});

vi.mock('@/lib/supabase/server', () => ({
  createClient: mockCreateClient,
}));

import { databaseLookupTool } from '@/lib/agents/langchain/tools/databaseLookup';

describe('databaseLookupTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({ from: mockFrom });
    mockFrom.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr, order: mockOrder, limit: mockLimit });
    mockEq.mockReturnValue({ or: mockOr, order: mockOrder, limit: mockLimit, eq: mockEq });
    mockOr.mockReturnValue({ order: mockOrder, limit: mockLimit });
    mockOrder.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue(mockQueryResult);
  });

  // ===========================================================================
  // Tool metadata
  // ===========================================================================

  describe('metadata', () => {
    it('has the correct name', () => {
      expect(databaseLookupTool.name).toBe('database_lookup');
    });

    it('description mentions key tables', () => {
      expect(databaseLookupTool.description).toContain('clinics');
      expect(databaseLookupTool.description).toContain('clinic_pricing');
      expect(databaseLookupTool.description).toContain('clinic_reviews');
    });
  });

  // ===========================================================================
  // Querying tables
  // ===========================================================================

  describe('querying tables', () => {
    it('queries clinics table', async () => {
      const result = await databaseLookupTool.invoke({ table: 'clinics' });
      const parsed = JSON.parse(result);

      expect(mockFrom).toHaveBeenCalledWith('clinics');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(parsed.results).toHaveLength(1);
      expect(parsed.metadata.table).toBe('clinics');
      expect(parsed.metadata.count).toBe(1);
      expect(parsed.metadata.tookMs).toBeDefined();
    });

    it('queries clinic_pricing table', async () => {
      await databaseLookupTool.invoke({ table: 'clinic_pricing' });
      expect(mockFrom).toHaveBeenCalledWith('clinic_pricing');
    });

    it('queries clinic_reviews table', async () => {
      await databaseLookupTool.invoke({ table: 'clinic_reviews' });
      expect(mockFrom).toHaveBeenCalledWith('clinic_reviews');
    });
  });

  // ===========================================================================
  // Text search
  // ===========================================================================

  describe('text search', () => {
    it('applies ilike search on clinics columns', async () => {
      await databaseLookupTool.invoke({ table: 'clinics', query: 'istanbul' });

      expect(mockOr).toHaveBeenCalledWith(
        'display_name.ilike.%istanbul%,description.ilike.%istanbul%,primary_city.ilike.%istanbul%,primary_country.ilike.%istanbul%'
      );
    });

    it('applies ilike search on clinic_locations columns', async () => {
      await databaseLookupTool.invoke({ table: 'clinic_locations', query: 'istanbul' });

      expect(mockOr).toHaveBeenCalledWith(
        'location_name.ilike.%istanbul%,city.ilike.%istanbul%,country.ilike.%istanbul%,address_line.ilike.%istanbul%'
      );
    });

    it('applies ilike search on clinic_team columns', async () => {
      await databaseLookupTool.invoke({ table: 'clinic_team', query: 'Dr' });

      expect(mockOr).toHaveBeenCalledWith(
        'name.ilike.%Dr%,credentials.ilike.%Dr%'
      );
    });
  });

  // ===========================================================================
  // Filters
  // ===========================================================================

  describe('exact-match filters', () => {
    it('applies eq filter', async () => {
      await databaseLookupTool.invoke({
        table: 'clinics',
        filters: { status: 'active' },
      });

      expect(mockEq).toHaveBeenCalledWith('status', 'active');
    });
  });

  // ===========================================================================
  // Select and limit
  // ===========================================================================

  describe('select and limit', () => {
    it('uses custom select columns', async () => {
      await databaseLookupTool.invoke({
        table: 'clinics',
        select: 'name,location',
      });

      expect(mockSelect).toHaveBeenCalledWith('name,location');
    });

    it('applies custom limit', async () => {
      await databaseLookupTool.invoke({ table: 'clinics', limit: 5 });
      expect(mockLimit).toHaveBeenCalledWith(5);
    });

    it('defaults limit to 10', async () => {
      await databaseLookupTool.invoke({ table: 'clinics' });
      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  // ===========================================================================
  // Order by
  // ===========================================================================

  describe('order_by', () => {
    it('applies descending order when direction is desc', async () => {
      await databaseLookupTool.invoke({
        table: 'clinic_scores',
        order_by: { column: 'overall_score', direction: 'desc' },
      });

      expect(mockOrder).toHaveBeenCalledWith('overall_score', { ascending: false, nullsFirst: false });
    });

    it('applies ascending order when direction is asc', async () => {
      await databaseLookupTool.invoke({
        table: 'clinic_scores',
        order_by: { column: 'overall_score', direction: 'asc' },
      });

      expect(mockOrder).toHaveBeenCalledWith('overall_score', { ascending: true, nullsFirst: false });
    });

    it('does not call order when order_by is omitted', async () => {
      await databaseLookupTool.invoke({ table: 'clinics' });
      expect(mockOrder).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Error handling
  // ===========================================================================

  describe('error handling', () => {
    it('returns error JSON on database error (does not throw)', async () => {
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { message: 'Connection failed' },
      });

      const result = await databaseLookupTool.invoke({ table: 'clinics' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Connection failed');
      expect(parsed.metadata.table).toBe('clinics');
    });

    it('returns error JSON when createClient throws', async () => {
      mockCreateClient.mockRejectedValueOnce(new Error('Missing Supabase env'));

      const result = await databaseLookupTool.invoke({ table: 'clinics' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toBe('Missing Supabase env');
    });

    it('returns guardrail error JSON for tables outside the allowlist', async () => {
      const result = await databaseLookupTool.invoke({ table: 'users' });
      const parsed = JSON.parse(result);

      expect(parsed.error).toContain('users');
      expect(parsed.guardrail).toBe('schema_allowlist');
      expect(parsed.metadata.table).toBe('users');
    });

    it('returns guardrail error JSON for sources (data-pipeline metadata)', async () => {
      const result = await databaseLookupTool.invoke({ table: 'sources' });
      const parsed = JSON.parse(result);

      expect(parsed.guardrail).toBe('schema_allowlist');
    });
  });
});
