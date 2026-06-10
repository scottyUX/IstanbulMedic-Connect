"use client"

import { cn } from "@/lib/utils"

interface RedditIconProps {
  className?: string
}

export const RedditIcon = ({ className }: RedditIconProps) => (
  <svg
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
    className={cn("h-5 w-5", className)}
  >
    {/* Orange circle */}
    <circle cx="10" cy="10" r="10" fill="#FF4500" />
    {/* Snoo body + ears */}
    <path
      fill="white"
      d="M16.67 10a1.46 1.46 0 0 0-2.47-1.01 7.17 7.17 0 0 0-3.85-1.22l.65-3.08 2.13.45a1.02 1.02 0 1 0 1.04-.97 1.02 1.02 0 0 0-.97.68l-2.38-.5a.16.16 0 0 0-.19.12l-.72 3.44a7.17 7.17 0 0 0-3.89 1.22 1.46 1.46 0 1 0-1.61 2.39c-.02.14-.03.29-.03.44 0 2.24 2.61 4.06 5.83 4.06s5.83-1.82 5.83-4.06c0-.15-.01-.3-.03-.44A1.46 1.46 0 0 0 16.67 10z"
    />
    {/* Eyes */}
    <circle cx="8.33" cy="10.83" r="0.83" fill="#FF4500" />
    <circle cx="11.67" cy="10.83" r="0.83" fill="#FF4500" />
    {/* Smile */}
    <path
      fill="#FF4500"
      d="M13.12 12.66a3.34 3.34 0 0 1-6.24 0 .16.16 0 0 1 .16-.16h5.92a.16.16 0 0 1 .16.16z"
    />
  </svg>
)
