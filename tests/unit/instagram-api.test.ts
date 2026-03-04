import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { getClinicInstagramData } from '@/lib/api/instagram';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}));

import { createClient } from '@/lib/supabase/server';

type MockBuilder = {
  select: Mock;
  eq: Mock;
  in: Mock;
  order: Mock;
  limit: Mock;
  maybeSingle: Mock;
  then: (resolve: (value: unknown) => unknown) => Promise<unknown>;
};

const createMockQueryBuilder = (
  data: unknown = null,
  error: unknown = null,
  maybeSingleData: unknown = null,
  maybeSingleError: unknown = null
): MockBuilder => {
  const builder = {} as MockBuilder;

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.in = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: maybeSingleData, error: maybeSingleError });
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(resolve);

  return builder;
};

const createPostsQueryBuilder = (
  data: unknown[] | null = null,
  error: unknown = null
): MockBuilder => {
  const builder = {} as MockBuilder;

  builder.select = vi.fn().mockReturnValue(builder);
  builder.eq = vi.fn().mockReturnValue(builder);
  builder.in = vi.fn().mockReturnValue(builder);
  builder.order = vi.fn().mockReturnValue(builder);
  builder.limit = vi.fn().mockResolvedValue({ data, error });
  builder.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  builder.then = (resolve: (value: unknown) => unknown) =>
    Promise.resolve({ data, error }).then(resolve);

  return builder;
};

