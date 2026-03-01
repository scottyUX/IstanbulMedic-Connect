"use client"

import type { ReactNode } from "react"
import { Star, Globe } from "lucide-react"
import { GoogleIcon } from "@/components/icons/GoogleIcon"

// Review source types - extend as more platforms are supported
export type ReviewSource = "google" | "trustpilot" | "whatclinic" | "facebook" | "other"

// Map source names from database to our known types
export const normalizeReviewSource = (sourceName: string): ReviewSource => {
  const lower = sourceName.toLowerCase()
  if (lower.includes("google")) return "google"
  if (lower.includes("trustpilot")) return "trustpilot"
  if (lower.includes("whatclinic")) return "whatclinic"
  if (lower.includes("facebook")) return "facebook"
  return "other"
}

// Icons for each review source
export const REVIEW_SOURCE_ICON: Record<ReviewSource, ReactNode> = {
  google: <GoogleIcon />,
  trustpilot: <Star className="h-5 w-5 text-[#00B67A]" />,
  whatclinic: <Globe className="h-5 w-5 text-[#0066CC]" />,
  facebook: <Globe className="h-5 w-5 text-[#1877F2]" />,
  other: <Globe className="h-5 w-5 text-muted-foreground" />,
}

// Display labels for each source
export const REVIEW_SOURCE_LABEL: Record<ReviewSource, string> = {
  google: "Google Reviews",
  trustpilot: "Trustpilot",
  whatclinic: "WhatClinic",
  facebook: "Facebook",
  other: "Other",
}
