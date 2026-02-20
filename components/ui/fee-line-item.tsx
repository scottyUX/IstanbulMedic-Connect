"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const linkClass = "underline underline-offset-4 hover:text-foreground cursor-pointer"

interface FeeLineItemProps {
  label: ReactNode
  value: ReactNode
  underlineLabel?: boolean
  prominent?: boolean
  asLink?: boolean
  labelAsLink?: boolean
  valueAsLink?: boolean
  labelHref?: string
  valueHref?: string
  onLabelClick?: () => void
  onValueClick?: () => void
  className?: string
}

export const FeeLineItem = ({
  label,
  value,
  underlineLabel = false,
  prominent = false,
  asLink = false,
  labelAsLink,
  valueAsLink,
  labelHref,
  valueHref,
  onLabelClick,
  onValueClick,
  className,
}: FeeLineItemProps) => {
  const isLabelLink = asLink || labelAsLink || !!onLabelClick
  const isValueLink = valueAsLink || !!onValueClick

  const renderLabel = () => {
    if (onLabelClick) {
      return (
        <button
          type="button"
          onClick={onLabelClick}
          className={linkClass}
        >
          {label}
        </button>
      )
    }
    if (isLabelLink && labelHref) {
      return (
        <Link href={labelHref} className={linkClass}>
          {label}
        </Link>
      )
    }
    return (
      <span className={cn(asLink && linkClass, underlineLabel && "underline")}>
        {label}
      </span>
    )
  }

  const renderValue = () => {
    if (onValueClick) {
      return (
        <button
          type="button"
          onClick={onValueClick}
          className={linkClass}
        >
          {value}
        </button>
      )
    }
    if (isValueLink && valueHref) {
      return (
        <Link href={valueHref} className={linkClass}>
          {value}
        </Link>
      )
    }
    return <span className={cn(isValueLink && linkClass)}>{value}</span>
  }

  if (prominent) {
    return (
      <>
        <Separator className="my-4" />
        <div
          className={cn(
            "flex justify-between text-base text-lg font-semibold text-foreground",
            className
          )}
        >
          {renderLabel()}
          {renderValue()}
        </div>
      </>
    )
  }

  return (
    <div
      className={cn(
        "flex justify-between text-base text-muted-foreground mb-2",
        className
      )}
    >
      {renderLabel()}
      {renderValue()}
    </div>
  )
}