describe('getClinicInstagramData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when clinic has no instagram social media row', async () => {
    const socialBuilder = createMockQueryBuilder(null, null, null, null);
    const postsBuilder = createPostsQueryBuilder([], null);
    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') return postsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).toBeNull();
  });

  it('maps social profile + fact data into InstagramIntelligenceVM', async () => {
    const socialBuilder = createMockQueryBuilder(
      null,
      null,
      {
        id: 'social-1',
        clinic_id: 'clinic-1',
        platform: 'instagram',
        account_handle: 'clinicname',
        follower_count: 1000,
        verified: true,
        last_checked_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
        full_name: 'Clinic Name',
        biography: 'Best clinic bio',
        profile_pic_url: 'https://example.com/avatar.jpg',
        external_urls: ['https://clinic.com'],
        posts_count: 250,
        follows_count: 120,
      },
      null
    );
    const postsBuilder = createPostsQueryBuilder([], null);
    const factsBuilder = createMockQueryBuilder(
      [
        { fact_key: 'instagram_avg_likes_per_post', fact_value: 45 },
        { fact_key: 'instagram_avg_comments_per_post', fact_value: 5 },
      ],
      null
    );

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') return postsBuilder;
        if (table === 'clinic_facts') return factsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).toMatchObject({
      profileUrl: 'https://instagram.com/clinicname',
      username: 'clinicname',
      fullName: 'Clinic Name',
      biography: 'Best clinic bio',
      profilePicUrl: 'https://example.com/avatar.jpg',
      followersCount: 1000,
      followsCount: 120,
      postsCount: 250,
      verified: true,
      externalUrls: ['https://clinic.com'],
      engagement: {
        likesPerPost: 45,
        commentsPerPost: 5,
        engagementTotalPerPost: 50,
        engagementRate: 0.05,
      },
    });
  });

  it('returns profile data even if facts query fails', async () => {
    const socialBuilder = createMockQueryBuilder(
      null,
      null,
      {
        id: 'social-1',
        clinic_id: 'clinic-1',
        platform: 'instagram',
        account_handle: 'clinicname',
        follower_count: 1000,
        verified: false,
        last_checked_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
      },
      null
    );
    const postsBuilder = createPostsQueryBuilder([], null);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') return postsBuilder;
        if (table === 'clinic_facts') throw new Error('facts unavailable');
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.username).toBe('clinicname');
    expect(result?.engagement).toBeUndefined();
  });

  it('fetches and transforms posts correctly', async () => {
    const socialBuilder = createMockQueryBuilder(
      null,
      null,
      {
        id: 'social-1',
        clinic_id: 'clinic-1',
        platform: 'instagram',
        account_handle: 'clinicname',
        follower_count: 5000,
        verified: true,
        last_checked_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
      },
      null
    );
    const postsBuilder = createPostsQueryBuilder([
      {
        id: 'post-1',
        clinic_id: 'clinic-1',
        source_id: 'source-1',
        instagram_post_id: 'ig-123',
        short_code: 'ABC123',
        post_type: 'Image',
        url: 'https://instagram.com/p/ABC123',
        caption: 'Amazing results!',
        hashtags: ['hairtransplant', 'istanbul'],
        first_comment_text: 'Great work!',
        likes_count: 150,
        comments_count: 12,
        posted_at: '2026-02-15T10:00:00Z',
        captured_at: '2026-03-01T00:00:00Z',
        display_url: 'https://example.com/image.jpg',
      },
      {
        id: 'post-2',
        clinic_id: 'clinic-1',
        source_id: 'source-1',
        instagram_post_id: 'ig-456',
        short_code: 'DEF456',
        post_type: 'Video',
        url: 'https://instagram.com/p/DEF456',
        caption: null,
        hashtags: [],
        first_comment_text: null,
        likes_count: 200,
        comments_count: 25,
        posted_at: '2026-02-10T10:00:00Z',
        captured_at: '2026-03-01T00:00:00Z',
        display_url: null,
      },
    ], null);
    const factsBuilder = createMockQueryBuilder([], null);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') return postsBuilder;
        if (table === 'clinic_facts') return factsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.posts).toHaveLength(2);
    expect(result?.posts?.[0]).toMatchObject({
      id: 'ig-123',
      type: 'Image',
      shortCode: 'ABC123',
      url: 'https://instagram.com/p/ABC123',
      caption: 'Amazing results!',
      hashtags: ['hairtransplant', 'istanbul'],
      likesCount: 150,
      commentsCount: 12,
      firstComment: 'Great work!',
      displayUrl: 'https://example.com/image.jpg',
    });
    expect(result?.posts?.[1]).toMatchObject({
      id: 'ig-456',
      type: 'Video',
      likesCount: 200,
      commentsCount: 25,
    });
  });

  it('converts negative likes/comments to undefined', async () => {
    const socialBuilder = createMockQueryBuilder(
      null,
      null,
      {
        id: 'social-1',
        clinic_id: 'clinic-1',
        platform: 'instagram',
        account_handle: 'clinicname',
        follower_count: 1000,
        verified: false,
        last_checked_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
      },
      null
    );
    const postsBuilder = createPostsQueryBuilder([
      {
        id: 'post-1',
        clinic_id: 'clinic-1',
        source_id: 'source-1',
        instagram_post_id: 'ig-789',
        short_code: 'XYZ789',
        post_type: 'Image',
        url: 'https://instagram.com/p/XYZ789',
        caption: 'Hidden likes post',
        hashtags: [],
        first_comment_text: null,
        likes_count: -1,
        comments_count: -1,
        posted_at: '2026-02-20T10:00:00Z',
        captured_at: '2026-03-01T00:00:00Z',
        display_url: null,
      },
    ], null);
    const factsBuilder = createMockQueryBuilder([], null);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') return postsBuilder;
        if (table === 'clinic_facts') return factsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.posts).toHaveLength(1);
    expect(result?.posts?.[0].likesCount).toBeUndefined();
    expect(result?.posts?.[0].commentsCount).toBeUndefined();
  });

  it('returns profile data even if posts query fails', async () => {
    const socialBuilder = createMockQueryBuilder(
      null,
      null,
      {
        id: 'social-1',
        clinic_id: 'clinic-1',
        platform: 'instagram',
        account_handle: 'clinicname',
        follower_count: 1000,
        verified: false,
        last_checked_at: '2026-03-01T00:00:00Z',
        created_at: '2026-03-01T00:00:00Z',
      },
      null
    );
    const factsBuilder = createMockQueryBuilder([], null);

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'clinic_social_media') return socialBuilder;
        if (table === 'clinic_instagram_posts') throw new Error('posts table unavailable');
        if (table === 'clinic_facts') return factsBuilder;
        throw new Error(`Unexpected table: ${table}`);
      }),
    };
    (createClient as Mock).mockResolvedValue(mockSupabase);

    const result = await getClinicInstagramData('clinic-1');

    expect(result).not.toBeNull();
    expect(result?.username).toBe('clinicname');
    expect(result?.posts).toBeUndefined();
  });
});
