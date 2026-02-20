import { describe, it, expect } from 'vitest';
import {
  toNumber,
  formatTime,
  transformOpeningHours,
  deriveServicesFromPackages,
  deriveCommunityTags,
  isPatientFavorite,
  type OpeningHoursJson,
} from '@/lib/transformers/clinic';
import type { ClinicDetail } from '@/lib/api/clinics';

type TestPackages = ClinicDetail['packages'];
type TestMentions = ClinicDetail['mentions'];

describe('toNumber', () => {
  it('returns number as-is', () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(-5)).toBe(-5);
    expect(toNumber(3.14)).toBe(3.14);
  });

  it('parses numeric strings', () => {
    expect(toNumber('42')).toBe(42);
    expect(toNumber('3.14')).toBe(3.14);
    expect(toNumber('0')).toBe(0);
    expect(toNumber('-10')).toBe(-10);
  });

  it('returns null for non-numeric values', () => {
    expect(toNumber('hello')).toBeNull();
    expect(toNumber('')).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber({})).toBeNull();
    expect(toNumber([])).toBeNull();
    expect(toNumber(NaN)).toBeNull();
  });
});

describe('formatTime', () => {
  it('converts 24h to 12h AM format', () => {
    expect(formatTime('09:00')).toBe('9:00 AM');
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('01:30')).toBe('1:30 AM');
    expect(formatTime('11:59')).toBe('11:59 AM');
  });

  it('converts 24h to 12h PM format', () => {
    expect(formatTime('12:00')).toBe('12:00 PM');
    expect(formatTime('13:00')).toBe('1:00 PM');
    expect(formatTime('18:30')).toBe('6:30 PM');
    expect(formatTime('23:59')).toBe('11:59 PM');
  });

  it('returns original string if invalid', () => {
    expect(formatTime('invalid')).toBe('invalid');
    expect(formatTime('')).toBe('');
  });
});

describe('transformOpeningHours', () => {
  it('returns empty array for null input', () => {
    expect(transformOpeningHours(null)).toEqual([]);
  });

  it('transforms single day hours', () => {
    const input: OpeningHoursJson = {
      monday: { open: '09:00', close: '17:00' },
    };
    const result = transformOpeningHours(input);

    expect(result).toContainEqual({
      day: 'Monday',
      hours: '9:00 AM - 5:00 PM',
    });
  });

  it('marks days without hours as Closed', () => {
    const input: OpeningHoursJson = {
      monday: { open: '09:00', close: '17:00' },
      tuesday: null,
      sunday: null,
    };
    const result = transformOpeningHours(input);

    const sunday = result.find((r) => r.day.includes('Sunday'));
    expect(sunday?.hours).toBe('Closed');
  });

  it('groups consecutive days with same hours', () => {
    const input: OpeningHoursJson = {
      monday: { open: '09:00', close: '18:00' },
      tuesday: { open: '09:00', close: '18:00' },
      wednesday: { open: '09:00', close: '18:00' },
      thursday: { open: '09:00', close: '18:00' },
      friday: { open: '09:00', close: '18:00' },
      saturday: { open: '10:00', close: '14:00' },
      sunday: null,
    };
    const result = transformOpeningHours(input);

    // Should group Mon-Fri
    expect(result).toContainEqual({
      day: 'Monday - Friday',
      hours: '9:00 AM - 6:00 PM',
    });

    // Saturday should be separate
    expect(result).toContainEqual({
      day: 'Saturday',
      hours: '10:00 AM - 2:00 PM',
    });

    // Sunday should be closed
    expect(result).toContainEqual({
      day: 'Sunday',
      hours: 'Closed',
    });
  });

  it('does not group non-consecutive days with same hours', () => {
    const input: OpeningHoursJson = {
      monday: { open: '09:00', close: '17:00' },
      tuesday: { open: '10:00', close: '16:00' }, // different
      wednesday: { open: '09:00', close: '17:00' }, // same as Monday but not consecutive
    };
    const result = transformOpeningHours(input);

    // Monday should not be grouped with Wednesday
    expect(result.find((r) => r.day === 'Monday')).toBeDefined();
    expect(result.find((r) => r.day === 'Wednesday')).toBeDefined();
  });
});

