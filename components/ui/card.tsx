import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const cardVariants = cva(
  "border bg-card text-card-foreground",
  {
    variants: {
      variant: {
        default: "shadow",
        profile: "border-border/60 shadow-none",
        sidebar: "border-border/60 shadow-none",
        interactive: "border-border/60 shadow-none hover:border-primary/20 transition-all duration-300 cursor-pointer",
        nested: "border-border/40 shadow-none bg-muted/5",
      },
      radius: {
        sm: "rounded-lg",
        default: "rounded-xl",
        lg: "rounded-2xl",
        xl: "rounded-3xl",
      },
    },
    defaultVariants: {
      variant: "default",
      radius: "default",
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, radius, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, radius, className }))}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

export interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, as, ...props }, ref) => {
    const Component = as || "div"
    return (
      <Component
        ref={ref}
        className={cn("im-heading-4", className)}
        {...props}
      />
    )
  }
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("im-text-body-sm im-text-muted", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, cardVariants }
