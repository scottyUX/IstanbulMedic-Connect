import { createClient } from '@/lib/supabase/server';
import type { InstagramIntelligenceVM, InstagramPostVM } from '@/components/istanbulmedic-connect/types';

/**
 * Database row type for clinic_social_media (Instagram platform)
 * Note: Some columns (profile_pic_url, biography, full_name, external_urls)
 * may not exist yet in the remote DB - they'll be added by pending migrations.
 */
interface SocialMediaRow {
  id: string;
  clinic_id: string;
  platform: string;
  account_handle: string;
  follower_count: number | null;
  verified: boolean | null;
  last_checked_at: string | null;
  created_at: string | null;
  // New columns (pending migration)
  follows_count?: number | null;
  posts_count?: number | null;
  highlights_count?: number | null;
  is_private?: boolean | null;
  business_category?: string | null;
  profile_pic_url?: string | null;
  biography?: string | null;
  full_name?: string | null;
  external_urls?: string[] | null;
}

/**
 * Database row type for clinic_instagram_posts
 * Note: This table may not exist yet - will be created by pending migration.
 */
interface InstagramPostRow {
  id: string;
  clinic_id: string;
  source_id: string;
  instagram_post_id: string;
  short_code: string;
  post_type: 'Image' | 'Video' | 'Sidecar';
  url: string;
  caption: string | null;
  hashtags: string[] | null;
  first_comment_text: string | null;
  comments_data: unknown | null;
  likes_count: number | null;
  comments_count: number | null;
  posted_at: string | null;
  captured_at: string;
  // New column (pending migration)
  display_url?: string | null;
}

/**
 * Fact row from clinic_facts table
 */
interface FactRow {
  fact_key: string;
  fact_value: unknown;
}

/**
 * Transforms database rows to InstagramIntelligenceVM view model
 */
function transformToInstagramVM(
  socialMedia: SocialMediaRow,
  posts: InstagramPostRow[] | null,
  facts: FactRow[] | null
): InstagramIntelligenceVM {
  // Build facts lookup map
  const factsMap = (facts ?? []).reduce((acc, f) => {
    acc[f.fact_key] = f.fact_value;
    return acc;
  }, {} as Record<string, unknown>);

  // Calculate engagement metrics from posts if not available from facts
  let avgLikes: number | undefined;
  let avgComments: number | undefined;

  if (posts && posts.length > 0) {
    const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count ?? 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.comments_count ?? 0), 0);
    avgLikes = totalLikes / posts.length;
    avgComments = totalComments / posts.length;
  }

  // Use facts if available, otherwise use calculated values
  const likesPerPost = typeof factsMap.instagram_avg_likes_per_post === 'number'
    ? factsMap.instagram_avg_likes_per_post
    : avgLikes;
  const commentsPerPost = typeof factsMap.instagram_avg_comments_per_post === 'number'
    ? factsMap.instagram_avg_comments_per_post
    : avgComments;

  // Calculate engagement rate if we have followers
  const followersCount = socialMedia.follower_count ?? 0;
  const engagementTotalPerPost = (likesPerPost ?? 0) + (commentsPerPost ?? 0);
  const engagementRate = followersCount > 0
    ? engagementTotalPerPost / followersCount
    : undefined;

  // Transform posts to view model
  const transformedPosts: InstagramPostVM[] = (posts ?? []).map(p => ({
    id: p.instagram_post_id,
    type: p.post_type,
    shortCode: p.short_code,
    url: p.url,
    caption: p.caption ?? undefined,
    hashtags: p.hashtags ?? [],
    likesCount: p.likes_count ?? 0,
    commentsCount: p.comments_count ?? 0,
    firstComment: p.first_comment_text ?? undefined,
    timestamp: p.posted_at ?? p.captured_at,
    displayUrl: p.display_url ?? undefined,
  }));

  return {
    profileUrl: `https://instagram.com/${socialMedia.account_handle}`,
    username: socialMedia.account_handle,
    fullName: socialMedia.full_name ?? undefined,
    biography: socialMedia.biography ?? undefined,
    profilePicUrl: socialMedia.profile_pic_url ?? undefined,

    followersCount: socialMedia.follower_count ?? undefined,
    followsCount: socialMedia.follows_count ?? undefined,
    postsCount: socialMedia.posts_count ?? undefined,
    highlightsCount: socialMedia.highlights_count ?? undefined,
    verified: socialMedia.verified ?? false,
    isBusinessAccount: true, // Assumption for clinic accounts
    isPrivate: socialMedia.is_private ?? false,
    businessCategoryName: socialMedia.business_category ?? undefined,

    externalUrls: socialMedia.external_urls ?? [],

    lastSeenAt: socialMedia.last_checked_at ?? undefined,

    posts: transformedPosts.length > 0 ? transformedPosts : undefined,

    engagement: (likesPerPost !== undefined || commentsPerPost !== undefined) ? {
      likesPerPost,
      commentsPerPost,
      engagementTotalPerPost: engagementTotalPerPost > 0 ? engagementTotalPerPost : undefined,
      engagementRate,
    } : undefined,
  };
}

/**
 * Fetches Instagram data for a clinic from Supabase.
 * Returns null gracefully if:
 * - No Instagram profile exists for the clinic
 * - Database tables haven't been migrated yet
 * - Any query errors occur
 *
 * @param clinicId - The clinic's UUID
 * @returns InstagramIntelligenceVM or null
 */
export async function getClinicInstagramData(clinicId: string): Promise<InstagramIntelligenceVM | null> {
  try {
    const supabase = await createClient();

    // 1. Fetch from clinic_social_media
    const { data: socialMedia, error: socialError } = await supabase
      .from('clinic_social_media')
      .select('*')
      .eq('clinic_id', clinicId)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (socialError) {
      console.error('Error fetching clinic social media:', socialError);
      return null;
    }

    if (!socialMedia) {
      // No Instagram profile for this clinic
      return null;
    }

    // 2. Fetch recent posts from clinic_instagram_posts (if table exists)
    // Posts will be null until the clinic_instagram_posts migration is applied
    // and the database types are regenerated. Once available, add a query here:
    // const { data: postsData } = await supabase.from('clinic_instagram_posts')...
    const posts: InstagramPostRow[] | null = null;

    // 3. Fetch engagement facts from clinic_facts
    let facts: FactRow[] | null = null;
    try {
      const { data: factsData, error: factsError } = await supabase
        .from('clinic_facts')
        .select('fact_key, fact_value')
        .eq('clinic_id', clinicId)
        .in('fact_key', [
          'instagram_avg_likes_per_post',
          'instagram_avg_comments_per_post',
        ]);

      if (!factsError && factsData) {
        facts = factsData as FactRow[];
      }
    } catch {
      // Facts query failed - continue without engagement data
      console.debug('Could not fetch Instagram engagement facts');
    }

    // 4. Transform to InstagramIntelligenceVM
    return transformToInstagramVM(
      socialMedia as SocialMediaRow,
      posts,
      facts
    );
  } catch (error) {
    // Catch-all for any unexpected errors
    console.error('Error fetching Instagram data:', error);
    return null;
  }
}
