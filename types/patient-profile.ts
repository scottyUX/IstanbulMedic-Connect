/**
 * Patient Profile (Treatment Passport) types for IstanbulMedic Connect.
 * Aligned with docs/schemas/patient-profile-example.json and JSON Schema.
 */

// --- Enums ---

export type AgeTier =
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_64"
  | "65_plus";

export type BudgetTier =
  | "under_2000"
  | "2000_5000"
  | "5000_8000"
  | "8000_12000"
  | "12000_plus";

export type Timeline =
  | "asap"
  | "1_3_months"
  | "3_6_months"
  | "6_12_months"
  | "12_plus_months";

export type PatientStage =
  | "onboarding"
  | "profile_complete"
  | "shared"
  | "offers_pending"
  | "offers_ready"
  | "accepted";

export type ShareStatus = "pending" | "viewed" | "offer_sent" | "revoked";

export type PreferredContactMethod = "email" | "phone" | "whatsapp";

export type Gender = "male" | "female" | "other" | "prefer_not_to_say";

export type DonorAreaQuality = "poor" | "adequate" | "good" | "excellent";

export type DonorAreaAvailability = "limited" | "adequate" | "good";

export type DesiredDensity = "low" | "medium" | "high" | "maximum";

export type SmokingStatus = "never" | "former" | "current";

export type AlcoholUse = "none" | "occasional" | "regular" | "heavy";

export type Suitability = "poor" | "fair" | "good" | "excellent";

export type StatusUpdatedBy = "system" | "patient" | "consultant" | "clinic";

export type StatusSource = "manual" | "ai" | "clinic";

export type PhotoView = "front" | "left_side" | "right_side" | "top" | "donor_area";

export type TravelFlexibility =
  | "fixed_dates"
  | "flexible_1_month"
  | "flexible_3_months"
  | "fully_flexible";

export type PackagePreference = "budget" | "standard" | "premium" | "vip";

// --- Domain objects ---

export interface PatientInfo {
  fullName: string;
  email: string;
  phone?: string;
  preferredContactMethod?: PreferredContactMethod;
  timezone?: string;
  preferredLanguage?: string;
}

export interface Qualification {
  ageTier?: AgeTier;
  dateOfBirth?: string; // ISO date
  gender?: Gender;
  country?: string;
  budgetTier?: BudgetTier;
  timeline?: Timeline;
  hairLossPattern?: string;
}

export interface FamilyHistory {
  fatherBald?: boolean;
  maternalGrandfatherBald?: boolean;
}

export interface PriorTransplant {
  year: number;
  estimatedGrafts: number;
  clinicCountry: string;
}

export interface HairLoss {
  norwoodScale?: number;
  durationYears?: number;
  familyHistory?: FamilyHistory;
  previousTreatments?: string[];
  priorTransplants?: PriorTransplant[];
  donorAreaQuality?: DonorAreaQuality;
  donorAreaAvailability?: DonorAreaAvailability;
  desiredDensity?: DesiredDensity;
}

export interface PriorSurgery {
  type: string;
  year: number;
  notes?: string;
}

export interface ChronicCondition {
  condition: string;
  controlled: boolean;
}

export interface Medical {
  allergies?: string[];
  medications?: string[];
  bloodThinners?: boolean;
  priorSurgeries?: PriorSurgery[];
  smokingStatus?: SmokingStatus;
  alcoholUse?: AlcoholUse;
  chronicConditions?: ChronicCondition[];
  autoimmuneDisorders?: string[];
  diabetes?: boolean;
  hypertension?: boolean;
  otherConditions?: string[];
}

export interface PatientPhoto {
  id: string;
  patientProfileId: string;
  view: PhotoView;
  url: string;
  uploadedAt: string;
  isPrimary?: boolean;
  aiProcessedAt?: string;
  qualityScore?: number | null;
  analysisVersion?: string;
}

export interface AIAnalysis {
  version: string;
  generatedAt: string;
  estimatedNorwoodStage?: number;
  estimatedMinGrafts?: number;
  estimatedMaxGrafts?: number;
  donorCapacityScore?: number;
  confidenceScore?: number;
  suitability?: Suitability;
  riskFlags?: string[];
  keyFactors?: string[];
  recommendations?: string[];
}

export interface PatientStatus {
  stage: PatientStage;
  subStage?: string | null;
  updatedAt: string;
  updatedBy?: StatusUpdatedBy;
  source?: StatusSource;
}

export interface Consent {
  consentGiven: boolean;
  consentTimestamp: string;
  consentVersion: string;
  dataSharingConsent?: boolean;
}

export interface ProfileShare {
  id: string;
  clinicId: string;
  sharedAt: string;
  snapshotVersion: number;
  status: ShareStatus;
  viewedAt?: string | null;
  expiresAt?: string | null;
  shareToken: string;
}

export interface ProfileSnapshot {
  version: number;
  createdAt: string;
  data: Record<string, unknown>;
}

export interface Preferences {
  travelFlexibility?: TravelFlexibility;
  packagePreference?: PackagePreference;
}

// --- Main profile ---

export interface PatientProfile {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  profileVersion: number;

  patientInfo: PatientInfo;
  qualification?: Qualification;
  hairLoss?: HairLoss;
  medical?: Medical;
  photos?: PatientPhoto[];
  aiAnalysis?: AIAnalysis;
  status: PatientStatus;
  consent: Consent;
  preferences?: Preferences;
  shares?: ProfileShare[];
  snapshots?: ProfileSnapshot[];
}
