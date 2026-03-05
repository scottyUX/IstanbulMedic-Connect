/**
 * Clinic Ratings Aggregation
 *
 * Aggregates ratings and review counts across multiple sources.
 * Currently supports Google; designed to easily add Trustpilot, WhatClinic, etc.
 *
 * Data sources are stored in clinic_facts table with fact_keys like:
 * - google_rating, google_review_count
 * - (future) trustpilot_rating, trustpilot_review_count
 * - (future) whatclinic_rating, whatclinic_review_count
 */

import type { Json } from '@/lib/supabase/database.types';

export interface RatingSource {
  source: string;
  rating: number | null;
  reviewCount: number;
}

export interface RatingAggregate {
  /** Weighted average rating across all sources (null if no ratings) */
  rating: number | null;
  /** Total review count across all sources */
  reviewCount: number;
  /** Breakdown by source for transparency */
  sources: RatingSource[];
}

interface ClinicFact {
  fact_key: string;
  fact_value: Json;
}

/**
 * Known rating sources and their fact_key prefixes.
 * Add new sources here as they become available.
 */
const RATING_SOURCES = [
  { name: 'google', ratingKey: 'google_rating', countKey: 'google_review_count' },
  // Future sources:
  // { name: 'trustpilot', ratingKey: 'trustpilot_rating', countKey: 'trustpilot_review_count' },
  // { name: 'whatclinic', ratingKey: 'whatclinic_rating', countKey: 'whatclinic_review_count' },
] as const;

/**
 * Parses a fact value to a number.
 * Handles string numbers, actual numbers, null/undefined, and { value: X } objects.
 */
function parseFactNumber(value: Json): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  // Handle { "value": X } format from clinic_facts
  if (typeof value === 'object' && value !== null && 'value' in value) {
    const inner = (value as { value: unknown }).value;
    if (typeof inner === 'number') return inner;
    if (typeof inner === 'string') {
      const parsed = parseFloat(inner);
      return Number.isNaN(parsed) ? null : parsed;
    }
  }
  return null;
}

/**
 * Aggregates clinic ratings from multiple sources.
 *
 * Strategy:
 * - Weighted average by review count (sources with more reviews have more weight)
 * - Sources without ratings are excluded from the average
 * - Total review count is the sum across all sources
 *
 * @param facts - Array of clinic_facts rows for a single clinic
 * @returns Aggregated rating data
 */
export function aggregateClinicRatings(facts: ClinicFact[]): RatingAggregate {
  const factMap = new Map<string, Json>();
  for (const fact of facts) {
    factMap.set(fact.fact_key, fact.fact_value);
  }

  const sources: RatingSource[] = [];
  let totalWeightedRating = 0;
  let totalReviewCount = 0;

  for (const source of RATING_SOURCES) {
    const rating = parseFactNumber(factMap.get(source.ratingKey) ?? null);
    const reviewCount = parseFactNumber(factMap.get(source.countKey) ?? null) ?? 0;

    sources.push({
      source: source.name,
      rating,
      reviewCount: Math.round(reviewCount),
    });

    // Only include in weighted average if we have both rating and reviews
    if (rating !== null && reviewCount > 0) {
      totalWeightedRating += rating * reviewCount;
      totalReviewCount += reviewCount;
    }
  }

  // Compute weighted average
  const aggregateRating = totalReviewCount > 0
    ? Math.round((totalWeightedRating / totalReviewCount) * 10) / 10 // Round to 1 decimal
    : null;

  return {
    rating: aggregateRating,
    reviewCount: totalReviewCount,
    sources,
  };
}

/**
 * Simple helper to get just Google rating data.
 * Use this when you only need Google and don't need the full aggregation.
 */
export function getGoogleRating(facts: ClinicFact[]): { rating: number | null; reviewCount: number } {
  const ratingFact = facts.find(f => f.fact_key === 'google_rating');
  const countFact = facts.find(f => f.fact_key === 'google_review_count');

  return {
    rating: parseFactNumber(ratingFact?.fact_value ?? null),
    reviewCount: Math.round(parseFactNumber(countFact?.fact_value ?? null) ?? 0),
  };
}
