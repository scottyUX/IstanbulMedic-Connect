"use client"

import { useState } from "react"
import {
  Calendar,
  Heart,
  Share2,
  Plus,
  Bookmark,
  Search,
  Star,
  ShieldCheck,
  X,
  ChevronRight,
  Menu,
} from "lucide-react"
import { Dancing_Script, Merriweather, Poppins } from "next/font/google"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Heading, Text } from "@/components/ui/typography"

const headingFont = Merriweather({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--im-font-heading",
  display: "swap",
})

const bodyFont = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--im-font-body",
  display: "swap",
})

const scriptFont = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--im-font-script",
  display: "swap",
})

const NAV_SECTIONS = [
  { id: "button", label: "Button" },
  { id: "badge", label: "Badge" },
  { id: "input", label: "Input" },
  { id: "select", label: "Select" },
  { id: "checkbox", label: "Checkbox" },
  { id: "slider", label: "Slider" },
  { id: "card", label: "Card" },
  { id: "icon-buttons", label: "Icon Buttons" },
  { id: "color-reference", label: "Color Reference" },
  { id: "separator", label: "Separator" },
  { id: "navigation", label: "Navigation" },
  { id: "typography", label: "Typography" },
] as const

export default function DesignSystemPage() {
  const [checked, setChecked] = useState(false)
  const [sliderValue, setSliderValue] = useState([50])
  const [budgetRange, setBudgetRange] = useState([500, 5000])
  const [aiMatchScore, setAiMatchScore] = useState([75])

  return (
    <div className={`${headingFont.variable} ${bodyFont.variable} ${scriptFont.variable} imConnectTheme min-h-screen bg-background`}>
      <div className="flex gap-8 p-6 lg:p-8 max-w-[1600px] mx-auto">
        {/* Side Nav */}
        <aside className="hidden lg:block w-56 shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Design System</p>
            {NAV_SECTIONS.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 space-y-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Design System</h1>
            <p className="text-muted-foreground">Components, colors, and typography used across the application</p>
          </div>

          {/* Buttons Section */}
          <Card id="button" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Button Component</CardTitle>
            <CardDescription>All button variants and sizes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-sm text-muted-foreground mb-6">Component: <code className="bg-muted px-2 py-1 rounded">Button</code></p>

            {/* All Variants Overview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">All Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Standard Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Standard Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="default">Default</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="link">Link</Button>
                  </div>
                </div>

                {/* Navy Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Navy Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="navy-primary">Navy Primary</Button>
                    <Button variant="navy-outline">Navy Outline</Button>
                  </div>
                </div>

                {/* Teal Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Teal Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="teal-primary">Teal Primary</Button>
                    <Button variant="teal-outline">Teal Outline</Button>
                    <Button variant="teal-secondary">Teal Secondary</Button>
                  </div>
                </div>

                {/* Special Variants */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Special Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="leila-link">Talk to Leila</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Variant Details with Sizes */}
            <div className="space-y-8">
              {/* Navy Primary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Navy Primary</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">navy-primary</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="navy-primary" size="sm">Small</Button>
                  <Button variant="navy-primary" size="default">Default</Button>
                  <Button variant="navy-primary" size="lg">Large</Button>
                  <Button variant="navy-primary" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Navy Outline */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Navy Outline</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">navy-outline</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="navy-outline" size="sm">Small</Button>
                  <Button variant="navy-outline" size="default">Default</Button>
                  <Button variant="navy-outline" size="lg">Large</Button>
                  <Button variant="navy-outline" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Teal Primary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Teal Primary</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">teal-primary</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="teal-primary" size="sm">Small</Button>
                  <Button variant="teal-primary" size="default">Default</Button>
                  <Button variant="teal-primary" size="lg">Large</Button>
                  <Button variant="teal-primary" size="xl">Extra Large</Button>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Example Usage:</p>
                  <Button variant="teal-primary" size="xl" className="font-medium">
                    Book Consultation
                  </Button>
                </div>
              </div>

              {/* Teal Outline */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Teal Outline</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">teal-outline</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="teal-outline" size="sm">Small</Button>
                  <Button variant="teal-outline" size="default">Default</Button>
                  <Button variant="teal-outline" size="lg">Large</Button>
                  <Button variant="teal-outline" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Teal Secondary */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Teal Secondary</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">teal-secondary</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="teal-secondary" size="sm">Small</Button>
                  <Button variant="teal-secondary" size="default">Default</Button>
                  <Button variant="teal-secondary" size="lg">Large</Button>
                  <Button variant="teal-secondary" size="xl">Extra Large</Button>
                </div>
              </div>

              {/* Leila Link */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Leila Link</h3>
                <p className="text-sm text-muted-foreground mb-4">Variant: <code className="bg-muted px-2 py-1 rounded">leila-link</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button variant="leila-link" size="sm">Small</Button>
                  <Button variant="leila-link" size="default">Default</Button>
                  <Button variant="leila-link" size="lg">Large</Button>
                  <Button variant="leila-link" size="xl">Extra Large</Button>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground mb-2">Example Usage:</p>
                  <Button variant="leila-link">
                    Talk to Leila
                  </Button>
                </div>
              </div>

              {/* Standard Variants */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Standard Variants</h3>
                <p className="text-sm text-muted-foreground mb-4">Default, Outline, Secondary, Ghost, Link</p>
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="default" size="sm">Default Small</Button>
                    <Button variant="default" size="default">Default</Button>
                    <Button variant="default" size="lg">Default Large</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="outline" size="sm">Outline Small</Button>
                    <Button variant="outline" size="default">Outline</Button>
                    <Button variant="outline" size="lg">Outline Large</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="secondary" size="sm">Secondary Small</Button>
                    <Button variant="secondary" size="default">Secondary</Button>
                    <Button variant="secondary" size="lg">Secondary Large</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="ghost" size="sm">Ghost Small</Button>
                    <Button variant="ghost" size="default">Ghost</Button>
                    <Button variant="ghost" size="lg">Ghost Large</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4">
                    <Button variant="link" size="sm">Link Small</Button>
                    <Button variant="link" size="default">Link</Button>
                    <Button variant="link" size="lg">Link Large</Button>
                  </div>
                </div>
              </div>

              {/* Icon Size */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Icon Button</h3>
                <p className="text-sm text-muted-foreground mb-4">Size: <code className="bg-muted px-2 py-1 rounded">icon</code></p>
                <div className="flex flex-wrap items-center gap-4">
                  <Button size="icon" variant="default">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="navy-primary">
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="teal-primary">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Link Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Link Buttons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">With Icons (Action Buttons)</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button
                      variant="link"
                      className="text-foreground hover:text-[#3EBBB7] py-3 px-4 font-medium flex items-center justify-start gap-2 underline-offset-4"
                    >
                      <Plus className="w-4 h-4" />
                      Add to Compare
                    </Button>
                    <Button
                      variant="link"
                      className="text-foreground hover:text-[#3EBBB7] py-3 px-4 font-medium flex items-center justify-start gap-2 underline-offset-4"
                    >
                      <Bookmark className="w-4 h-4" />
                      Save Clinic
                    </Button>
                    <Button
                      variant="link"
                      className="text-foreground hover:text-[#3EBBB7] py-3 px-4 font-medium flex items-center justify-start gap-2 underline-offset-4"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </Button>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-3">Text Only (Navigation)</h4>
                  <div className="flex flex-wrap gap-4">
                    <Button variant="link" className="text-foreground hover:text-[#3EBBB7] underline-offset-4">
                      Clear all filters
                    </Button>
                    <Button variant="link" size="sm" className="gap-2 text-base font-medium text-foreground hover:text-[#3EBBB7] underline-offset-4">
                      View all photos
                    </Button>
                    <Button variant="link" size="sm" className="gap-2 text-base font-medium text-foreground hover:text-[#3EBBB7] underline-offset-4">
                      View on map
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Search Buttons */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Filter & Search Buttons</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" size="lg" className="min-w-[200px]">
                  Load More Clinics
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-8 text-base font-semibold border-black/80 hover:bg-neutral-50 rounded-lg">
                  Write a Review
                </Button>
                <Button
                  variant="outline"
                  className="w-full md:w-auto h-11 md:h-10 md:rounded-full md:border-gray-300 md:hover:border-black flex items-center gap-2 px-4"
                >
                  <Search className="h-4 w-4" />
                  Filters
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#17375B] text-white text-[10px] font-bold">
                    3
                  </span>
                </Button>
                <Button
                  size="icon"
                  className="bg-[#17375B] hover:bg-[#17375B]/90 text-white rounded-full h-10 w-10 shrink-0"
                >
                  <Search className="h-4 w-4 stroke-[3px]" />
                </Button>
                <Button
                  size="lg"
                  className="w-full md:hidden bg-[#17375B] hover:bg-[#17375B]/90 text-white font-semibold h-12 shadow-md rounded-lg"
                >
                  <Search className="mr-2 h-4 w-4 stroke-[3px]" />
                  Search
                </Button>
              </div>
            </div>

            {/* Disabled States */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Disabled States</h3>
              <p className="text-sm text-muted-foreground mb-4">All variants support disabled state</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Standard Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="default" disabled>Disabled Default</Button>
                    <Button variant="outline" disabled>Disabled Outline</Button>
                    <Button variant="secondary" disabled>Disabled Secondary</Button>
                    <Button variant="ghost" disabled>Disabled Ghost</Button>
                    <Button variant="link" disabled>Disabled Link</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Navy Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="navy-primary" disabled>Disabled Navy Primary</Button>
                    <Button variant="navy-outline" disabled>Disabled Navy Outline</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Teal Variants</h4>
                  <div className="flex flex-col gap-2">
                    <Button variant="teal-primary" disabled>Disabled Teal Primary</Button>
                    <Button variant="teal-outline" disabled>Disabled Teal Outline</Button>
                    <Button variant="teal-secondary" disabled>Disabled Teal Secondary</Button>
                    <Button variant="leila-link" disabled>Disabled Leila Link</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card id="badge" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Badge Component</CardTitle>
            <CardDescription>All badge variants and styles used in the app</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shadcn Badge Variants (Used in App) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Badge Variants (Used in App)</h3>
              <p className="text-sm text-muted-foreground mb-4">Component: <code className="bg-muted px-2 py-1 rounded">Badge</code></p>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            {/* Brand Color Badges */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Brand Color Badges</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge className="bg-[#3EBBB7] text-white">Teal</Badge>
                <Badge className="bg-[#17375B] text-white hover:bg-[#17375B]/90">Navy</Badge>
                <Badge className="bg-[#17375B] text-white hover:bg-[#17375B]/90">
                  Sentiment: <span className="ml-1 font-bold">Positive</span>
                </Badge>
              </div>
            </div>

            {/* Special Purpose Badges */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Special Purpose Badges</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge className="bg-black text-white hover:bg-neutral-800 text-[10px]">AI Assistant</Badge>
                <Badge className="flex h-5 w-5 items-center justify-center rounded-full bg-[#17375B] text-white text-[10px] font-bold">
                  3
                </Badge>
                <Badge variant="secondary" className="text-sm">Language</Badge>
                <Badge variant="secondary" className="text-sm">Payment Method</Badge>
              </div>
            </div>

            {/* Doctor Credentials Style */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Doctor Credentials Badges</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  MD
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  Board Certified
                </Badge>
                <Badge variant="secondary" className="px-3 py-1.5 text-sm font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  15+ yrs
                </Badge>
              </div>
            </div>

            {/* Specialty Tags (ClinicCard style) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Specialty Tags (ClinicCard Style)</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#FFF9E5] text-[#857500]">
                  Hair Transplant
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#E8EBEF] text-[#102741]">
                  Dental
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#F6EEF1] text-[#723B54]">
                  Cosmetic Surgery
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#F8F1EB] text-[#835224]">
                  Eye Surgery
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#FFF9E5] text-[#857500]">
                  Bariatric Surgery
                </span>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium bg-[#F6EEF1] text-[#723B54]">
                  Plastic Surgery
                </span>
              </div>
            </div>

            {/* Overview Section Badges */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Overview Section Badges</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge variant="secondary" className="font-medium text-sm">Specialty 1</Badge>
                <Badge variant="secondary" className="font-medium text-sm">Specialty 2</Badge>
                <Badge variant="secondary" className="font-medium text-sm">Specialty 3</Badge>
              </div>
            </div>

            {/* Community Signals Badges */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Community Signals Badges</h3>
              <div className="flex flex-wrap gap-2 items-center">
                <Badge className="bg-[#17375B] text-white hover:bg-[#17375B]/90">
                  Sentiment: <span className="ml-1 font-bold">Positive</span>
                </Badge>
                <Badge variant="secondary" className="text-sm">Common Theme 1</Badge>
                <Badge variant="secondary" className="text-sm">Common Theme 2</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card id="input" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Input Component</CardTitle>
            <CardDescription>Input fields and form controls with correct colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Standard Inputs</h3>
              <p className="text-sm text-muted-foreground mb-4">Component: <code className="bg-muted px-2 py-1 rounded">Input</code></p>
              <div className="space-y-4">
                <Input placeholder="Default input" />
                <Input placeholder="Disabled input" disabled />
                <Input placeholder="With focus ring (navy #17375B)" className="focus-visible:ring-[#17375B]" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Inputs with Icons</h3>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="With icon" className="pl-10" />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground md:hidden" />
                  <Input 
                    placeholder="Treatment or clinic name" 
                    className="pl-9 md:pl-0 h-11 md:h-9 bg-white md:bg-transparent border md:border-none shadow-sm md:shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70" 
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Filter Bar Inputs</h3>
              <div className="space-y-4">
                <Input 
                  placeholder="Where in Istanbul?" 
                  className="h-11 md:h-9 bg-white md:bg-transparent border md:border-none shadow-sm md:shadow-none focus-visible:ring-0 text-base placeholder:text-muted-foreground/70" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Select Section */}
        <Card id="select" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Select Component</CardTitle>
            <CardDescription>Dropdown selects with correct styling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="im-heading-4 mb-4">Standard Select</h3>
              <p className="im-text-body-xs im-text-muted mb-4">Component: <code className="bg-muted px-2 py-1 rounded">Select</code></p>
              <Select defaultValue="option1">
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                  <SelectItem value="option2">Option 2</SelectItem>
                  <SelectItem value="option3">Option 3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h3 className="im-heading-4 mb-4">Sort Select (Explore Clinics)</h3>
              <p className="im-text-body-xs im-text-muted mb-2">Component: <code className="bg-muted px-2 py-1 rounded">Select</code></p>
              <div className="flex items-center gap-2">
                <span className="im-text-body im-text-muted">Sort by:</span>
                <Select defaultValue="Best Match">
                  <SelectTrigger className="w-[180px] h-9 bg-white" aria-label="Sort clinics">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Best Match">Best Match</SelectItem>
                    <SelectItem value="Highest Rated">Highest Rated</SelectItem>
                    <SelectItem value="Most Transparent">Most Transparent</SelectItem>
                    <SelectItem value="Price: Low to High">Price: Low to High</SelectItem>
                    <SelectItem value="Price: High to Low">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="im-text-body-xs im-text-muted mt-2">
                Select component now uses typography system (im-text-body-sm) and brand focus ring color (#17375B)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Checkbox Section */}
        <Card id="checkbox" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Checkbox Component</CardTitle>
            <CardDescription>Checkbox controls with correct navy brand color (#17375B)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Standard Checkboxes</h3>
              <p className="text-sm text-muted-foreground mb-4">Component: <code className="bg-muted px-2 py-1 rounded">Checkbox</code></p>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="check1" checked={checked} onCheckedChange={(v) => setChecked(v === true)} />
                  <label htmlFor="check1" className="cursor-pointer">
                    Checked checkbox (navy)
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="check2" />
                  <label htmlFor="check2" className="cursor-pointer">
                    Unchecked checkbox
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="check3" disabled />
                  <label htmlFor="check3" className="cursor-pointer text-muted-foreground">
                    Disabled checkbox
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Filter Dialog Checkboxes</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="filter-check1"
                    checked={true}
                    className="h-5 w-5 border-2 border-input data-[state=checked]:border-[#17375B] data-[state=checked]:bg-[#17375B] data-[state=checked]:text-white"
                  />
                  <label htmlFor="filter-check1" className="text-base font-normal cursor-pointer">
                    JCI Accredited
                  </label>
                </div>
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="filter-check2"
                    className="h-5 w-5 border-2 border-input data-[state=checked]:border-[#17375B] data-[state=checked]:bg-[#17375B] data-[state=checked]:text-white"
                  />
                  <label htmlFor="filter-check2" className="text-base font-normal cursor-pointer">
                    ISO Certified
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Clinic Card Compare Checkbox</h3>
              <div className="flex items-center gap-2">
                <Checkbox id="compare-check" />
                <label htmlFor="compare-check" className="cursor-pointer select-none text-sm text-muted-foreground">
                  Compare
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Slider Section */}
        <Card id="slider" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Slider Component</CardTitle>
            <CardDescription>Range sliders with variant and size options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="im-text-body-sm im-text-muted mb-6">Component: <code className="bg-muted px-2 py-1 rounded">Slider</code></p>

            {/* Variants */}
            <div>
              <h3 className="im-heading-4 mb-4">Variants</h3>
              <div className="space-y-6">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Teal (Default)</p>
                  <Slider value={sliderValue} onValueChange={setSliderValue} variant="teal" className="w-full" />
                  <p className="im-text-body-xs im-text-muted mt-2">Value: {sliderValue[0]}</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Navy</p>
                  <Slider value={sliderValue} onValueChange={setSliderValue} variant="navy" className="w-full" />
                  <p className="im-text-body-xs im-text-muted mt-2">Value: {sliderValue[0]}</p>
                </div>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <h3 className="im-heading-4 mb-4">Sizes</h3>
              <div className="space-y-6">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Small</p>
                  <Slider value={sliderValue} onValueChange={setSliderValue} size="sm" className="w-full" />
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Default</p>
                  <Slider value={sliderValue} onValueChange={setSliderValue} size="default" className="w-full" />
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Large</p>
                  <Slider value={sliderValue} onValueChange={setSliderValue} size="lg" className="w-full" />
                </div>
              </div>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="im-heading-4 mb-4">Usage Examples</h3>
              <div className="space-y-6">
                {/* Budget Range (Dual-thumb) */}
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Budget Range (Dual-thumb)</p>
                  <div className="px-2">
                    <Slider
                      value={budgetRange}
                      onValueChange={setBudgetRange}
                      min={500}
                      max={12000}
                      step={100}
                      className="w-full py-4"
                    />
                    <div className="flex items-center justify-between mt-4 gap-4">
                      <div className="border rounded-xl px-4 py-2 w-full">
                        <span className="im-text-body-xs im-text-muted block mb-0.5">Minimum</span>
                        <span className="im-text-body-sm im-text-label">${budgetRange[0].toLocaleString()}</span>
                      </div>
                      <div className="im-text-muted">-</div>
                      <div className="border rounded-xl px-4 py-2 w-full">
                        <span className="im-text-body-xs im-text-muted block mb-0.5">Maximum</span>
                        <span className="im-text-body-sm im-text-label">${budgetRange[1].toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Match Score (Single-thumb) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="im-text-body-xs im-text-muted">AI Match Score</p>
                    <span className="im-text-body-sm im-text-label text-[#17375B]">{aiMatchScore[0]}%+</span>
                  </div>
                  <p className="im-text-body-xs im-text-muted mb-4">
                    Show clinics that match your profile and preferences.
                  </p>
                  <div className="px-2">
                    <Slider
                      value={aiMatchScore}
                      onValueChange={setAiMatchScore}
                      min={0}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="border-t pt-4">
              <p className="im-text-body-xs im-text-muted">
                Slider uses design system colors: Teal (#3EBBB7) default, Navy (#17375B). 
                Focus ring uses brand navy (#17375B). Track background uses muted color from design system.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <Card id="card" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Card Component</CardTitle>
            <CardDescription>All card variants and usage patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="im-text-body-sm im-text-muted mb-6">Component: <code className="bg-muted px-2 py-1 rounded">Card</code></p>

            {/* Card Variants */}
            <div>
              <h3 className="im-heading-4 mb-4">Card Variants</h3>
              <div className="space-y-6">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Variant: <code className="bg-muted px-2 py-1 rounded">default</code></p>
                  <Card>
                    <CardHeader>
                      <CardTitle>Default Card</CardTitle>
                      <CardDescription>Standard card with shadow - used in UI showcase and general cards</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="im-text-body">This is the default card styling with shadow.</p>
                    </CardContent>
                    <CardFooter>
                      <Button className="w-full">Action</Button>
                    </CardFooter>
                  </Card>
                </div>

                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Variant: <code className="bg-muted px-2 py-1 rounded">profile</code></p>
                  <Card variant="profile">
                    <CardHeader className="pb-3">
                      <h2 className="im-heading-2">Profile Section Card</h2>
                    </CardHeader>
                    <CardContent>
                      <p className="im-text-body">
                        Used in clinic profile sections (Overview, Doctors, Transparency, etc.)
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Variant: <code className="bg-muted px-2 py-1 rounded">sidebar</code></p>
                  <Card variant="sidebar">
                    <CardHeader className="pb-6">
                      <CardTitle>Sidebar Card</CardTitle>
                      <CardDescription>Used in summary sidebar</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="im-text-body">Sidebar card with consistent border styling.</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Variant: <code className="bg-muted px-2 py-1 rounded">interactive</code></p>
                  <Card variant="interactive" radius="xl">
                    <CardContent className="p-6">
                      <CardTitle className="mb-2">Interactive Card</CardTitle>
                      <p className="im-text-body">
                        Clickable card with hover effects - used for ClinicCard components
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Variant: <code className="bg-muted px-2 py-1 rounded">nested</code></p>
                  <Card variant="profile">
                    <CardHeader>
                      <CardTitle>Parent Card</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="im-text-body">Cards can contain nested cards:</p>
                      <Card variant="nested" radius="lg">
                        <CardContent className="p-4">
                          <p className="im-text-body-sm">Nested card content</p>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Border Radius Variants */}
            <div>
              <h3 className="im-heading-4 mb-4">Border Radius Variants</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Radius: <code className="bg-muted px-2 py-1 rounded">sm</code></p>
                  <Card variant="profile" radius="sm">
                    <CardContent className="p-4">
                      <p className="im-text-body-sm">Small radius (8px)</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Radius: <code className="bg-muted px-2 py-1 rounded">default</code></p>
                  <Card variant="profile" radius="default">
                    <CardContent className="p-4">
                      <p className="im-text-body-sm">Default radius (12px)</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Radius: <code className="bg-muted px-2 py-1 rounded">lg</code></p>
                  <Card variant="profile" radius="lg">
                    <CardContent className="p-4">
                      <p className="im-text-body-sm">Large radius (16px)</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Radius: <code className="bg-muted px-2 py-1 rounded">xl</code></p>
                  <Card variant="profile" radius="xl">
                    <CardContent className="p-4">
                      <p className="im-text-body-sm">Extra large radius (24px)</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Card Components */}
            <div>
              <h3 className="im-heading-4 mb-4">Card Sub-components</h3>
              <Card variant="profile">
                <CardHeader>
                  <CardTitle>Card Header</CardTitle>
                  <CardDescription>CardDescription uses typography system (im-text-body-sm im-text-muted)</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="im-text-body">CardContent - Main content area with padding</p>
                  <p className="im-text-body-sm im-text-muted mt-2">
                    CardTitle uses typography system (im-heading-4) and can accept an `as` prop for semantic HTML
                  </p>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Card Footer</Button>
                </CardFooter>
              </Card>
            </div>

            {/* Usage Examples */}
            <div>
              <h3 className="im-heading-4 mb-4">Usage Examples</h3>
              <div className="space-y-6">
                <div>
                  <p className="im-text-body-sm font-semibold mb-2">Profile Section Pattern:</p>
                  <Card variant="profile" className="scroll-mt-32">
                    <CardHeader className="pb-3">
                      <h2 className="im-heading-2">Section Title</h2>
                    </CardHeader>
                    <CardContent>
                      <p className="im-text-body">Content goes here</p>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <p className="im-text-body-sm font-semibold mb-2">Interactive Card Pattern:</p>
                  <Card variant="interactive" radius="xl" className="cursor-pointer">
                    <CardContent className="p-6">
                      <CardTitle className="mb-2">Clinic Card</CardTitle>
                      <p className="im-text-body">Clickable card with hover effects</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div>
              <h3 className="im-heading-4 mb-4">Usage Guidelines</h3>
              <div className="space-y-3 im-text-body-sm">
                <div>
                  <p className="font-semibold mb-1">When to use each variant:</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li><code className="bg-muted px-1 rounded">default</code>: General cards, UI showcase</li>
                    <li><code className="bg-muted px-1 rounded">profile</code>: Clinic profile section cards</li>
                    <li><code className="bg-muted px-1 rounded">sidebar</code>: Sidebar cards (summary, filters)</li>
                    <li><code className="bg-muted px-1 rounded">interactive</code>: Clickable cards (ClinicCard)</li>
                    <li><code className="bg-muted px-1 rounded">nested</code>: Cards within cards</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Border Radius Guidelines:</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li><code className="bg-muted px-1 rounded">sm</code>: Small nested elements</li>
                    <li><code className="bg-muted px-1 rounded">default</code>: Standard cards (most common)</li>
                    <li><code className="bg-muted px-1 rounded">lg</code>: Larger nested cards</li>
                    <li><code className="bg-muted px-1 rounded">xl</code>: Hero/interactive cards</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Typography Integration:</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li>CardTitle automatically uses <code className="bg-muted px-1 rounded">im-heading-4</code></li>
                    <li>CardDescription automatically uses <code className="bg-muted px-1 rounded">im-text-body-sm im-text-muted</code></li>
                    <li>Use semantic HTML with CardTitle <code className="bg-muted px-1 rounded">as</code> prop when needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Icon Buttons Section */}
        <Card id="icon-buttons" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Button Component (Icon Size)</CardTitle>
            <CardDescription>Icon button styles used in the app</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Component: <code className="bg-muted px-2 py-1 rounded">Button</code> with <code className="bg-muted px-2 py-1 rounded">size=&quot;icon&quot;</code></p>
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="icon" className="bg-[#17375B] hover:bg-[#17375B]/90 text-white rounded-full h-10 w-10">
                <Search className="h-4 w-4 stroke-[3px]" />
              </Button>
              <Button size="icon" variant="outline" className="rounded-full">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Color Reference */}
        <Card id="color-reference" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Color Reference</CardTitle>
            <CardDescription>Brand colors used throughout the app</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {/* Primary Colors */}
              <div>
                <h3 className="im-heading-4 mb-4">Primary Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-primary)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Primary</p>
                    <p className="im-text-body-xs im-text-muted">#17375B</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-secondary)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Secondary</p>
                    <p className="im-text-body-xs im-text-muted">#3EBBB7</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-tertiary)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Tertiary</p>
                    <p className="im-text-body-xs im-text-muted">#A05377</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-accent)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Accent</p>
                    <p className="im-text-body-xs im-text-muted">#B87333</p>
                  </div>
                </div>
              </div>

              {/* Text Colors */}
              <div>
                <h3 className="im-heading-4 mb-4">Text Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-text-primary)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Text Primary</p>
                    <p className="im-text-body-xs im-text-muted">#0D1E32</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-text-secondary)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Text Secondary</p>
                    <p className="im-text-body-xs im-text-muted">#3E4758</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-text-light)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Text Light</p>
                    <p className="im-text-body-xs im-text-muted">#5F6C80</p>
                  </div>
                </div>
              </div>

              {/* Color Variants */}
              <div>
                <h3 className="im-heading-4 mb-4">Color Variants</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-teal-hover)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Teal Hover</p>
                    <p className="im-text-body-xs im-text-muted">#28A49A</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-navy-hover)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Navy Hover</p>
                    <p className="im-text-body-xs im-text-muted">#102741</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-navy-outline-hover)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Navy Outline Hover</p>
                    <p className="im-text-body-xs im-text-muted">#B7C1CC</p>
                  </div>
                </div>
              </div>

              {/* Special Colors */}
              <div>
                <h3 className="im-heading-4 mb-4">Special Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-gold)] rounded-lg mb-2"></div>
                    <p className="im-text-body-sm im-text-label">Gold (Stars)</p>
                    <p className="im-text-body-xs im-text-muted">#FFD700</p>
                  </div>
                  <div>
                    <div className="h-16 w-full bg-[var(--im-color-gold-light)] rounded-lg mb-2 border border-[var(--im-color-primary)]"></div>
                    <p className="im-text-body-sm im-text-label">Gold Light</p>
                    <p className="im-text-body-xs im-text-muted">#FFF9E5</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Separator */}
        <Card id="separator" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Separator Component</CardTitle>
            <CardDescription>Component: <code className="bg-muted px-2 py-1 rounded">Separator</code></CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>Content above</div>
            <Separator />
            <div>Content below</div>
          </CardContent>
        </Card>

        {/* Navigation Components */}
        <Card id="navigation" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Navigation Components</CardTitle>
            <CardDescription>Navigation components used throughout the application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="im-text-body-sm im-text-muted mb-6">Component: <code className="bg-muted px-2 py-1 rounded">Navigation</code></p>

            {/* TopNav Component */}
            <div>
              <h3 className="im-heading-4 mb-4">TopNav Component</h3>
              <p className="im-text-body-xs im-text-muted mb-4">Component: <code className="bg-muted px-2 py-1 rounded">TopNav</code></p>
              <div className="space-y-4">
                {/* Desktop View */}
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Desktop View</p>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="relative flex h-[80px] items-center bg-white px-6">
                      <div className="flex w-full items-center justify-between gap-6">
                        <div className="text-[#17375B] font-bold text-xl">Istanbul Medic Connect</div>
                        <nav className="flex items-center gap-1">
                          <a href="#" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#0D1E32]">How It Works</a>
                          <a href="#" className="rounded-full px-4 py-2 text-sm scale-105 font-extrabold text-[#0D1E32]">Treatments</a>
                          <a href="#" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-[#0D1E32]">Clinics</a>
                        </nav>
                        <div className="flex items-center gap-4">
                          <Button variant="teal-primary">Book Consultation</Button>
                          <Button variant="leila-link">Talk to Leila</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile View */}
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Mobile View</p>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <div className="relative flex h-[80px] items-center bg-white px-6">
                      <div className="flex w-full items-center justify-between gap-6">
                        <div className="text-[#17375B] font-bold text-lg">Istanbul Medic Connect</div>
                        <div className="flex items-center gap-3 md:hidden">
                          <Button variant="ghost" size="icon">
                            <Menu className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <p className="im-text-body-xs im-text-muted mt-4">
                  Note: TopNav includes &quot;Book Consultation&quot; as the primary CTA button (teal-primary variant) 
                  and &quot;Talk to Leila&quot; as a secondary link button. Both are visible on desktop view.
                </p>
              </div>
            </div>

            {/* SectionNav Component */}
            <div>
              <h3 className="im-heading-4 mb-4">SectionNav Component</h3>
              <p className="im-text-body-xs im-text-muted mb-4">Component: <code className="bg-muted px-2 py-1 rounded">SectionNav</code></p>
              <div className="border rounded-lg overflow-hidden bg-background">
                <div className="sticky top-0 z-40 bg-background border-b border-border/60">
                  <div className="max-w-7xl mx-auto px-4">
                    <nav className="flex gap-1 overflow-x-auto">
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-[#3EBBB7] text-[#3EBBB7]">
                        Overview
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        Doctors
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        Community
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        Safety
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        AI Insights
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        Reviews
                      </button>
                      <button className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 border-transparent text-muted-foreground hover:text-foreground">
                        Location
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Section */}
        <Card id="typography" className="scroll-mt-24">
          <CardHeader>
            <CardTitle>Typography System</CardTitle>
            <CardDescription>Complete typography system with utility classes and components</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <p className="text-sm text-muted-foreground mb-6">Component: <code className="bg-muted px-2 py-1 rounded">Typography Utilities & Components</code></p>

            {/* Font Families */}
            <div>
              <h3 className="im-heading-4 mb-4">Font Families</h3>
              <div className="space-y-4">
                <div>
                  <p className="im-text-body-sm im-text-muted mb-2">Heading Font (Merriweather)</p>
                  <h1 className="im-heading-1">Merriweather Heading</h1>
                  <p className="im-text-body-xs im-text-muted mt-1">Weights: 300, 400, 700</p>
                </div>
                <div>
                  <p className="im-text-body-sm im-text-muted mb-2">Body Font (Poppins)</p>
                  <p className="im-text-body">
                    Poppins Body Text - Used for all body content, buttons, and UI elements
                  </p>
                  <p className="im-text-body-xs im-text-muted mt-1">Weights: 300, 400, 500, 600, 700</p>
                </div>
                <div>
                  <p className="im-text-body-sm im-text-muted mb-2">Script Font (Dancing Script)</p>
                  <p style={{ fontFamily: "var(--im-font-script), cursive" }} className="text-2xl text-[#3EBBB7] font-bold">
                    Connect
                  </p>
                  <p className="im-text-body-xs im-text-muted mt-1">Weights: 400, 500, 600, 700 - Used for &quot;Connect&quot; in logo</p>
                </div>
              </div>
            </div>

            {/* Heading Utilities */}
            <div>
              <h3 className="im-heading-4 mb-4">Heading Utility Classes</h3>
              <p className="im-text-body-sm im-text-muted mb-4">Use utility classes: <code className="bg-muted px-2 py-1 rounded">im-heading-1</code> through <code className="bg-muted px-2 py-1 rounded">im-heading-6</code></p>
              <div className="space-y-4">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-display</code></p>
                  <h1 className="im-heading-display text-foreground">Display Heading</h1>
                  <p className="im-text-body-xs im-text-muted mt-1">For hero sections and large page titles</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-1</code></p>
                  <h1 className="im-heading-1 text-foreground">H1 Heading</h1>
                  <p className="im-text-body-xs im-text-muted mt-1">Main page headings - Responsive: 30px mobile → 36px desktop</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-2</code></p>
                  <h2 className="im-heading-2 text-foreground">H2 Heading</h2>
                  <p className="im-text-body-xs im-text-muted mt-1">Section headings - Responsive: 24px mobile → 30px desktop</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-3</code></p>
                  <h3 className="im-heading-3 text-foreground">H3 Heading</h3>
                  <p className="im-text-body-xs im-text-muted mt-1">Subsection headings - 24px, uses Merriweather</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-4</code></p>
                  <h4 className="im-heading-4 text-foreground">H4 Heading</h4>
                  <p className="im-text-body-xs im-text-muted mt-1">Small section headings - 20px, uses Merriweather</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-5</code></p>
                  <h5 className="im-heading-5 text-foreground">H5 Heading</h5>
                  <p className="im-text-body-xs im-text-muted mt-1">18px, uses Poppins body font</p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-heading-6</code></p>
                  <h6 className="im-heading-6 text-foreground">H6 Heading</h6>
                  <p className="im-text-body-xs im-text-muted mt-1">16px, uses Poppins body font</p>
                </div>
              </div>
            </div>

            {/* Typography Components */}
            <div>
              <h3 className="im-heading-4 mb-4">Typography Components</h3>
              <p className="im-text-body-sm im-text-muted mb-4">Use <code className="bg-muted px-2 py-1 rounded">&lt;Heading&gt;</code> and <code className="bg-muted px-2 py-1 rounded">&lt;Text&gt;</code> components for type-safe typography</p>
              <div className="space-y-4">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-2">Component Usage:</p>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <Heading variant="h1">Clinic Name</Heading>
                    <Text variant="body" muted className="mt-2">
                      This is body text using the Text component
                    </Text>
                  </div>
                </div>
              </div>
            </div>

            {/* Body Text Utilities */}
            <div>
              <h3 className="im-heading-4 mb-4">Body Text Utility Classes</h3>
              <div className="space-y-3">
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-body-lg</code></p>
                  <p className="im-text-body-lg text-foreground">
                    Large body text (18px) - Used for emphasized content and larger paragraphs
                  </p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-body</code></p>
                  <p className="im-text-body text-foreground">
                    Base body text (16px) - Default body text size for paragraphs and content
                  </p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-body-sm</code></p>
                  <p className="im-text-body-sm text-foreground">
                    Small body text (14px) - Used for descriptions, captions, and secondary content
                  </p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-body-xs</code></p>
                  <p className="im-text-body-xs text-foreground">
                    Extra small text (12px) - Used for badges, labels, and fine print
                  </p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-label</code></p>
                  <p className="im-text-label text-foreground">
                    Label text (14px, medium weight) - Used for form labels and field names
                  </p>
                </div>
                <div>
                  <p className="im-text-body-xs im-text-muted mb-1">Class: <code className="bg-muted px-2 py-1 rounded">im-text-caption</code></p>
                  <p className="im-text-caption">
                    Caption text (12px, muted) - Used for image captions and helper text
                  </p>
                </div>
              </div>
            </div>

            {/* Text Variants */}
            <div>
              <h3 className="im-heading-4 mb-4">Text Variants</h3>
              <div className="space-y-2">
                <p className="im-text-body im-text-muted">Muted text - <code className="bg-muted px-2 py-1 rounded">im-text-muted</code></p>
                <p className="im-text-body im-text-emphasis">Emphasized text - <code className="bg-muted px-2 py-1 rounded">im-text-emphasis</code></p>
              </div>
            </div>

            {/* Font Weights */}
            <div>
              <h3 className="im-heading-4 mb-4">Font Weights</h3>
              <div className="space-y-2">
                <p className="im-text-body font-light">Light (300)</p>
                <p className="im-text-body font-normal">Normal (400)</p>
                <p className="im-text-body font-medium">Medium (500)</p>
                <p className="im-text-body font-semibold">Semibold (600)</p>
                <p className="im-text-body font-bold">Bold (700)</p>
                <p className="im-text-body font-extrabold">Extrabold (800/900)</p>
              </div>
            </div>

            {/* Text Colors */}
            <div>
              <h3 className="im-heading-4 mb-4">Text Colors</h3>
              <div className="space-y-2">
                <p className="im-text-body text-foreground">Foreground - Primary text color</p>
                <p className="im-text-body text-muted-foreground">Muted Foreground - Secondary text color</p>
                <p className="im-text-body text-[var(--im-color-primary)]">Primary (#17375B) - Navy brand color</p>
                <p className="im-text-body text-[var(--im-color-secondary)]">Secondary (#3EBBB7) - Teal brand accent</p>
                <p className="im-text-body text-[var(--im-color-tertiary)]">Tertiary (#A05377) - Rose/mauve</p>
                <p className="im-text-body text-[var(--im-color-accent)]">Accent (#B87333) - Bronze/copper</p>
                <p className="im-text-body text-[var(--im-color-text-primary)]">Text Primary (#0D1E32) - Main text color</p>
                <p className="im-text-body text-[var(--im-color-text-secondary)]">Text Secondary (#3E4758) - Secondary text</p>
                <p className="im-text-body text-[var(--im-color-text-light)]">Text Light (#5F6C80) - Light text</p>
                <p className="im-text-body text-[var(--im-color-gold)]">Gold (#FFD700) - Star ratings only</p>
              </div>
            </div>

            {/* Example Usage */}
            <div>
              <h3 className="im-heading-4 mb-4">Example Usage</h3>
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-lg">
                  <Heading variant="h1" className="mb-2">Clinic Profile Page</Heading>
                  <Text variant="body" muted className="mb-4">
                    This demonstrates how headings and body text work together using the typography system.
                  </Text>
                  <div className="flex items-center gap-1 im-text-body-sm font-semibold">
                    <Star className="h-3 w-3 fill-[#FFD700] text-[#FFD700]" />
                    <span>4.85 · 127 reviews</span>
                  </div>
                </div>
                <div className="bg-muted/30 p-6 rounded-lg">
                  <Heading variant="h2" className="mb-3">Section Title</Heading>
                  <Text variant="body-lg" className="mb-2">
                    Large body text for important content.
                  </Text>
                  <Text variant="body" muted>
                    Regular body text for standard paragraphs and descriptions.
                  </Text>
                  <Text variant="caption" className="mt-2 block">
                    Caption text for additional context or fine print.
                  </Text>
                </div>
              </div>
            </div>

            {/* Usage Guidelines */}
            <div>
              <h3 className="im-heading-4 mb-4">Usage Guidelines</h3>
              <div className="space-y-3 im-text-body-sm">
                <div>
                  <p className="font-semibold mb-1">When to use Heading Font (Merriweather):</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li>H1, H2, H3, H4 headings</li>
                    <li>Display/hero headings</li>
                    <li>Page titles and major section headings</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">When to use Body Font (Poppins):</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li>All body text, paragraphs, and content</li>
                    <li>H5, H6 headings (smaller headings)</li>
                    <li>Buttons, labels, and UI elements</li>
                    <li>Navigation and interface text</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-1">Accessibility:</p>
                  <ul className="list-disc list-inside space-y-1 im-text-muted ml-2">
                    <li>Minimum font size: 12px (xs) for body text</li>
                    <li>Ensure proper heading hierarchy (h1 → h2 → h3)</li>
                    <li>Maintain sufficient contrast ratios (WCAG AA: 4.5:1 for normal text)</li>
                    <li>Use semantic HTML headings for screen readers</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </main>
      </div>
    </div>
  )
}
