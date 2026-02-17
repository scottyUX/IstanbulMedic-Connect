"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface PlatformPillTabItem {
  value: string
  label: string
  icon?: React.ReactNode | LucideIcon
  iconColor?: string
}

interface PlatformPillTabsProps {
  defaultValue: string
  tabs: PlatformPillTabItem[]
  children: React.ReactNode
  className?: string
  listClassName?: string
}

const pillTriggerBase =
  "inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 im-text-body-sm font-medium text-foreground transition-colors hover:bg-muted/50"
const pillTriggerActive =
  "data-[state=active]:border-transparent data-[state=active]:bg-[var(--im-color-primary)] data-[state=active]:text-white data-[state=active]:hover:bg-[var(--im-color-primary)] [&[data-state=active]_svg]:!text-white"

export const PlatformPillTabs = ({
  defaultValue,
  tabs,
  children,
  className,
  listClassName,
}: PlatformPillTabsProps) => {
  return (
    <Tabs defaultValue={defaultValue} className={cn("w-full", className)}>
      <TabsList
        className={cn(
          "mb-4 flex h-auto w-fit flex-wrap gap-2 rounded-full border-0 bg-transparent p-0",
          listClassName
        )}
      >
        {tabs.map((tab) => {
          const icon = tab.icon
          // Lucide icons can be functions OR ForwardRef objects ({$$typeof, render})
          const isComponent =
            typeof icon === "function" ||
            (typeof icon === "object" &&
              icon !== null &&
              "$$typeof" in icon &&
              !React.isValidElement(icon))

          const iconElement = isComponent
            ? React.createElement(icon as React.ComponentType<{ className?: string; strokeWidth?: number }>, {
                className: cn("h-4 w-4 shrink-0", tab.iconColor),
                strokeWidth: 2,
              })
            : React.isValidElement(icon) || typeof icon === "string" || typeof icon === "number"
              ? icon
              : null

          return (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={cn(pillTriggerBase, pillTriggerActive)}
            >
              {iconElement}
              <span>{tab.label}</span>
            </TabsTrigger>
          )
        })}
      </TabsList>
      {children}
    </Tabs>
  )
}

PlatformPillTabs.Content = TabsContent
