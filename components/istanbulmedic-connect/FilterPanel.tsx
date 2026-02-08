"use client"

import { useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"

type Language = "English" | "Turkish" | "Arabic" | "German"
type Accreditation = "JCI" | "ISO" | "Ministry Licensed"
type TreatmentType = "Hair Transplant" | "Dental" | "Cosmetic Surgery" | "Eye Surgery" | "Bariatric Surgery"

export const FilterPanel = () => {
  const [treatmentTypes, setTreatmentTypes] = useState<Record<TreatmentType, boolean>>({
    "Hair Transplant": false,
    "Dental": false,
    "Cosmetic Surgery": false,
    "Eye Surgery": false,
    "Bariatric Surgery": false,
  })
  const [budgetRange, setBudgetRange] = useState<[number, number]>([1500, 7000])
  const [languages, setLanguages] = useState<Record<Language, boolean>>({
    English: true,
    Turkish: false,
    Arabic: false,
    German: false,
  })
  const [accreditations, setAccreditations] = useState<Record<Accreditation, boolean>>({
    JCI: false,
    ISO: false,
    "Ministry Licensed": true,
  })
  const [aiMatchScore, setAiMatchScore] = useState(75)

  const handleClearFilters = () => {
    setTreatmentTypes({
      "Hair Transplant": false,
      "Dental": false,
      "Cosmetic Surgery": false,
      "Eye Surgery": false,
      "Bariatric Surgery": false,
    })
    setBudgetRange([1500, 7000])
    setLanguages({ English: true, Turkish: false, Arabic: false, German: false })
    setAccreditations({ JCI: false, ISO: false, "Ministry Licensed": true })
    setAiMatchScore(75)
  }

  const budgetLabel = useMemo(() => {
    const [min, max] = budgetRange
    return `$${min.toLocaleString()} – $${max.toLocaleString()}`
  }, [budgetRange])

  return (
    <Card className="border-border/60 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold">Filters</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Narrow results using treatments, budget, and trust signals.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClearFilters}
            className="text-sm font-medium text-primary hover:underline"
            aria-label="Clear filters"
          >
            Clear
          </button>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-3">
          <div className="text-sm font-medium">Treatment Type</div>
          <div className="space-y-2">
            {(Object.keys(treatmentTypes) as TreatmentType[]).map((treatment) => (
              <label key={treatment} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={treatmentTypes[treatment]}
                  onCheckedChange={(checked) =>
                    setTreatmentTypes((prev) => ({ ...prev, [treatment]: Boolean(checked) }))
                  }
                  aria-label={`Treatment type ${treatment}`}
                />
                <span className="text-muted-foreground">{treatment}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Budget Range</div>
            <div className="text-sm text-muted-foreground">{budgetLabel}</div>
          </div>
          <Slider
            value={budgetRange}
            onValueChange={(value) => setBudgetRange([value[0] ?? 1500, value[1] ?? 7000])}
            min={500}
            max={12000}
            step={100}
            aria-label="Budget range"
          />
        </div>

        <div className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium">Languages</div>
          <div className="space-y-2">
            {(Object.keys(languages) as Language[]).map((lang) => (
              <label key={lang} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={languages[lang]}
                  onCheckedChange={(checked) =>
                    setLanguages((prev) => ({ ...prev, [lang]: Boolean(checked) }))
                  }
                  aria-label={`Language ${lang}`}
                />
                <span className="text-muted-foreground">{lang}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 lg:col-span-2">
          <div className="text-sm font-medium">Accreditations</div>
          <div className="space-y-2">
            {(Object.keys(accreditations) as Accreditation[]).map((acc) => (
              <label key={acc} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={accreditations[acc]}
                  onCheckedChange={(checked) =>
                    setAccreditations((prev) => ({ ...prev, [acc]: Boolean(checked) }))
                  }
                  aria-label={`Accreditation ${acc}`}
                />
                <span className="text-muted-foreground">{acc}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-3 md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">AI Match</div>
            <div className="text-sm text-muted-foreground">{aiMatchScore}%+</div>
          </div>
          <Slider
            value={[aiMatchScore]}
            onValueChange={(value) => setAiMatchScore(value[0] ?? 75)}
            min={0}
            max={100}
            step={5}
            aria-label="AI match score"
          />
        </div>
      </CardContent>

      <CardFooter className="pt-2">
        <Button className="w-full" type="button" onClick={() => {}}>
          Apply Filters
        </Button>
      </CardFooter>
    </Card>
  )
}

