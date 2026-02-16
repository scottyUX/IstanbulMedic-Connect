// lib/extraction/instagram.ts

interface InstagramProfileData {
  id?: string;
  username?: string;
  fullName?: string;
  biography?: string;
  externalUrl?: string;
  externalUrlShimmed?: string;
  followersCount?: number;
  followsCount?: number;
  hasChannel?: boolean;
  highlightReelCount?: number;
  isBusinessAccount?: boolean;
  joinedRecently?: boolean;
  businessCategoryName?: string;
  private?: boolean;
  verified?: boolean;
  profilePicUrl?: string;
  profilePicUrlHD?: string;
  facebookPage?: string;
  igtvVideoCount?: number;
  latestIgtvVideos?: any[];
  postsCount?: number;
  latestPosts?: any[];
  url?: string;
  inputUrl?: string;
  businessAddress?: {
    city_name?: string;
    city_id?: number;
    latitude?: number;
    longitude?: number;
    street_address?: string;
    zip_code?: string | null;
  };
}

export function extractInstagramClaims(rawData: InstagramProfileData[]) {
  if (!rawData || rawData.length === 0) {
    throw new Error("No data returned from Instagram scraper");
  }

  const profile = rawData[0];

  if (!profile || !profile.id) {
    throw new Error(
      "Invalid data structure: missing profile information in scraped data"
    );
  }

  // external URLs
  const externalUrls: string[] = [];
  if (profile.externalUrl) {
    externalUrls.push(profile.externalUrl);
  }
  if (profile.externalUrlShimmed && profile.externalUrlShimmed !== profile.externalUrl) {
    externalUrls.push(profile.externalUrlShimmed);
  }

  const profileUrl = profile.url || profile.inputUrl || `https://www.instagram.com/${profile.username || ''}`;

  const safeProfile = {
    url: profileUrl,
    id: profile.id ?? "",
    username: profile.username ?? "",
    fullName: profile.fullName ?? "",
    biography: profile.biography ?? "",
    externalUrls: externalUrls,
    followersCount: profile.followersCount ?? 0,
    postsCount: profile.postsCount ?? 0,
    verified: profile.verified ?? false,
    isBusinessAccount: profile.isBusinessAccount ?? false,
    businessCategoryName: profile.businessCategoryName ?? "",
  };

  const websiteCandidates: string[] = [...externalUrls];

  const linkAggregatorDomains = [
    "linktr.ee",
    "linkin.bio",
    "beacons.ai",
    "bio.link",
    "allmylinks.com",
    "hoo.be",
    "carrd.co",
  ];

  let linkAggregatorDetected: string | null = null;
  for (const url of websiteCandidates) {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      const detected = linkAggregatorDomains.find((agg) => domain.includes(agg));
      if (detected) {
        linkAggregatorDetected = detected;
        break;
      }
    } catch (e) {
    }
  }

  let addressText = "";
  if (profile.businessAddress) {
    const parts = [];
    if (profile.businessAddress.street_address) {
      parts.push(profile.businessAddress.street_address);
    }
    if (profile.businessAddress.city_name) {
      parts.push(profile.businessAddress.city_name);
    }
    if (profile.businessAddress.zip_code) {
      parts.push(profile.businessAddress.zip_code);
    }
    addressText = parts.join(", ");
  }

  // Identity
  const displayNameVariants: string[] = [];
  if (safeProfile.fullName) {
    displayNameVariants.push(safeProfile.fullName);
  }

  // Content-derived signals
  const biographyText = safeProfile.biography.toLowerCase();

  // Geography
  const geographyClaimed: string[] = [];
  if (profile.businessAddress?.city_name) {
    geographyClaimed.push(profile.businessAddress.city_name);
  }

  // Services claimed
  const servicesClaimed: string[] = [];
  const serviceKeywords = [
    "hair transplant",
    "medical travel",
    "cosmetic surgery",
    "dental",
    "aesthetic",
    "plastic surgery",
    "wellness",
    "clinic",
    "hospital",
    "FUE",
    "DHI",
  ];

  for (const keyword of serviceKeywords) {
    if (biographyText.includes(keyword.toLowerCase())) {
      servicesClaimed.push(keyword);
    }
  }

  // Positioning 
  const positioningClaims: string[] = [];
  const positioningKeywords = ["leading", "#1", "best", "accredited", "top"];

  for (const keyword of positioningKeywords) {
    if (biographyText.includes(keyword.toLowerCase())) {
      positioningClaims.push(keyword);
    }
  }

  // Languages 
  const languagesClaimed: string[] = [];
  const languagePatterns = [
    { pattern: /\b(english|en|🇬🇧|🇺🇸)\b/i, lang: "EN" },
    { pattern: /\b(turkish|türkçe|tr|🇹🇷)\b/i, lang: "TR" },
    { pattern: /\b(arabic|عربي|ar|🇸🇦)\b/i, lang: "AR" },
    { pattern: /\b(german|deutsch|de|🇩🇪)\b/i, lang: "DE" },
    { pattern: /\b(french|français|fr|🇫🇷)\b/i, lang: "FR" },
    { pattern: /\b(spanish|español|es|🇪🇸)\b/i, lang: "ES" },
  ];

  for (const { pattern, lang } of languagePatterns) {
    if (pattern.test(safeProfile.biography)) {
      languagesClaimed.push(lang);
    }
  }

  return {
    instagram: {
      inputUrl: safeProfile.url,
      id: safeProfile.id,
      username: safeProfile.username,
      fullName: safeProfile.fullName,
      biography: safeProfile.biography,
      externalUrls: safeProfile.externalUrls,
      followersCount: safeProfile.followersCount,
      postsCount: safeProfile.postsCount,
      verified: safeProfile.verified,
      isBusinessAccount: safeProfile.isBusinessAccount,
      businessCategoryName: safeProfile.businessCategoryName,
    },

    extracted_claims: {
      identity: {
        display_name_variants: displayNameVariants,
      },

      // Social
      social: {
        instagram: {
          handle: safeProfile.username,
          profile_url: safeProfile.url,
          profile_id: safeProfile.id,
          is_verified: safeProfile.verified,
          is_business: safeProfile.isBusinessAccount,
          business_category: safeProfile.businessCategoryName,
          is_private: profile.private ?? false,
          joined_recently: profile.joinedRecently ?? false,
          followers_count: safeProfile.followersCount,
          follows_count: profile.followsCount ?? 0,
          posts_count: safeProfile.postsCount,
          highlights_count: profile.highlightReelCount ?? 0,
          igtv_count: profile.igtvVideoCount ?? 0,
        },
      },

      // Contact
      contact: {
        website_candidates: websiteCandidates,
        link_aggregator_detected: linkAggregatorDetected,
        address_text: addressText || undefined,
      },

      // Content-derived signals (low confidence)
      services: {
        claimed: servicesClaimed,
      },
      positioning: {
        claims: positioningClaims,
      },
      languages: {
        claimed: languagesClaimed,
      },
      geography: {
        claimed: geographyClaimed,
      },
    },
  };
}
