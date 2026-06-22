"use client"

import { cn } from "@/lib/utils"

interface InstagramIconProps {
  className?: string
}

export const InstagramIcon = ({ className }: InstagramIconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-5 w-5", className)}
  >
    <defs>
      <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
        <stop offset="0%" stopColor="#fdf497" />
        <stop offset="5%" stopColor="#fdf497" />
        <stop offset="45%" stopColor="#fd5949" />
        <stop offset="60%" stopColor="#d6249f" />
        <stop offset="90%" stopColor="#285AEB" />
      </radialGradient>
    </defs>
    <rect width="24" height="24" rx="6" fill="url(#ig-grad)" />
    <circle cx="12" cy="12" r="4.2" stroke="white" strokeWidth="1.8" fill="none" />
    <circle cx="17.2" cy="6.8" r="1.1" fill="white" />
  </svg>
)
