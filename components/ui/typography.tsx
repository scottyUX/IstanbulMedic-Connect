"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type HeadingVariant = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "display"
type TextVariant = "body" | "body-lg" | "body-sm" | "body-xs" | "label" | "caption"
type TextWeight = "light" | "normal" | "medium" | "semibold" | "bold"

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: HeadingVariant
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
  weight?: "normal" | "semibold" | "bold"
}

export interface TextProps extends React.HTMLAttributes<HTMLElement> {
  variant?: TextVariant
  as?: "p" | "span" | "div"
  weight?: TextWeight
  muted?: boolean
}

const headingVariants: Record<HeadingVariant, string> = {
  h1: "im-heading-1",
  h2: "im-heading-2",
  h3: "im-heading-3",
  h4: "im-heading-4",
  h5: "im-heading-5",
  h6: "im-heading-6",
  display: "im-heading-display",
}

const textVariants: Record<TextVariant, string> = {
  body: "im-text-body",
  "body-lg": "im-text-body-lg",
  "body-sm": "im-text-body-sm",
  "body-xs": "im-text-body-xs",
  label: "im-text-label",
  caption: "im-text-caption",
}

const weightClasses: Record<TextWeight, string> = {
  light: "font-light",
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
}

const headingTagMap = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  display: "h1",
} as const

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant = "h2", as, weight, ...props }, ref) => {
    const Component = as || headingTagMap[variant]
    const baseClass = headingVariants[variant]
    
    const weightClass = weight === "normal" ? "font-normal" : 
                       weight === "semibold" ? "font-semibold" : 
                       weight === "bold" ? "font-bold" : ""

    return (
      <Component
        ref={ref}
        className={cn(baseClass, weightClass, className)}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export const Text = React.forwardRef<HTMLElement, TextProps>(
  ({ className, variant = "body", as = "p", weight, muted, ...props }, ref) => {
    const Component = as
    const baseClass = textVariants[variant]
    
    const weightClass = weight ? weightClasses[weight] : ""
    const mutedClass = muted ? "im-text-muted" : ""

    return (
      <Component
        ref={ref as React.ForwardedRef<HTMLParagraphElement>}
        className={cn(baseClass, weightClass, mutedClass, className)}
        {...props}
      />
    )
  }
)
Text.displayName = "Text"
