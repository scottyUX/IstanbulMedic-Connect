import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import {
  getInstagramSignals,
  calculateRelativePosition,
  getStatusFromPercentile,
  getEngagementStatusText,
  getPostingStatusText,
} from '@/lib/api/instagram';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

// ── Helper Function Tests ─────────────────────────────────────────────────────

describe('calculateRelativePosition', () => {
  it('returns 50 for empty array', () => {
    expect(calculateRelativePosition(5, [])).toBe(50);
  });

  it('returns 50 for single value array', () => {
    expect(calculateRelativePosition(5, [5])).toBe(50);
  });

  it('returns 50 when all values are the same', () => {
    expect(calculateRelativePosition(5, [5, 5, 5])).toBe(50);
  });

  it('returns 0 for minimum value', () => {
    expect(calculateRelativePosition(1, [1, 5, 10])).toBe(0);
  });

  it('returns 100 for maximum value', () => {
    expect(calculateRelativePosition(10, [1, 5, 10])).toBe(100);
  });

  it('returns correct position for middle value', () => {
    // value=5, min=1, max=10 => (5-1)/(10-1) = 4/9 ≈ 44%
    expect(calculateRelativePosition(5, [1, 5, 10])).toBe(44);
  });

  it('filters out NaN values', () => {
    expect(calculateRelativePosition(5, [1, NaN, 10])).toBe(44);
  });

  it('filters out null values', () => {
    expect(calculateRelativePosition(5, [1, null as unknown as number, 10])).toBe(44);
  });
});

describe('getStatusFromPercentile', () => {
  it('returns positive for percentile >= 40', () => {
    expect(getStatusFromPercentile(40)).toBe('positive');
    expect(getStatusFromPercentile(75)).toBe('positive');
    expect(getStatusFromPercentile(100)).toBe('positive');
  });

  it('returns concern for percentile < 40', () => {
    expect(getStatusFromPercentile(39)).toBe('concern');
    expect(getStatusFromPercentile(20)).toBe('concern');
    expect(getStatusFromPercentile(0)).toBe('concern');
  });
});

describe('getEngagementStatusText', () => {
  it('returns Very high for >= 75', () => {
    expect(getEngagementStatusText(75)).toBe('Very high');
    expect(getEngagementStatusText(100)).toBe('Very high');
  });

  it('returns Above average for >= 50 and < 75', () => {
    expect(getEngagementStatusText(50)).toBe('Above average');
    expect(getEngagementStatusText(74)).toBe('Above average');
  });

  it('returns Average for >= 40 and < 50', () => {
    expect(getEngagementStatusText(40)).toBe('Average');
    expect(getEngagementStatusText(49)).toBe('Average');
  });

  it('returns Below average for >= 20 and < 40', () => {
    expect(getEngagementStatusText(20)).toBe('Below average');
    expect(getEngagementStatusText(39)).toBe('Below average');
  });

  it('returns Very low for < 20', () => {
    expect(getEngagementStatusText(19)).toBe('Very low');
    expect(getEngagementStatusText(0)).toBe('Very low');
  });
});

describe('getPostingStatusText', () => {
  it('returns Very active for >= 75', () => {
    expect(getPostingStatusText(75)).toBe('Very active');
    expect(getPostingStatusText(100)).toBe('Very active');
  });

  it('returns Active for >= 50 and < 75', () => {
    expect(getPostingStatusText(50)).toBe('Active');
    expect(getPostingStatusText(74)).toBe('Active');
  });

  it('returns Average for >= 40 and < 50', () => {
    expect(getPostingStatusText(40)).toBe('Average');
    expect(getPostingStatusText(49)).toBe('Average');
  });

  it('returns Below average for >= 20 and < 40', () => {
    expect(getPostingStatusText(20)).toBe('Below average');
    expect(getPostingStatusText(39)).toBe('Below average');
  });

  it('returns Inactive for < 20', () => {
    expect(getPostingStatusText(19)).toBe('Inactive');
    expect(getPostingStatusText(0)).toBe('Inactive');
  });
});

// ── getInstagramSignals Tests ─────────────────────────────────────────────────

