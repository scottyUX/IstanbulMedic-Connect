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

