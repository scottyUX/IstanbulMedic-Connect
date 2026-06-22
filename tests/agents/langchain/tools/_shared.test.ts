import { describe, it, expect, vi } from 'vitest';
import { resolveClinic } from '@/lib/agents/langchain/tools/_shared';
import type { SupabaseClient } from '@/lib/agents/langchain/tools/_shared';

const SERKAN = {
  id: 'uuid-serkan',
  display_name: 'Dr Serkan Aygın Hair Transplant Clinic',
  status: 'active',
};

function makeSupabase(responses: ({ data: unknown; error: null } | { data: null; error: { message: string } })[]) {
  let call = 0;
  const limit = vi.fn().mockImplementation(() => responses[call++] ?? { data: [], error: null });
  const ilike = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ ilike, eq: vi.fn().mockReturnValue({ limit }) });
  const eq = vi.fn().mockReturnValue({ select });
  const from = vi.fn().mockReturnValue({ select, eq });
  return { from } as unknown as SupabaseClient;
}

describe('resolveClinic', () => {
  describe('by clinic_id', () => {
    it('returns the clinic when found by ID', async () => {
      const supabase = makeSupabase([{ data: [SERKAN], error: null }]);
      const result = await resolveClinic(supabase, 'uuid-serkan');
      expect(result?.id).toBe('uuid-serkan');
    });

    it('returns null when ID not found', async () => {
      const supabase = makeSupabase([{ data: [], error: null }]);
      const result = await resolveClinic(supabase, 'uuid-missing');
      expect(result).toBeNull();
    });
  });

  describe('by clinic_name — full match', () => {
    it('returns a match when the full name query succeeds', async () => {
      const supabase = makeSupabase([{ data: [SERKAN], error: null }]);
      const result = await resolveClinic(supabase, undefined, 'Serkan');
      expect(result?.id).toBe('uuid-serkan');
    });

    it('prefers the active clinic when multiple results are returned', async () => {
      const inactive = { ...SERKAN, id: 'uuid-inactive', status: 'inactive' };
      const supabase = makeSupabase([{ data: [inactive, SERKAN], error: null }]);
      const result = await resolveClinic(supabase, undefined, 'Serkan');
      expect(result?.status).toBe('active');
    });
  });

  describe('by clinic_name — word fallback', () => {
    it('falls back to significant word when full-name query returns nothing', async () => {
      // First call (full name) → no results; second call (word "Serkan") → hit
      const supabase = makeSupabase([
        { data: [], error: null },
        { data: [SERKAN], error: null },
      ]);
      const result = await resolveClinic(supabase, undefined, 'Dr Serkan Aygin');
      expect(result?.id).toBe('uuid-serkan');
    });

    it('skips stop words and tries next significant word', async () => {
      // Input "Istanbul Hair Clinic Serkan": stop words filtered → only "Serkan" tried
      // First call (full name) → nothing; second call ("Serkan") → hit
      const supabase = makeSupabase([
        { data: [], error: null },
        { data: [SERKAN], error: null },
      ]);
      const result = await resolveClinic(supabase, undefined, 'Istanbul Hair Clinic Serkan');
      expect(result?.id).toBe('uuid-serkan');
    });

    it('returns null when no word produces a match', async () => {
      const supabase = makeSupabase([
        { data: [], error: null }, // full name
        { data: [], error: null }, // first word
        { data: [], error: null }, // second word
      ]);
      const result = await resolveClinic(supabase, undefined, 'Unknown XYZ Clinic');
      expect(result).toBeNull();
    });
  });

  describe('no arguments', () => {
    it('returns null when neither id nor name is provided', async () => {
      const supabase = makeSupabase([]);
      const result = await resolveClinic(supabase);
      expect(result).toBeNull();
    });
  });
});
