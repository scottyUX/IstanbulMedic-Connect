# UI Components – Atomic Design Taxonomy

This directory contains **atoms** and **molecules** per [Atomic Design](https://atomicdesign.bradfrost.com/chapter-2/). Components are classified by abstraction level.

## Atoms

Foundational building blocks that cannot be broken down further without losing meaning.

| File | Component | Notes |
|------|-----------|-------|
| `button.tsx` | Button | Primitive control |
| `input.tsx` | Input | Form field |
| `label.tsx` | Label | Form label |
| `checkbox.tsx` | Checkbox | Toggle control |
| `slider.tsx` | Slider | Range input |
| `badge.tsx` | Badge | Status/chip display |
| `separator.tsx` | Separator | Visual divider |
| `typography.tsx` | Heading, Text | Text primitives |
| `motionPrimitives.tsx` | FadeInUp, FadeIn | Animation wrappers |
| `container.tsx` | Container | Layout primitive |
| `section.tsx` | Section | Layout primitive |
| `scroll-area.tsx` | ScrollArea | Scroll container |
| `select.tsx` | Select | Dropdown (shadcn) |
| `popover.tsx` | Popover | Overlay (shadcn) |
| `command.tsx` | Command | Command palette (shadcn) |

Icons live in `components/icons/` (RedditIcon, GoogleIcon, QuoteIcon).

## Molecules

Simple groups of atoms functioning together as a unit.

| File | Component | Composed of |
|------|-----------|-------------|
| `specialty-tag.tsx` | SpecialtyTag | Badge + variant styling |
| `stat-block.tsx` | StatBlock | Label + value layout |
| `filter-pill.tsx` | FilterPillGroup | Button group (toggle pills) |
| `range-value-display.tsx` | RangeValueDisplay | Label + formatted value |
| `PageTitle.tsx` | PageTitle | Typography + FadeInUp |
| `PageSubtitle.tsx` | PageSubtitle | Typography + FadeInUp |
| `price-rating-block.tsx` | PriceRatingBlock | Price + label + star + rating + review count |
| `fee-line-item.tsx` | FeeLineItem | Label + value (fee breakdown row) |
| `verification-badge.tsx` | VerificationBadge | Icon + verification text |
| `icon-action-link.tsx` | IconActionLink | Icon + text action button |
| `card.tsx` | Card, CardHeader, CardContent, CardFooter | Layout composition |
| `dialog.tsx` | Dialog and parts | Modal composition |
| `carousel.tsx` | Carousel | Slider + navigation |
| `chart.tsx` | ChartContainer, ChartTooltip, ChartTooltipContent | Recharts integration |
| `empty-state.tsx` | EmptyState | Placeholder for missing data |
| `platform-pill-tabs.tsx` | PlatformPillTabs | Platform-switching tabs (e.g. Instagram, TikTok) |
| `report-section.tsx` | ReportSection | Title + description + children section |
| `comparison-metric-block.tsx` | ComparisonMetricBlock | Primary vs benchmark value with bar visualization |
| `line-chart-card.tsx` | LineChartCard | Bordered card + line chart (e.g. follower growth) |
| `bar-chart-card.tsx` | BarChartCard | Bordered card + bar chart (e.g. posting activity) |

## Organisms

Organisms live outside this directory:

- **Landing:** `components/landing/` – HeroBanner, FeatureCard, LandingSection, PrecisionClinicMatching, etc.
- **Connect:** `components/istanbulmedic-connect/` – ClinicCard, FilterDialog, SummarySidebar, TopNav, profile sections (including `profile/instagram/` subcomponents for InstagramIntelligenceSection)
- **Common:** `components/common/` – Header, Logo, LanguageSelector

## Templates

Page-level structure in `components/templates/`:

- **HomeTemplate** – Defines slots for hero, matching, testimonials, journey, partners.
