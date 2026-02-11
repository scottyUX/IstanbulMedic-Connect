// types.ts
// All TypeScript interfaces for the clinic profile page.
// These define the "shape" of data each component expects.
// When you eventually connect to a real API, these types stay the same --
// you just replace the mock data source.

export interface Doctor {
  name: string;
  specialty: string;
  photo: string;
  credentials: string[];
  education: string;
  experience: number;
}

export interface CommunityPost {
  id: string;
  platform: "Reddit" | "Instagram" | "Other";
  content: string;
  timeAgo: string;
  sourceUrl: string;
}

export interface CommunitySummary {
  totalMentions: number;
  sentiment: "Positive" | "Mixed" | "Negative";
  themes: string[];
}

export interface TransparencyItem {
  title: string;
  description: string;
}

export interface Review {
  id: string;
  name: string;
  verified: boolean;
  date: string;
  rating: number;
  content: string;
}

export interface OpeningHours {
  days: string;
  hours: string;
}

export interface AdditionalService {
  name: string;
  available: boolean;
}

// This is the "root" type -- the entire clinic profile.
// The page component receives this and passes slices to each section.
export interface ClinicData {
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  specialties: string[];
  images: string[];
  transparencyScore: number;
  yearsInOperation: number;
  proceduresPerformed: string;
  languages: string[];
  about: string;
  doctors: Doctor[];
  communityPosts: CommunityPost[];
  communitySummary: CommunitySummary;
  transparencyItems: TransparencyItem[];
  transparencyExplanation: string;
  aiInsights: string[];
  reviews: Review[];
  commonlyMentioned: string[];
  address: string;
  openingHours: OpeningHours[];
  paymentMethods: string[];
  additionalServices: AdditionalService[];
}
