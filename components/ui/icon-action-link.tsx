"use client"

import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface IconActionLinkProps {
  icon: ReactNode
  children: ReactNode
  onClick?: () => void
  className?: string
}

const iconLinkBaseClass =
  "w-full text-foreground hover:text-[#3EBBB7] py-3 px-4 font-medium flex items-center justify-start gap-2 underline-offset-4"

export const IconActionLink = ({
  icon,
  children,
  onClick,
  className,
}: IconActionLinkProps) => {
  return (
    <Button
      variant="link"
      className={cn(iconLinkBaseClass, className)}
      onClick={onClick}
      type="button"
    >
      {icon}
      {children}
    </Button>
  )
}
