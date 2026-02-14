"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const sliderTrackVariants = cva(
  "relative w-full grow overflow-hidden rounded-full bg-muted",
  {
    variants: {
      size: {
        sm: "h-1",
        default: "h-1.5",
        lg: "h-2",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

const sliderRangeVariants = cva(
  "absolute h-full",
  {
    variants: {
      variant: {
        teal: "bg-[var(--im-color-secondary)]",
        navy: "bg-[var(--im-color-primary)]",
      },
    },
    defaultVariants: {
      variant: "teal",
    },
  }
)

const sliderThumbVariants = cva(
  "block rounded-full border-2 bg-white ring-offset-background transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--im-color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        teal: "border-[var(--im-color-secondary)]",
        navy: "border-[var(--im-color-primary)]",
      },
      size: {
        sm: "h-4 w-4",
        default: "h-5 w-5",
        lg: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "teal",
      size: "default",
    },
  }
)

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>,
    VariantProps<typeof sliderRangeVariants> {
  size?: VariantProps<typeof sliderTrackVariants>["size"]
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className, variant, size, value, defaultValue, ...props }, ref) => {
  // Determine number of thumbs from value or defaultValue
  const thumbCount = React.useMemo(() => {
    if (value && Array.isArray(value)) return value.length
    if (defaultValue && Array.isArray(defaultValue)) return defaultValue.length
    return 1 // Default to single thumb
  }, [value, defaultValue])

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track 
        className={sliderTrackVariants({ size })}
      >
        <SliderPrimitive.Range 
          className={sliderRangeVariants({ variant })} 
        />
      </SliderPrimitive.Track>
      {Array.from({ length: thumbCount }).map((_, index) => (
        <SliderPrimitive.Thumb 
          key={index}
          className={sliderThumbVariants({ variant, size })} 
        />
      ))}
    </SliderPrimitive.Root>
  )
})
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
