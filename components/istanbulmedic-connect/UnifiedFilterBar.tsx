"use client"

import { useMemo, useState } from "react"
import { Search, SlidersHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FilterDialog } from "@/components/istanbulmedic-connect/FilterDialog"
import { cn } from "@/lib/utils"

import type { FilterState } from "./types"

interface UnifiedFilterBarProps {
    filters: FilterState
    onFilterChange: (newFilters: FilterState) => void
    onSearch: () => void
    className?: string
}

export const UnifiedFilterBar = ({
    filters,
    onFilterChange,
    onSearch,
    className,
}: UnifiedFilterBarProps) => {
    const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false)

    // Handlers for specific filter updates
    const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
        onFilterChange({ ...filters, [key]: value })
    }

    const activeTreatmentCount = Object.values(filters.treatments).filter(Boolean).length
    const activeLanguageCount = Object.values(filters.languages).filter(Boolean).length
    const activeAccreditationCount = Object.values(filters.accreditations).filter(Boolean).length
    const totalActiveFilters = activeTreatmentCount + activeLanguageCount + activeAccreditationCount

    const budgetLabel = useMemo(() => {
        const [min, max] = filters.budgetRange
        if (min === 500 && max === 12000) return "Any Budget"
        return `$${min.toLocaleString()} – $${max.toLocaleString()}`
    }, [filters.budgetRange])

    return (
        <div className={cn("w-full", className)}>
            {/* Mobile / Tablet / Desktop Unified Bar */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:bg-white md:rounded-full md:border md:shadow-md md:p-2 md:pl-6">

                {/* 1. Search (Treatment/Clinic Name) */}
                <div className="flex-1 relative group">
                    <div className="md:hidden mb-1 font-semibold text-sm">Search</div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground md:hidden" />
                        <Input
                            value={filters.searchQuery}
                            onChange={(e) => updateFilter("searchQuery", e.target.value)}
                            placeholder="Clinic name"
                            className="pl-9 md:pl-0 h-11 md:h-9 bg-white md:bg-transparent border md:border-none shadow-sm md:shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70 w-full"
                        />
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-300 mx-2" />

                {/* 2. Location */}
                <div className="flex-1 relative group">
                    <div className="md:hidden mb-1 font-semibold text-sm">Location</div>
                    <div className="relative">
                        {/* Mobile Icon */}
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground md:hidden" />
                        <Input
                            value={filters.location}
                            onChange={(e) => updateFilter("location", e.target.value)}
                            placeholder="City or country"
                            className="pl-9 md:pl-0 h-11 md:h-9 bg-white md:bg-transparent border md:border-none shadow-sm md:shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70 w-full"
                        />
                    </div>
                </div>

                <div className="hidden md:block w-px h-8 bg-gray-300 mx-2" />

                {/* 3. Filter Trigger Button */}
                <div className="flex-0 whitespace-nowrap">
                    <FilterDialog
                        filters={filters}
                        onFilterChange={onFilterChange}
                        open={isFilterDialogOpen}
                        onOpenChange={setIsFilterDialogOpen}
                        trigger={
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full md:w-auto h-11 md:h-10 md:rounded-full md:border-gray-300 md:hover:border-black flex items-center gap-2 px-4",
                                    totalActiveFilters > 0 && "border-black bg-accent/50"
                                )}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Filters
                                {totalActiveFilters > 0 && (
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--im-color-primary)] text-white text-[10px] font-bold">
                                        {totalActiveFilters}
                                    </span>
                                )}
                            </Button>
                        }
                    />
                </div>

                {/* 4. Search Button (Desktop: Circle, Mobile: Full Width) */}
                <div className="mt-2 md:mt-0">
                    <Button
                        size="icon"
                        className="hidden md:flex bg-[var(--im-color-primary)] hover:bg-[var(--im-color-primary)]/90 text-white rounded-full h-10 w-10 shrink-0 ml-2"
                        onClick={onSearch}
                    >
                        <Search className="h-4 w-4 stroke-[3px]" />
                    </Button>
                    <Button
                        size="lg"
                        className="w-full md:hidden bg-[var(--im-color-primary)] hover:bg-[var(--im-color-primary)]/90 text-white font-semibold h-12 shadow-md rounded-lg"
                        onClick={onSearch}
                    >
                        <Search className="mr-2 h-4 w-4 stroke-[3px]" />
                        Search
                    </Button>
                </div>
            </div>
        </div>
    )
}
