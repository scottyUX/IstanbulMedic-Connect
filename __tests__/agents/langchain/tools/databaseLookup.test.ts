import { describe, it, expect, vi, beforeEach } from 'vitest';

// Use vi.hoisted so mocks are available inside the vi.mock factory
const {
  mockCreateClient,
  mockFrom,
  mockSelect,
  mockEq,
  mockOr,
  mockLimit,
  mockQueryResult,
} = vi.hoisted(() => {
  const mockQueryResult = { data: [{ id: 1, name: 'Test Clinic' }], error: null };
  const mockLimit = vi.fn().mockResolvedValue(mockQueryResult);
  const mockOr = vi.fn().mockReturnValue({ limit: mockLimit });
  const mockEq: any = vi.fn();
  mockEq.mockReturnValue({ or: mockOr, limit: mockLimit, eq: mockEq });
  const mockSelect = vi.fn().mockReturnValue({ eq: mockEq, or: mockOr, limit: mockLimit });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
  const mockCreateClient = vi.fn().mockResolvedValue({ from: mockFrom });

  return { mockCreateClient, mockFrom, mockSelect, mockEq, mockOr, mockLimit, mockQueryResult };
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
    mockSelect.mockReturnValue({ eq: mockEq, or: mockOr, limit: mockLimit });
    mockEq.mockReturnValue({ or: mockOr, limit: mockLimit, eq: mockEq });
    mockOr.mockReturnValue({ limit: mockLimit });
    mockLimit.mockResolvedValue(mockQueryResult);
  });

  // ===========================================================================
  // Tool metadata
  // ===========================================================================

  describe('metadata', () => {
    it('has the correct name', () => {
      expect(databaseLookupTool.name).toBe('database_lookup');
    });

    it('description mentions clinics, users, and consultations', () => {
      expect(databaseLookupTool.description).toContain('clinics');
      expect(databaseLookupTool.description).toContain('users');
      expect(databaseLookupTool.description).toContain('consultations');
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

    it('queries users table', async () => {
      await databaseLookupTool.invoke({ table: 'users' });
      expect(mockFrom).toHaveBeenCalledWith('users');
    });

    it('queries consultations table', async () => {
      await databaseLookupTool.invoke({ table: 'consultations' });
      expect(mockFrom).toHaveBeenCalledWith('consultations');
    });
  });

  // ===========================================================================
  // Text search
  // ===========================================================================

  describe('text search', () => {
    it('applies ilike search on clinics columns', async () => {
      await databaseLookupTool.invoke({ table: 'clinics', query: 'istanbul' });

      expect(mockOr).toHaveBeenCalledWith(
        'name.ilike.%istanbul%,location.ilike.%istanbul%,specialties.ilike.%istanbul%'
      );
    });

    it('applies ilike search on users columns', async () => {
      await databaseLookupTool.invoke({ table: 'users', query: 'john' });

      expect(mockOr).toHaveBeenCalledWith(
        'email.ilike.%john%,full_name.ilike.%john%'
      );
    });

    it('applies ilike search on consultations columns', async () => {
      await databaseLookupTool.invoke({ table: 'consultations', query: 'pending' });

      expect(mockOr).toHaveBeenCalledWith(
        'status.ilike.%pending%,notes.ilike.%pending%'
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

    it('rejects invalid table name via schema validation', async () => {
      await expect(
        databaseLookupTool.invoke({ table: 'invalid_table' })
      ).rejects.toThrow();
    });
  });
});
