import { createClient } from '@/lib/supabase/server';
import type { InstagramIntelligenceVM, InstagramPostVM } from '@/components/istanbulmedic-connect/types';
import type { InstagramSignalsData } from '@/components/istanbulmedic-connect/profile/InstagramSignalsCard';

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
    likesCount: (p.likes_count != null && p.likes_count >= 0) ? p.likes_count : undefined,
    commentsCount: (p.comments_count != null && p.comments_count >= 0) ? p.comments_count : undefined,
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

    // 2. Fetch recent posts from clinic_instagram_posts
    let posts: InstagramPostRow[] | null = null;
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('clinic_instagram_posts')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('posted_at', { ascending: false })
        .limit(12);

      if (!postsError && postsData) {
        posts = postsData as InstagramPostRow[];
      }
    } catch {
      // Posts query failed - table may not exist yet
      console.debug('Could not fetch Instagram posts');
    }

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

// ── Instagram Signals Card ─────────────────────────────────────────────────────

// Static explanations for each signal type (matches component)
const EXPLANATIONS = {
  engagement: {
    positive: "Genuine engagement suggests real patients are following and interacting with the clinic. This is a healthy sign.",
    concern: "Low engagement relative to follower count could indicate purchased followers or an inactive audience. Consider checking the comments yourself.",
  },
  commentsEnabled: {
    positive: "Allowing public comments shows transparency. You can read what others are saying about the clinic.",
    concern: "Disabling comments may indicate the clinic is hiding negative feedback. Consider this a yellow flag.",
  },
  verifiedBusiness: {
    positive: "Business accounts require extra verification steps, adding a layer of legitimacy.",
    concern: "Personal accounts aren't necessarily bad, but business accounts provide more accountability.",
  },
  postingActivity: {
    positive: "Regular posting suggests the clinic is active and engaged with their audience.",
    concern: "Infrequent posting may suggest the clinic is less active on social media. This isn't necessarily a problem, but you may find less content to review.",
  },
};

/**
 * Calculates the relative position of a value within the range of all values.
 * Returns 0% for the lowest value, 100% for the highest, with linear interpolation.
 * This is a "where do you fall on the spectrum" metric, not a traditional percentile.
 */
function calculateRelativePosition(value: number, allValues: number[]): number {
  const validValues = allValues.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) return 50;
  if (validValues.length === 1) return 50; // Only one clinic, can't compare

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  if (max === min) return 50; // All values are the same

  return Math.round(((value - min) / (max - min)) * 100);
}

/**
 * Determines signal status based on percentile.
 * Percentile >= 40 is positive, below 40 is concern.
 */
function getStatusFromPercentile(percentile: number): 'positive' | 'concern' {
  return percentile >= 40 ? 'positive' : 'concern';
}

/**
 * Gets status text for engagement based on percentile.
 */
function getEngagementStatusText(percentile: number): string {
  if (percentile >= 75) return 'Very high';
  if (percentile >= 50) return 'Above average';
  if (percentile >= 40) return 'Average';
  if (percentile >= 20) return 'Below average';
  return 'Very low';
}

/**
 * Gets status text for posting activity based on percentile.
 */
function getPostingStatusText(percentile: number): string {
  if (percentile >= 75) return 'Very active';
  if (percentile >= 50) return 'Active';
  if (percentile >= 40) return 'Average';
  if (percentile >= 20) return 'Below average';
  return 'Inactive';
}

/**
 * Fetches Instagram signals data for a clinic, including percentile rankings
 * compared to other clinics in the database.
 *
 * @param clinicId - The clinic's UUID
 * @returns InstagramSignalsData or null if no Instagram data exists
 */
