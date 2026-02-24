"use client"

import type { ReactNode } from "react"
import { Facebook, Globe, Instagram, MessageSquare, Youtube } from "lucide-react"
import { GoogleIcon } from "@/components/icons/GoogleIcon"
import { RedditIcon } from "@/components/icons/RedditIcon"

export type PostSource = "reddit" | "instagram" | "google" | "facebook" | "youtube" | "forums" | "other"

export const SOCIAL_LOGO_MAP: Record<PostSource, ReactNode> = {
  instagram: <Instagram className="h-5 w-5 text-[#E1306C]" />,
  facebook: <Facebook className="h-5 w-5 text-[#1877F2]" />,
  youtube: <Youtube className="h-5 w-5 text-[#FF0000]" />,
  reddit: <RedditIcon />,
  google: <GoogleIcon />,
  forums: <MessageSquare className="h-5 w-5 text-[#17375B]" />,
  other: <Globe className="h-5 w-5 text-muted-foreground" />,
}

export const SOURCE_LABEL: Record<PostSource, string> = {
  reddit: "Reddit",
  instagram: "Instagram",
  google: "Google Reviews",
  facebook: "Facebook",
  youtube: "YouTube",
  forums: "Forums",
  other: "Web",
}