describe('deriveServicesFromPackages', () => {
  it('returns null for empty packages', () => {
    expect(deriveServicesFromPackages([])).toBeNull();
  });

  it('detects accommodation from nights_included', () => {
    const packages = [
      { nights_included: 3, transport_included: false },
    ] as unknown as TestPackages;

    const result = deriveServicesFromPackages(packages);
    expect(result?.accommodation).toBe(true);
    expect(result?.airportTransfer).toBe(false);
  });

  it('detects airport transfer from transport_included', () => {
    const packages = [
      { nights_included: 0, transport_included: true },
    ] as unknown as TestPackages;

    const result = deriveServicesFromPackages(packages);
    expect(result?.accommodation).toBe(false);
    expect(result?.airportTransfer).toBe(true);
  });

  it('detects both services when present', () => {
    const packages = [
      { nights_included: 2, transport_included: true },
    ] as unknown as TestPackages;

    const result = deriveServicesFromPackages(packages);
    expect(result?.accommodation).toBe(true);
    expect(result?.airportTransfer).toBe(true);
  });

  it('returns false for both when no services in packages', () => {
    const packages = [
      { nights_included: 0, transport_included: false },
      { nights_included: null, transport_included: null },
    ] as unknown as TestPackages;

    const result = deriveServicesFromPackages(packages);
    expect(result?.accommodation).toBe(false);
    expect(result?.airportTransfer).toBe(false);
  });
});

describe('deriveCommunityTags', () => {
  it('returns empty array for no mentions', () => {
    expect(deriveCommunityTags([])).toEqual([]);
  });

  it('returns empty array for only negative/neutral mentions', () => {
    const mentions = [
      { sentiment: 'negative', topic: 'pricing' },
      { sentiment: 'neutral', topic: 'staff' },
    ] as unknown as TestMentions;

    expect(deriveCommunityTags(mentions)).toEqual([]);
  });

  it('extracts tags from positive mentions', () => {
    const mentions = [
      { sentiment: 'positive', topic: 'pricing' },
      { sentiment: 'positive', topic: 'staff' },
    ] as unknown as TestMentions;

    const result = deriveCommunityTags(mentions);
    expect(result).toContain('Good pricing');
    expect(result).toContain('Professional staff');
  });

  it('deduplicates tags', () => {
    const mentions = [
      { sentiment: 'positive', topic: 'pricing' },
      { sentiment: 'positive', topic: 'pricing' },
      { sentiment: 'positive', topic: 'pricing' },
    ] as unknown as TestMentions;

    const result = deriveCommunityTags(mentions);
    expect(result).toEqual(['Good pricing']);
  });

  it('limits to 4 tags', () => {
    const mentions = [
      { sentiment: 'positive', topic: 'pricing' },
      { sentiment: 'positive', topic: 'results' },
      { sentiment: 'positive', topic: 'staff' },
      { sentiment: 'positive', topic: 'logistics' },
      { sentiment: 'positive', topic: 'praise' },
    ] as unknown as TestMentions;

    const result = deriveCommunityTags(mentions);
    expect(result.length).toBe(4);
  });

  it('ignores unknown topics', () => {
    const mentions = [
      { sentiment: 'positive', topic: 'unknown_topic' },
      { sentiment: 'positive', topic: 'pricing' },
    ] as unknown as TestMentions;

    const result = deriveCommunityTags(mentions);
    expect(result).toEqual(['Good pricing']);
  });
});

describe('isPatientFavorite', () => {
  it('returns true for high rating with enough reviews', () => {
    expect(isPatientFavorite(4.5, 5)).toBe(true);
    expect(isPatientFavorite(4.8, 10)).toBe(true);
    expect(isPatientFavorite(5.0, 100)).toBe(true);
  });

  it('returns false for null rating', () => {
    expect(isPatientFavorite(null, 100)).toBe(false);
  });

  it('returns false for rating below 4.5', () => {
    expect(isPatientFavorite(4.4, 100)).toBe(false);
    expect(isPatientFavorite(3.0, 100)).toBe(false);
    expect(isPatientFavorite(0, 100)).toBe(false);
  });

  it('returns false for fewer than 5 reviews', () => {
    expect(isPatientFavorite(5.0, 4)).toBe(false);
    expect(isPatientFavorite(5.0, 0)).toBe(false);
    expect(isPatientFavorite(5.0, 1)).toBe(false);
  });

  it('returns false when both criteria not met', () => {
    expect(isPatientFavorite(4.0, 3)).toBe(false);
  });
});