describe('getInstagramSignals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockSupabase = (config: {
    profile?: { account_handle: string; follower_count: number; last_checked_at: string } | null;
    profileError?: Error | null;
    facts?: Array<{ fact_key: string; fact_value: unknown }>;
    factsError?: Error | null;
    allClinicFacts?: Array<{ clinic_id: string; fact_key: string; fact_value: unknown }>;
    allFactsError?: Error | null;
    postsCount?: number;
  }) => {
    const mockBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: config.profile,
        error: config.profileError ?? null,
      }),
    };

    // Track call count to return different data for different queries
    let factsCallCount = 0;

    return {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') {
          return mockBuilder;
        }
        if (table === 'clinic_facts') {
          factsCallCount++;
          // First call is for this clinic's facts, second is for all clinics
          if (factsCallCount === 1) {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: config.facts ?? [],
                error: config.factsError ?? null,
              }),
            };
          } else {
            return {
              select: vi.fn().mockReturnThis(),
              eq: vi.fn().mockReturnThis(),
              in: vi.fn().mockResolvedValue({
                data: config.allClinicFacts ?? [],
                error: config.allFactsError ?? null,
              }),
            };
          }
        }
        if (table === 'clinic_instagram_posts') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              count: config.postsCount ?? 0,
            }),
          };
        }
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
  };

  it('returns null when clinic has no Instagram profile', async () => {
    const mockSupabase = createMockSupabase({ profile: null });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');

    expect(result).toBeNull();
  });

  it('returns null when profile query errors', async () => {
    const mockSupabase = createMockSupabase({
      profile: null,
      profileError: new Error('DB error'),
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');

    expect(result).toBeNull();
  });

  it('returns signals data with correct structure', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [
        { clinic_id: 'clinic-1', fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { clinic_id: 'clinic-2', fact_key: 'instagram_engagement_rate', fact_value: 0.01 },
        { clinic_id: 'clinic-3', fact_key: 'instagram_engagement_rate', fact_value: 0.04 },
        { clinic_id: 'clinic-1', fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { clinic_id: 'clinic-2', fact_key: 'instagram_posts_per_month', fact_value: 2 },
        { clinic_id: 'clinic-3', fact_key: 'instagram_posts_per_month', fact_value: 12 },
      ],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.username).toBe('testclinic');
    expect(result?.followersCount).toBe(10000);
    expect(result?.lastUpdated).toBe('2026-03-01T00:00:00Z');
    expect(result?.signals).toHaveLength(4);
  });

  it('calculates engagement signal correctly', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [
        { clinic_id: 'clinic-1', fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { clinic_id: 'clinic-2', fact_key: 'instagram_engagement_rate', fact_value: 0.01 },
        { clinic_id: 'clinic-3', fact_key: 'instagram_engagement_rate', fact_value: 0.04 },
        { clinic_id: 'clinic-1', fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { clinic_id: 'clinic-2', fact_key: 'instagram_posts_per_month', fact_value: 2 },
        { clinic_id: 'clinic-3', fact_key: 'instagram_posts_per_month', fact_value: 12 },
      ],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const engagementSignal = result?.signals.find(s => s.id === 'engagement');

    expect(engagementSignal).toBeDefined();
    expect(engagementSignal?.metric).toBe('2.5%');
    expect(engagementSignal?.type).toBe('percentile');
    // 0.025 in range [0.01, 0.04] => (0.025-0.01)/(0.04-0.01) = 0.5 = 50%
    expect(engagementSignal?.percentile).toBe(50);
    expect(engagementSignal?.status).toBe('positive');
    expect(engagementSignal?.statusText).toBe('Above average');
  });

  it('calculates posting activity signal correctly', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [
        { clinic_id: 'clinic-1', fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { clinic_id: 'clinic-1', fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { clinic_id: 'clinic-2', fact_key: 'instagram_posts_per_month', fact_value: 2 },
        { clinic_id: 'clinic-3', fact_key: 'instagram_posts_per_month', fact_value: 12 },
      ],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const postingSignal = result?.signals.find(s => s.id === 'postingActivity');

    expect(postingSignal).toBeDefined();
    expect(postingSignal?.metric).toBe('8/mo');
    // 8 in range [2, 12] => (8-2)/(12-2) = 0.6 = 60%
    expect(postingSignal?.percentile).toBe(60);
    expect(postingSignal?.status).toBe('positive');
    expect(postingSignal?.statusText).toBe('Active');
  });

  it('calculates comments enabled signal correctly', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const commentsSignal = result?.signals.find(s => s.id === 'commentsEnabled');

    expect(commentsSignal).toBeDefined();
    expect(commentsSignal?.type).toBe('boolean');
    expect(commentsSignal?.metric).toBe('18/20 posts'); // 0.9 * 20 = 18
    expect(commentsSignal?.status).toBe('positive');
    expect(commentsSignal?.statusText).toBe('Enabled');
  });

  it('marks comments as concern when ratio < 0.5', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.3 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const commentsSignal = result?.signals.find(s => s.id === 'commentsEnabled');

    expect(commentsSignal?.status).toBe('concern');
    expect(commentsSignal?.statusText).toBe('Often disabled');
    expect(commentsSignal?.metric).toBe('6/20 posts'); // 0.3 * 20 = 6
  });

  it('handles business account flag correctly', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        { fact_key: 'instagram_is_business', fact_value: true },
      ],
      allClinicFacts: [],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const businessSignal = result?.signals.find(s => s.id === 'verifiedBusiness');

    expect(businessSignal?.status).toBe('positive');
    expect(businessSignal?.statusText).toBe('Verified');
  });

  it('marks personal account when instagram_is_business is false', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: 0.025 },
        { fact_key: 'instagram_posts_per_month', fact_value: 8 },
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: 0.9 },
        // instagram_is_business not set
      ],
      allClinicFacts: [],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');
    const businessSignal = result?.signals.find(s => s.id === 'verifiedBusiness');

    expect(businessSignal?.status).toBe('concern');
    expect(businessSignal?.statusText).toBe('Personal');
  });

  it('handles string fact values by parsing them', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: '2026-03-01T00:00:00Z',
      },
      facts: [
        { fact_key: 'instagram_engagement_rate', fact_value: '0.025' }, // string
        { fact_key: 'instagram_posts_per_month', fact_value: '8' }, // string
        { fact_key: 'instagram_comments_enabled_ratio', fact_value: '0.9' }, // string
        { fact_key: 'instagram_is_business', fact_value: 'true' }, // string
      ],
      allClinicFacts: [
        { clinic_id: 'clinic-1', fact_key: 'instagram_engagement_rate', fact_value: '0.025' },
      ],
      postsCount: 20,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.signals.find(s => s.id === 'engagement')?.metric).toBe('2.5%');
    expect(result?.signals.find(s => s.id === 'verifiedBusiness')?.status).toBe('positive');
  });

  it('uses current date when last_checked_at is null', async () => {
    const mockSupabase = createMockSupabase({
      profile: {
        account_handle: 'testclinic',
        follower_count: 10000,
        last_checked_at: null as unknown as string,
      },
      facts: [],
      allClinicFacts: [],
      postsCount: 0,
    });
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getInstagramSignals('clinic-1');

    expect(result?.lastUpdated).toBeDefined();
    // Should be a valid ISO date string
    expect(new Date(result?.lastUpdated ?? '').toISOString()).toBe(result?.lastUpdated);
  });
});
