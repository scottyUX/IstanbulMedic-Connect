import { createClient } from '@/lib/supabase/server';
import type { InstagramSignalsData } from '@/components/istanbulmedic-connect/profile/InstagramSignalsCard';

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
    positive: "Professional accounts (Business or Creator) require extra setup steps and provide more transparency features.",
    concern: "Personal accounts aren't necessarily bad, but professional accounts provide more accountability.",
  },
  postingActivity: {
    positive: "Regular posting suggests the clinic is active and engaged with their audience.",
    concern: "Infrequent posting may suggest the clinic is less active on social media. This isn't necessarily a problem, but you may find less content to review.",
  },
};

/**
 * Calculates true percentile ranking based on position among all values.
 * Returns 0% for the lowest, 100% for the highest, based on rank not value.
 * This prevents outliers from squashing everyone else to the low end.
 */
export function calculateRelativePosition(value: number, allValues: number[]): number {
  const validValues = allValues.filter(v => v != null && !isNaN(v));
  if (validValues.length === 0) return 50;
  if (validValues.length === 1) return 50; // Only one clinic, can't compare

  // Count how many values are strictly below this value
  const countBelow = validValues.filter(v => v < value).length;

  // Count how many values are equal (for tie handling)
  const countEqual = validValues.filter(v => v === value).length;

  // Use midpoint of tied ranks: (countBelow + (countBelow + countEqual - 1)) / 2
  // Then convert to percentile: rank / (n - 1) * 100
  const rank = countBelow + (countEqual - 1) / 2;
  const percentile = (rank / (validValues.length - 1)) * 100;

  return Math.round(percentile);
}

/**
 * Determines signal status based on percentile.
 * Percentile >= 40 is positive, below 40 is concern.
 */
export function getStatusFromPercentile(percentile: number): 'positive' | 'concern' {
  return percentile >= 40 ? 'positive' : 'concern';
}

/**
 * Gets status text for engagement based on percentile.
 */
export function getEngagementStatusText(percentile: number): string {
  if (percentile >= 75) return 'Very high';
  if (percentile >= 50) return 'Above average';
  if (percentile >= 40) return 'Average';
  if (percentile >= 20) return 'Below average';
  return 'Very low';
}

/**
 * Gets status text for posting activity based on percentile.
 */
export function getPostingStatusText(percentile: number): string {
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
      .select('account_handle, follower_count, last_checked_at, business_category')
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
    // Determine account type: Business > Creator > Personal
    const hasBusinessCategory = profile.business_category && profile.business_category.trim() !== '';
    const accountType: 'business' | 'creator' | 'personal' = isBusiness
      ? 'business'
      : hasBusinessCategory
        ? 'creator'
        : 'personal';

    // Business and Creator accounts are both "positive" (professional accounts)
    const businessStatus: 'positive' | 'concern' = accountType !== 'personal' ? 'positive' : 'concern';
    const accountTypeLabels = {
      business: 'Business',
      creator: 'Creator',
      personal: 'Personal',
    };
    signals.push({
      id: 'verifiedBusiness',
      label: 'Account Type',
      status: businessStatus,
      type: 'boolean',
      statusText: accountTypeLabels[accountType],
      explanation: EXPLANATIONS.verifiedBusiness[businessStatus],
    });

    // Ensure timestamp is parsed as UTC (DB stores without timezone suffix)
    let lastUpdated = profile.last_checked_at ?? new Date().toISOString();
    if (lastUpdated && !lastUpdated.endsWith('Z') && !lastUpdated.includes('+')) {
      lastUpdated = lastUpdated.replace(' ', 'T') + 'Z';
    }

    return {
      username: profile.account_handle,
      followersCount: profile.follower_count ?? 0,
      lastUpdated,
      signals,
    };
  } catch (error) {
    console.error('Error fetching Instagram signals:', error);
    return null;
  }
}
