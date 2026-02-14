import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import Link from "next/link"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "navy-primary":
          "rounded-[20px] min-w-[160px] min-h-[40px] py-2 px-4 bg-[var(--im-color-primary)] text-white hover:bg-[var(--im-color-navy-hover)] border-none",
        "navy-outline":
          "rounded-[20px] min-w-[150px] min-h-[40px] py-2 px-4 border border-[var(--im-color-primary)] text-[var(--im-color-primary)] hover:bg-[var(--im-color-navy-outline-hover)]",
        "teal-primary":
          "rounded-[20px] min-w-[160px] min-h-[40px] py-2 px-4 bg-[var(--im-color-secondary)] text-white hover:bg-[var(--im-color-teal-hover)] border-none",
        "teal-outline":
          "rounded-[20px] min-w-[150px] min-h-[40px] py-2 px-4 border border-[var(--im-color-secondary)] text-[var(--im-color-secondary)] hover:bg-[var(--im-color-secondary)]/10",
        "teal-secondary":
          "rounded-full min-h-[36px] py-2 px-4 bg-[var(--im-color-secondary)] text-white hover:bg-[var(--im-color-teal-hover)]",
        "leila-link":
          "rounded-full border border-[var(--im-color-primary)] bg-transparent px-5 py-2 text-[var(--im-color-primary)] hover:bg-[var(--im-color-gold-light)]",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-14 text-lg px-8 py-3",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  href?: string
  target?: string
  rel?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, href, target, rel, children, ...props }, ref) => {
    const classes = cn(buttonVariants({ variant, size, className }))
    
    // If href is provided, render as Link
    if (href) {
      // Filter out button-specific props that shouldn't be on anchor
      const { type, ...anchorProps } = props as React.AnchorHTMLAttributes<HTMLAnchorElement> & { type?: string }
      return (
        <Link
          href={href}
          target={target}
          rel={rel}
          className={classes}
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          {...anchorProps}
        >
          {children}
        </Link>
      )
    }
    
    // Otherwise render as button
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={classes}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
