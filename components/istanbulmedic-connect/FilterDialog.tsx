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
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

import type { FilterState, TreatmentType, Language, Accreditation } from "./types"

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
                        {/* Price Range */}
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Price range</h3>
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
                                    <div className="border rounded-xl px-4 py-2 w-full">
                                        <span className="text-xs text-muted-foreground block mb-0.5">Minimum</span>
                                        <span className="text-sm font-medium">${localFilters.budgetRange[0].toLocaleString()}</span>
                                    </div>
                                    <div className="text-muted-foreground">-</div>
                                    <div className="border rounded-xl px-4 py-2 w-full">
                                        <span className="text-xs text-muted-foreground block mb-0.5">Maximum</span>
                                        <span className="text-sm font-medium">${localFilters.budgetRange[1].toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator />

                        {/* Treatments - Pill Style */}
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Treatments</h3>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(localFilters.treatments) as TreatmentType[]).map((type) => {
                                    const isSelected = localFilters.treatments[type]
                                    return (
                                        <button
                                            key={type}
                                            onClick={() => updateArrayFilter("treatments", type, !isSelected)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${isSelected
                                                ? "bg-[#17375B] text-white border-[#17375B] hover:opacity-90"
                                                : "bg-white text-foreground border-border hover:border-[#17375B] hover:text-[#17375B]"
                                                }`}
                                        >
                                            {type}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        <Separator />

                        {/* Main AI Score */}
                        <section>
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold">AI Match Score</h3>
                                <span className="text-sm font-medium text-[#17375B]">{localFilters.aiMatchScore}%+</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Show clinics that match your profile and preferences.
                            </p>
                            <div className="px-2">
                                <Slider
                                    value={[localFilters.aiMatchScore]}
                                    min={0}
                                    max={100}
                                    step={5}
                                    onValueChange={(val) => setLocalFilters({ ...localFilters, aiMatchScore: val[0] })}
                                    className="w-full text-[#17375B]"
                                />
                            </div>
                        </section>

                        <Separator />

                        {/* Languages - Pill Style */}
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Languages</h3>
                            <div className="flex flex-wrap gap-2">
                                {(Object.keys(localFilters.languages) as Language[]).map((lang) => {
                                    const isSelected = localFilters.languages[lang]
                                    return (
                                        <button
                                            key={lang}
                                            onClick={() => updateArrayFilter("languages", lang, !isSelected)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${isSelected
                                                ? "bg-[#17375B] text-white border-[#17375B] hover:opacity-90"
                                                : "bg-white text-foreground border-border hover:border-[#17375B] hover:text-[#17375B]"
                                                }`}
                                        >
                                            {lang}
                                        </button>
                                    )
                                })}
                            </div>
                        </section>

                        <Separator />

                        {/* Accreditations - Checkbox Style (or Pill) */}
                        <section>
                            <h3 className="text-lg font-semibold mb-4">Accreditations</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(Object.keys(localFilters.accreditations) as Accreditation[]).map((acc) => (
                                    <div key={acc} className="flex items-center space-x-3">
                                        <Checkbox
                                            id={`d-${acc}`}
                                            checked={localFilters.accreditations[acc]}
                                            onCheckedChange={(checked) => updateArrayFilter("accreditations", acc, checked as boolean)}
                                            className="h-5 w-5 border-2 border-input data-[state=checked]:border-[#17375B] data-[state=checked]:bg-[#17375B] data-[state=checked]:text-white"
                                        />
                                        <label
                                            htmlFor={`d-${acc}`}
                                            className="text-base font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {acc}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                <DialogFooter className="border-t p-4 sm:px-6 flex flex-row items-center justify-between sm:justify-between bg-white w-full">
                    <Button
                        variant="ghost"
                        onClick={handleClearAll}
                        className="text-base font-semibold text-foreground underline-offset-4 hover:underline px-0 hover:bg-transparent"
                    >
                        Clear all
                    </Button>
                    <Button
                        onClick={handleApply}
                        size="lg"
                        className="bg-[#17375B] hover:bg-[#17375B]/90 text-white font-semibold rounded-lg px-8"
                    >
                        Show results
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
