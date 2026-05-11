/**
 * hrn.mock.ts
 *
 * Generates deterministic mock HRN signals for a clinic when no real thread
 * data exists. Used for local development and demos.
 *
 * The mock data is seeded from the clinic ID so each clinic gets a consistent,
 * unique-looking profile across page loads and sessions.
 */

import type { HRNSignalsData, HRNThread } from "@/components/istanbulmedic-connect/profile/HRNSignalsCard";

// ── Deterministic seeded RNG (mulberry32) ─────────────────────────────────────
// Turns a clinic UUID into a stable sequence of pseudo-random numbers so each
// clinic always gets the same mock data.

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  }
  return h >>> 0;
}

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ── Mock thread pool ──────────────────────────────────────────────────────────

const THREAD_TEMPLATES: Array<Omit<HRNThread, "threadUrl" | "postDate">> = [
  {
    title: "12 month results — very happy with density",
    summaryShort: "Patient reports strong growth at 12 months with excellent density in the recipient area. Highly recommends the clinic.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 18,
    hasLongTermFollowup: true,
  },
  {
    title: "6 month update — healing well, growth starting",
    summaryShort: "Early update at 6 months showing good early growth. Patient notes some ongoing shedding but is reassured by progress.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 9,
    hasLongTermFollowup: false,
  },
  {
    title: "FUE 2800 grafts — 8 month diary with photos",
    summaryShort: "Detailed photo diary from day 1 to 8 months. Patient satisfied with hairline design and technician quality.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 34,
    hasLongTermFollowup: false,
  },
  {
    title: "Mixed results — density good but crown still thin",
    summaryShort: "Overall positive experience but patient notes crown area did not fill in as expected at 14 months. Considering second session.",
    sentimentLabel: "mixed",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 11,
    hasLongTermFollowup: true,
  },
  {
    title: "1 year post-op — exceeded my expectations",
    summaryShort: "Patient reports natural-looking results at 1 year. Highlights good communication with the clinic throughout the process.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: false,
    photoCount: 0,
    hasLongTermFollowup: true,
  },
  {
    title: "Repair procedure after poor result elsewhere",
    summaryShort: "Patient sought repair after unsatisfactory result at a different clinic. Documents correction procedure and early recovery at 3 months.",
    sentimentLabel: "mixed",
    isRepairCase: true,
    hasPhotos: true,
    photoCount: 7,
    hasLongTermFollowup: false,
  },
  {
    title: "10 month update — shedding phase over",
    summaryShort: "Patient describes anxiety during shock loss phase but notes strong regrowth by month 10. Sentiment has shifted very positive.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 6,
    hasLongTermFollowup: false,
  },
  {
    title: "Negative review — communication issues post-op",
    summaryShort: "Patient disappointed with post-operative support. Results at 9 months described as below expectations for the graft count.",
    sentimentLabel: "negative",
    isRepairCase: false,
    hasPhotos: false,
    photoCount: 0,
    hasLongTermFollowup: false,
  },
  {
    title: "3500 FUE grafts — 2 year follow-up",
    summaryShort: "Long-term 2 year update confirming lasting density. Patient notes minimal donor area thinning and very natural hairline.",
    sentimentLabel: "positive",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 22,
    hasLongTermFollowup: true,
  },
  {
    title: "Honest review — good results, slow communication",
    summaryShort: "Mixed experience: happy with the final result at 11 months but frustrated by slow responses to follow-up questions during recovery.",
    sentimentLabel: "mixed",
    isRepairCase: false,
    hasPhotos: true,
    photoCount: 5,
    hasLongTermFollowup: false,
  },
];

const TOPIC_POOLS = [
  ["density", "healing", "hairline"],
  ["density", "natural_results", "communication"],
  ["healing", "donor_area", "growth_timeline"],
  ["hairline", "density", "doctor_involvement"],
  ["communication", "value", "healing"],
  ["density", "aftercare", "natural_results"],
  ["scar", "donor_area", "healing"],
];

const POST_DATES = [
  "2026-03-15T00:00:00Z",
  "2026-02-28T00:00:00Z",
  "2026-01-20T00:00:00Z",
  "2025-12-10T00:00:00Z",
  "2025-11-05T00:00:00Z",
  "2025-10-18T00:00:00Z",
  "2025-09-22T00:00:00Z",
  "2025-08-30T00:00:00Z",
  "2025-07-14T00:00:00Z",
  "2025-06-01T00:00:00Z",
];

const THREAD_URL_BASE = "https://www.hairrestorationnetwork.com/topic/";

// ── Generator ─────────────────────────────────────────────────────────────────

export function getMockHRNSignals(
  clinicId: string,
  clinicName: string
): HRNSignalsData {
  const rng = makeRng(hashSeed(clinicId));

  // Total threads: 8–22
  const totalThreads = 8 + Math.floor(rng() * 15);

  // Pick threads deterministically
  const allThreads: HRNThread[] = [];
  for (let i = 0; i < totalThreads; i++) {
    const template = THREAD_TEMPLATES[Math.floor(rng() * THREAD_TEMPLATES.length)];
    const urlSlug = Math.floor(10000 + rng() * 55000);
    allThreads.push({
      ...template,
      threadUrl: `${THREAD_URL_BASE}${urlSlug}-mock-thread-${i}/`,
      postDate: POST_DATES[i % POST_DATES.length],
    });
  }

  // Aggregate
  const sentiment = { positive: 0, mixed: 0, negative: 0 };
  for (const t of allThreads) sentiment[t.sentimentLabel]++;

  const photoThreadsList = allThreads.filter(t => t.hasPhotos);
  const longTermFollowups = allThreads.filter(t => t.hasLongTermFollowup).length;
  const repairCases = allThreads.filter(t => t.isRepairCase).length;

  // Topics: pick a pool deterministically
  const topTopics = TOPIC_POOLS[Math.floor(rng() * TOPIC_POOLS.length)];

  // Score: 5.5–9.2, weighted toward positive sentiment
  const sentimentTotal = sentiment.positive + sentiment.mixed + sentiment.negative;
  const positiveRatio = sentimentTotal > 0 ? sentiment.positive / sentimentTotal : 0.5;
  const baseScore = 5.5 + positiveRatio * 3.5 + (rng() - 0.5) * 0.4;
  const hrnScore = Math.round(Math.min(9.9, Math.max(5.0, baseScore)) * 10) / 10;

  return {
    clinicName,
    totalThreads,
    lastUpdated: POST_DATES[0],
    photoThreads: photoThreadsList.length,
    longTermFollowups,
    repairCases,
    sentiment,
    topTopics,
    photoThreadsList,
    allThreads,
    hrnScore,
  };
}