export async function getInstagramSignals(
  clinicId: string
): Promise<InstagramSignalsData | null> {
  try {
    const supabase = await createClient();

    // 1. Get this clinic's Instagram profile
    const { data: profile, error: profileError } = await supabase
      .from('clinic_social_media')
      .select('account_handle, follower_count, last_checked_at')
      .eq('clinic_id', clinicId)
      .eq('platform', 'instagram')
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching Instagram profile:', profileError);
      return null;
    }

    if (!profile) {
      // No Instagram profile for this clinic
      return null;
    }

    // 2. Get this clinic's raw metrics from clinic_facts
    const { data: facts, error: factsError } = await supabase
      .from('clinic_facts')
      .select('fact_key, fact_value')
      .eq('clinic_id', clinicId)
      .in('fact_key', [
        'instagram_engagement_rate',
        'instagram_posts_per_month',
        'instagram_comments_enabled_ratio',
        'instagram_is_business',
      ]);

    if (factsError) {
      console.error('Error fetching Instagram facts:', factsError);
      return null;
    }

    // Build facts lookup map
    const factsMap: Record<string, unknown> = {};
    for (const fact of facts ?? []) {
      factsMap[fact.fact_key] = fact.fact_value;
    }

    // 3. Get ALL clinics' metrics for percentile calculation
    const { data: allClinicFacts, error: allFactsError } = await supabase
      .from('clinic_facts')
      .select('clinic_id, fact_key, fact_value')
      .in('fact_key', ['instagram_engagement_rate', 'instagram_posts_per_month']);

    if (allFactsError) {
      console.error('Error fetching all clinic facts:', allFactsError);
      return null;
    }

    // Organize all values by metric type
    const allEngagementRates: number[] = [];
    const allPostsPerMonth: number[] = [];

    for (const fact of allClinicFacts ?? []) {
      const value = typeof fact.fact_value === 'number' ? fact.fact_value : parseFloat(fact.fact_value as string);
      if (isNaN(value)) continue;

      if (fact.fact_key === 'instagram_engagement_rate') {
        allEngagementRates.push(value);
      } else if (fact.fact_key === 'instagram_posts_per_month') {
        allPostsPerMonth.push(value);
      }
    }

    // Extract this clinic's metrics
    const engagementRate = typeof factsMap.instagram_engagement_rate === 'number'
      ? factsMap.instagram_engagement_rate
      : parseFloat(factsMap.instagram_engagement_rate as string) || 0;

    const postsPerMonth = typeof factsMap.instagram_posts_per_month === 'number'
      ? factsMap.instagram_posts_per_month
      : parseFloat(factsMap.instagram_posts_per_month as string) || 0;

    const commentsEnabledRatio = typeof factsMap.instagram_comments_enabled_ratio === 'number'
      ? factsMap.instagram_comments_enabled_ratio
      : parseFloat(factsMap.instagram_comments_enabled_ratio as string) || 1;

    const isBusiness = factsMap.instagram_is_business === true ||
      factsMap.instagram_is_business === 'true' ||
      factsMap.instagram_is_business === 1;

    // 4. Calculate percentiles
    const engagementPercentile = calculateRelativePosition(engagementRate, allEngagementRates);
    const postingPercentile = calculateRelativePosition(postsPerMonth, allPostsPerMonth);

    // 5. Build signals array
    const signals: InstagramSignalsData['signals'] = [];

    // Engagement signal
    const engagementStatus = getStatusFromPercentile(engagementPercentile);
    signals.push({
      id: 'engagement',
      label: 'Engagement',
      status: engagementStatus,
      type: 'percentile',
      percentile: engagementPercentile,
      metric: `${(engagementRate * 100).toFixed(1)}%`,
      metricTooltip: 'Avg. likes + comments per post ÷ followers',
      statusText: getEngagementStatusText(engagementPercentile),
      explanation: EXPLANATIONS.engagement[engagementStatus],
    });

    // Posting activity signal
    const postingStatus = getStatusFromPercentile(postingPercentile);
    signals.push({
      id: 'postingActivity',
      label: 'Posting Activity',
      status: postingStatus,
      type: 'percentile',
      percentile: postingPercentile,
      metric: `${postsPerMonth}/mo`,
      metricTooltip: 'Average posts per month',
      statusText: getPostingStatusText(postingPercentile),
      explanation: EXPLANATIONS.postingActivity[postingStatus],
    });

    // Get the actual number of posts we have stored for this clinic
    const { count: postsCount } = await supabase
      .from('clinic_instagram_posts')
      .select('*', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    const sampleSize = postsCount ?? 0;

    // Comments enabled signal (boolean type, but with ratio metric)
    const commentsStatus: 'positive' | 'concern' = commentsEnabledRatio >= 0.5 ? 'positive' : 'concern';
    const commentsEnabledCount = Math.round(commentsEnabledRatio * sampleSize);
    signals.push({
      id: 'commentsEnabled',
      label: 'Comments',
      status: commentsStatus,
      type: 'boolean',
      metric: sampleSize > 0 ? `${commentsEnabledCount}/${sampleSize} posts` : undefined,
      statusText: commentsStatus === 'positive' ? 'Enabled' : 'Often disabled',
      explanation: EXPLANATIONS.commentsEnabled[commentsStatus],
    });

    // Business account signal (boolean type)
    const businessStatus: 'positive' | 'concern' = isBusiness ? 'positive' : 'concern';
    signals.push({
      id: 'verifiedBusiness',
      label: 'Business Account',
      status: businessStatus,
      type: 'boolean',
      statusText: isBusiness ? 'Verified' : 'Personal',
      explanation: EXPLANATIONS.verifiedBusiness[businessStatus],
    });

    return {
      username: profile.account_handle,
      followersCount: profile.follower_count ?? 0,
      lastUpdated: profile.last_checked_at ?? new Date().toISOString(),
      signals,
    };
  } catch (error) {
    console.error('Error fetching Instagram signals:', error);
    return null;
  }
}
