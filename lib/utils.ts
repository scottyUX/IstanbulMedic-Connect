import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs))
}

/** Format ISO date string for display (e.g. "Feb 3, 2026") */
export const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return iso
  }
}

/** Format number with commas; return "—" if undefined */
export const formatNumber = (n?: number): string => {
  if (n === undefined || n === null) return "—"
  return n.toLocaleString()
}

/** Format YYYY-MM date to "Jan '25" style for charts */
export const formatChartMonth = (month: string): string => {
  const m = month.match(/(\d{4})-(\d{2})/)
  if (m) {
    const [, year, mon] = m
    const shortYear = year.length === 4 ? `'${year.slice(2)}` : year
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return `${names[parseInt(mon, 10) - 1]} ${shortYear}`
  }
  return month
}

/** Format YYYY-MM date to short month name ("Jan") for charts */
export const formatChartMonthShort = (month: string): string => {
  const m = month.match(/(\d{4})-(\d{2})/)
  if (m) {
    const names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    return names[parseInt(m[2], 10) - 1]
  }
  return month
}

/** Truncate string with ellipsis */
export const truncate = (s?: string, len = 20): string => {
  if (!s) return "—"
  if (s.length <= len) return s
  return `${s.slice(0, len)}…`
}

/** Extract short display string from URL (domain or path) */
export const prettyUrl = (url: string): string => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "")
    if (host === "linktr.ee" && u.pathname.length > 1) {
      return `linktr.ee${u.pathname}`
    }
    return host
  } catch {
    return url.length > 30 ? `${url.slice(0, 27)}…` : url
  }
}

/** Known link aggregator hosts */
const LINK_AGGREGATOR_HOSTS = [
  "linktr.ee",
  "bit.ly",
  "tinyurl.com",
  "short.link",
  "bio.link",
  "lnk.bio",
]

/** Check if URL points to a link aggregator (linktr.ee, bit.ly, etc.) */
export const isLinkAggregator = (url: string): boolean => {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, "").toLowerCase()
    return LINK_AGGREGATOR_HOSTS.some((h) => host === h || host.endsWith(`.${h}`))
  } catch {
    return false
  }
}

/** Target market tokens (region/continent/country as marketing target) */
const TARGET_MARKET_TOKENS = [
  "europe",
  "worldwide",
  "uk",
  "germany",
  "usa",
  "america",
  "international",
  "global",
  "middle east",
  "gulf",
  "uae",
  "dubai",
]

/** Classify geography token as location, target market, or fallback */
export const classifyGeographyToken = (
  token: string
): "location" | "targetMarket" | "mentions" => {
  const lower = token.trim().toLowerCase()
  if (!lower) return "mentions"
  if (TARGET_MARKET_TOKENS.includes(lower)) return "targetMarket"
  return "location"
}

/** Check if any websiteCandidate is a direct clinic domain (not aggregator) */
export const hasDirectDomain = (websiteCandidates?: string[]): boolean => {
  if (!websiteCandidates?.length) return false
  return websiteCandidates.some((url) => !isLinkAggregator(url))
}
