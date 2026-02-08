export interface Clinic {
  id: number
  name: string
  location: string
  image: string
  specialties: string[]
  trustScore: number
  description: string
  rating?: number
  aiInsight?: string
}

export type Language = "English" | "Turkish" | "Arabic" | "German"
export type Accreditation = "JCI" | "ISO" | "Ministry Licensed"
export type TreatmentType = "Hair Transplant" | "Dental" | "Cosmetic Surgery" | "Eye Surgery" | "Bariatric Surgery"

export interface FilterState {
  searchQuery: string
  location: string
  treatments: Record<TreatmentType, boolean>
  budgetRange: [number, number]
  languages: Record<Language, boolean>
  accreditations: Record<Accreditation, boolean>
  aiMatchScore: number
}

