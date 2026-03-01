import type { ClinicDetail } from '@/lib/api/clinics';

// Opening hours types
export interface DayHours {
  open: string;
  close: string;
}

// Legacy format
export interface OpeningHoursJsonLegacy {
  monday?: DayHours | null;
  tuesday?: DayHours | null;
  wednesday?: DayHours | null;
  thursday?: DayHours | null;
  friday?: DayHours | null;
  saturday?: DayHours | null;
  sunday?: DayHours | null;
}

// Google Places API format (from clinic_facts)
export interface OpeningHoursGoogleFormat {
  periods?: Array<{
    open: { day: number; time: string };
    close: { day: number; time: string };
  }>;
  open_now?: boolean;
  weekday_text?: string[];
}

export type OpeningHoursJson = OpeningHoursJsonLegacy | OpeningHoursGoogleFormat;

export interface OpeningHoursDisplay {
  day: string;
  hours: string;
}

export interface DerivedServices {
  accommodation: boolean;
  airportTransfer: boolean;
}

/**
 * Convert a value to a number, returning null if not possible
 */
export const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return null;
    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

/**
 * Format 24h time string to 12h format
 * @example formatTime("09:00") → "9:00 AM"
 * @example formatTime("14:30") → "2:30 PM"
 */
export const formatTime = (time: string): string => {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr, 10);
  if (isNaN(hour)) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
};

/**
 * Transform JSONB opening hours to display format, grouping consecutive days with same hours
 * Handles both legacy format and Google Places API format (from clinic_facts)
 */
export const transformOpeningHours = (
  jsonHours: OpeningHoursJson | null
): OpeningHoursDisplay[] => {
  if (!jsonHours) return [];

  // Check if it's Google Places API format (has weekday_text)
  if ('weekday_text' in jsonHours && Array.isArray(jsonHours.weekday_text)) {
    return jsonHours.weekday_text.map((text) => {
      // Format: "Monday: Open 24 hours" or "Monday: 9:00 AM – 6:00 PM"
      const colonIndex = text.indexOf(':');
      if (colonIndex === -1) return { day: text, hours: '' };
      const day = text.substring(0, colonIndex).trim();
      const hours = text.substring(colonIndex + 1).trim();
      return { day, hours };
    });
  }

  // Legacy format handling
  const legacyHours = jsonHours as OpeningHoursJsonLegacy;

  const dayOrder = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ] as const;

  const dayLabels: Record<string, string> = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
  };

  const entries: OpeningHoursDisplay[] = [];

  for (const dayKey of dayOrder) {
    const dayData = legacyHours[dayKey];
    if (dayData && dayData.open && dayData.close) {
      const hoursStr = `${formatTime(dayData.open)} - ${formatTime(dayData.close)}`;
      entries.push({ day: dayLabels[dayKey], hours: hoursStr });
    } else {
      entries.push({ day: dayLabels[dayKey], hours: 'Closed' });
    }
  }

  // Group consecutive days with same hours
  const grouped: OpeningHoursDisplay[] = [];
  let i = 0;
  while (i < entries.length) {
    const start = entries[i];
    let j = i + 1;
    while (j < entries.length && entries[j].hours === start.hours) {
      j++;
    }
    if (j - i > 1) {
      // Group consecutive days
      grouped.push({
        day: `${start.day} - ${entries[j - 1].day}`,
        hours: start.hours,
      });
    } else {
      grouped.push(start);
    }
    i = j;
  }

  return grouped;
};

/**
 * Derive accommodation and airport transfer services from package data
 * Returns null if no packages exist (unknown services)
 */
export const deriveServicesFromPackages = (
  packages: ClinicDetail['packages']
): DerivedServices | null => {
  if (packages.length === 0) return null;
  return {
    accommodation: packages.some(
      (p) => p.nights_included != null && p.nights_included > 0
    ),
    airportTransfer: packages.some((p) => p.transport_included === true),
  };
};

/**
 * Derive community tags from positive mentions
 */
export const deriveCommunityTags = (
  mentions: ClinicDetail['mentions']
): string[] => {
  const topicLabels: Record<string, string> = {
    pricing: 'Good pricing',
    results: 'Great results',
    staff: 'Professional staff',
    logistics: 'Smooth logistics',
    praise: 'Highly recommended',
  };

  const positiveMentions = mentions.filter((m) => m.sentiment === 'positive');
  const topics = positiveMentions
    .map((m) => topicLabels[m.topic])
    .filter((v): v is string => v !== undefined)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 4);

  return topics;
};

/**
 * Check if a clinic qualifies for "Patient Favorite" badge
 */
export const isPatientFavorite = (
  rating: number | null,
  reviewCount: number
): boolean => {
  return rating !== null && rating >= 4.5 && reviewCount >= 5;
};
