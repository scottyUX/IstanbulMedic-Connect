/**
 * Filter Configuration
 *
 * Controls which filters are visible in the UI.
 * Enable filters as backend data becomes available.
 */
export const FILTER_CONFIG = {
  // Enabled - have real data
  searchQuery: true,
  location: true,
  minRating: true,
  minReviews: true,
  minTrustScore: true,

  // Disabled - no data yet
  budgetRange: false,
  aiMatchScore: false,
  treatments: false,
  languages: false,
  accreditations: false,

  // Future filters (not yet implemented)
  // verified: false,
  // hasPackages: false,
  // hasTransfer: false,
  // hasAccommodation: false,
  // districts: false,
  // treatmentAreas: false,
  // techniques: false,
  // specializations: false,
} as const;

export type FilterConfigKey = keyof typeof FILTER_CONFIG;

/**
 * Sort Configuration
 *
 * Controls which sort options are visible in the UI.
 * Enable sort options as backend support becomes available.
 */
export const SORT_CONFIG = {
  'A-Z': true,
  'Z-A': true,
  'Highest Rated': true,
  'Lowest Rated': true,
  'Highest Trust': true,
  'Lowest Trust': true,

  // Disabled - no backend support yet
  'Best Match': false,
  'Most Transparent': false, // Enable when clinic_scores data is populated
  'Price: Low to High': false, // Enable when clinic_pricing data is available
  'Price: High to Low': false, // Enable when clinic_pricing data is available
} as const;

export type SortConfigKey = keyof typeof SORT_CONFIG;

/**
 * Feature Configuration
 *
 * Controls which features are visible in the UI.
 * Enable features as real data becomes available.
 */
export const FEATURE_CONFIG = {
  // Enabled - have real collected data
  reviews: true,
  clinicBasicInfo: true, // name, location, rating from clinic_facts
  locationMap: true,

  // Disabled - no real data collected yet
  auth: false, // login/sign up
  compare: false,
  saveClinic: false,
  bookConsultation: true,
  share: false, // TODO: implement copy URL to clipboard
  createProfile: false, // landing page "Create a profile" CTA
  personalizedOffers: false, // landing page "Receive Personalized Offers" step

  // Profile sections - disabled until real data
  profileOverview: true,
  profilePricing: false,
  profilePackages: false,
  profileDoctors: true,
  profileTransparency: false,
  profileAIInsights: false,
  profileCommunitySignals: false,
  profileInstagram: true,
  profileHRN: true,
  profileRedditSignals: true,
  profileLanguages: false,
  profilePaymentMethods: false,
  profileServices: false,
  profileRegistry: true,
} as const;

export type FeatureConfigKey = keyof typeof FEATURE_CONFIG;
