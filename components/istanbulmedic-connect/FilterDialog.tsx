"use client"

import * as React from "react"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog"
import { FilterPillGroup } from "@/components/ui/filter-pill"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RangeValueDisplay } from "@/components/ui/range-value-display"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { FILTER_CONFIG } from "@/lib/filterConfig"
import type { FilterState, TreatmentType, Language, Accreditation } from "./types"

// Rating filter options
const RATING_OPTIONS = [
    { value: "any", label: "Any" },
    { value: "4.0", label: "4.0+" },
    { value: "4.5", label: "4.5+" },
    { value: "4.8", label: "4.8+" },
] as const

// Review count filter options
const REVIEW_OPTIONS = [
    { value: "any", label: "Any" },
    { value: "10", label: "10+" },
    { value: "50", label: "50+" },
    { value: "200", label: "200+" },
] as const

interface FilterDialogProps {
    filters: FilterState
    onFilterChange: (newFilters: FilterState) => void
    open: boolean
    onOpenChange: (open: boolean) => void
    trigger?: React.ReactNode
}

export function FilterDialog({
    filters,
    onFilterChange,
    open,
    onOpenChange,
    trigger,
}: FilterDialogProps) {
    // Local state for the dialog, applied only on "Show results"
    const [localFilters, setLocalFilters] = React.useState<FilterState>(filters)

    // Sync local state when dialog opens
    React.useEffect(() => {
        if (open) {
            setLocalFilters(filters)
        }
    }, [open, filters])

    const handleApply = () => {
        onFilterChange(localFilters)
        onOpenChange(false)
    }

    const handleClearAll = () => {
        setLocalFilters({
            ...localFilters,
            treatments: {
                "Hair Transplant": false,
                "Dental": false,
                "Cosmetic Surgery": false,
                "Eye Surgery": false,
                "Bariatric Surgery": false,
            },
            budgetRange: [500, 12000],
            languages: {
                English: true,
                Turkish: false,
                Arabic: false,
                German: false,
            },
            accreditations: {
                JCI: false,
                ISO: false,
                "Ministry Licensed": false,
            },
            aiMatchScore: 0,
            minRating: null,
            minReviews: null,
        })
    }

    const updateArrayFilter = <K extends keyof FilterState>(
        key: K,
        subKey: string,
        value: boolean
    ) => {
        setLocalFilters((prev) => ({
            ...prev,
            [key]: {
                ...(prev[key] as Record<string, boolean>),
                [subKey]: value,
            },
        }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[720px] w-full p-0 gap-0 overflow-hidden flex flex-col max-h-[70vh] sm:rounded-2xl border-0 shadow-2xl">
                <DialogHeader className="px-6 py-5 border-b flex flex-row items-center justify-between space-y-0 min-h-[64px]">
                    <div className="flex items-center w-full justify-center relative">
                        <DialogClose className="absolute left-0 p-2 rounded-full hover:bg-neutral-100 transition-colors">
                            <X className="h-4 w-4" />
                        </DialogClose>
                        <DialogTitle className="text-base font-bold text-center">Filters</DialogTitle>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-8">
                        {/* Minimum Rating */}
                        {FILTER_CONFIG.minRating && (
                            <>
                                <section>
                                    <h3 className="im-heading-4 mb-2">Minimum Rating</h3>
                                    <p className="im-text-body-xs im-text-muted mb-4">
                                        Filter clinics by their Google rating.
                                    </p>
                                    <Select
                                        value={localFilters.minRating != null ? localFilters.minRating.toFixed(1) : "any"}
                                        onValueChange={(val) =>
                                            setLocalFilters({
                                                ...localFilters,
                                                minRating: val === "any" ? null : parseFloat(val),
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Any rating" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {RATING_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Minimum Reviews */}
                        {FILTER_CONFIG.minReviews && (
                            <>
                                <section>
                                    <h3 className="im-heading-4 mb-2">Minimum Reviews</h3>
                                    <p className="im-text-body-xs im-text-muted mb-4">
                                        Filter clinics by number of reviews.
                                    </p>
                                    <Select
                                        value={localFilters.minReviews?.toString() ?? "any"}
                                        onValueChange={(val) =>
                                            setLocalFilters({
                                                ...localFilters,
                                                minReviews: val === "any" ? null : parseInt(val, 10),
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full sm:w-[200px]">
                                            <SelectValue placeholder="Any number" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REVIEW_OPTIONS.map((opt) => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Price Range */}
                        {FILTER_CONFIG.budgetRange && (
                            <>
                                <section>
                                    <h3 className="im-heading-4 mb-4">Price range</h3>
                                    <div className="px-2">
                                        <Slider
                                            defaultValue={[500, 12000]}
                                            value={localFilters.budgetRange}
                                            min={500}
                                            max={12000}
                                            step={100}
                                            onValueChange={(val) => setLocalFilters({ ...localFilters, budgetRange: val as [number, number] })}
                                            className="w-full py-4"
                                        />
                                        <div className="flex items-center justify-between mt-4 gap-4">
                                            <RangeValueDisplay
                                                label="Minimum"
                                                value={localFilters.budgetRange[0]}
                                                format={(v) => `$${(typeof v === "number" ? v : Number(v)).toLocaleString()}`}
                                            />
                                            <div className="im-text-muted">-</div>
                                            <RangeValueDisplay
                                                label="Maximum"
                                                value={localFilters.budgetRange[1]}
                                                format={(v) => `$${(typeof v === "number" ? v : Number(v)).toLocaleString()}`}
                                            />
                                        </div>
                                    </div>
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Treatments - Pill Style */}
                        {FILTER_CONFIG.treatments && (
                            <>
                                <section>
                                    <h3 className="im-heading-4 mb-4">Treatments</h3>
                                    <FilterPillGroup
                                        items={Object.keys(localFilters.treatments) as TreatmentType[]}
                                        selected={localFilters.treatments}
                                        onToggle={(type) =>
                                            updateArrayFilter("treatments", type, !localFilters.treatments[type as TreatmentType])
                                        }
                                    />
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Main AI Score */}
                        {FILTER_CONFIG.aiMatchScore && (
                            <>
                                <section>
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="im-heading-4">AI Match Score</h3>
                                        <span className="im-text-body-sm im-text-label text-[var(--im-color-primary)]">{localFilters.aiMatchScore}%+</span>
                                    </div>
                                    <p className="im-text-body-xs im-text-muted mb-6">
                                        Show clinics that match your profile and preferences.
                                    </p>
                                    <div className="px-2">
                                        <Slider
                                            value={[localFilters.aiMatchScore]}
                                            min={0}
                                            max={100}
                                            step={5}
                                            onValueChange={(val) => setLocalFilters({ ...localFilters, aiMatchScore: val[0] })}
                                            className="w-full text-[var(--im-color-primary)]"
                                        />
                                    </div>
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Languages - Pill Style */}
                        {FILTER_CONFIG.languages && (
                            <>
                                <section>
                                    <h3 className="im-heading-4 mb-4">Languages</h3>
                                    <FilterPillGroup
                                        items={Object.keys(localFilters.languages) as Language[]}
                                        selected={localFilters.languages}
                                        onToggle={(lang) =>
                                            updateArrayFilter("languages", lang, !localFilters.languages[lang as Language])
                                        }
                                    />
                                </section>
                                <Separator />
                            </>
                        )}

                        {/* Accreditations - Checkbox Style (or Pill) */}
                        {FILTER_CONFIG.accreditations && (
                            <section>
                                <h3 className="im-heading-4 mb-4">Accreditations</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(Object.keys(localFilters.accreditations) as Accreditation[]).map((acc) => (
                                        <div key={acc} className="flex items-center space-x-3">
                                            <Checkbox
                                                id={`d-${acc}`}
                                                checked={localFilters.accreditations[acc]}
                                                onCheckedChange={(checked) =>
                                                    updateArrayFilter("accreditations", acc, checked as boolean)
                                                }
                                                className="h-5 w-5 border-2 border-input data-[state=checked]:border-[var(--im-color-primary)] data-[state=checked]:bg-[var(--im-color-primary)] data-[state=checked]:text-white"
                                            />
                                            <Label
                                                htmlFor={`d-${acc}`}
                                                className="text-base font-normal cursor-pointer leading-none"
                                            >
                                                {acc}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>

                <DialogFooter className="border-t p-4 sm:px-6 flex flex-row items-center justify-between sm:justify-between bg-white w-full">
                    <Button
                        variant="link"
                        onClick={handleClearAll}
                        className="text-base font-semibold text-foreground hover:text-[var(--im-color-secondary)] underline-offset-4 px-0"
                    >
                        Clear all
                    </Button>
                    <Button
                        onClick={handleApply}
                        size="lg"
                        className="bg-[var(--im-color-primary)] hover:bg-[var(--im-color-primary)]/90 text-white font-semibold rounded-lg px-8"
                    >
                        Show results
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
