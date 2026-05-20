import { describe, it, expect } from "vitest";
import {
  buildEntityRegex,
  matchesKnownEntity,
  type KnownEntity,
} from "@/app/api/hrnPipeline/hrnStoragePipeline";

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const SAMPLE_ENTITIES: KnownEntity[] = [
  { name: "AEK Hair Clinic", source: "clinic" },
  { name: "Smile Hair Clinic", source: "clinic" },
  { name: "Cosmedica", source: "clinic" },
  { name: "Dr. Ali Emre Karadeniz", source: "doctor" },
  { name: "Dr. Koray Erdogan", source: "doctor" },
  { name: "Dr. Bloxham", source: "doctor" },
];

// ─────────────────────────────────────────────────────────────────────────────
// buildEntityRegex
// ─────────────────────────────────────────────────────────────────────────────

describe("buildEntityRegex", () => {
  it("matches full clinic name", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    expect(regex.test("AEK Hair Clinic")).toBe(true);
    expect(regex.test("Cosmedica")).toBe(true);
  });

  it("matches full doctor name", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    expect(regex.test("Dr. Koray Erdogan")).toBe(true);
  });

  it("matches bare surname without Dr. prefix", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    expect(regex.test("Erdogan")).toBe(true);
    expect(regex.test("Karadeniz")).toBe(true);
    expect(regex.test("Bloxham")).toBe(true);
  });

  it("matches case-insensitively", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    expect(regex.test("cosmedica")).toBe(true);
    expect(regex.test("COSMEDICA")).toBe(true);
    expect(regex.test("dr. koray erdogan")).toBe(true);
  });

  it("does not match generic stopwords like 'clinic' or 'hair'", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    // These words appear in entity names but should NOT match alone
    expect(regex.test("clinic")).toBe(false);
    expect(regex.test("hair")).toBe(false);
    expect(regex.test("medical")).toBe(false);
    expect(regex.test("istanbul")).toBe(false);
  });

  it("does not match completely unrelated text", () => {
    const regex = buildEntityRegex(SAMPLE_ENTITIES);
    expect(regex.test("my hair transplant journey random xyz")).toBe(false);
    expect(regex.test("general question about finasteride")).toBe(false);
    expect(regex.test("6 month update with photos")).toBe(false);
  });

  it("handles empty entity list without throwing", () => {
    const regex = buildEntityRegex([]);
    expect(regex.test("anything")).toBe(false);
  });

  it("handles entity names with special regex characters", () => {
    const entities: KnownEntity[] = [
      { name: "Dr. O'Brien Hair & Scalp", source: "clinic" },
    ];
    // Should not throw — special chars are escaped
    expect(() => buildEntityRegex(entities)).not.toThrow();
    const regex = buildEntityRegex(entities);
    expect(regex.test("Dr. O'Brien Hair & Scalp")).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// matchesKnownEntity
// ─────────────────────────────────────────────────────────────────────────────

describe("matchesKnownEntity", () => {
  const regex = buildEntityRegex(SAMPLE_ENTITIES);

  it("matches when clinic name is in the title", () => {
    expect(
      matchesKnownEntity(
        "My experience at Cosmedica - 3000 grafts FUE",
        "Just sharing my story...",
        regex
      )
    ).toBe(true);
  });

  it("matches when doctor name is in the OP text but not the title", () => {
    expect(
      matchesKnownEntity(
        "My hair transplant journey - 12 month update",
        "I had my procedure done by Dr. Koray Erdogan in Istanbul last year.",
        regex
      )
    ).toBe(true);
  });

  it("matches bare surname in OP text", () => {
    expect(
      matchesKnownEntity(
        "6 month results with photos",
        "Bloxham did an amazing job on my hairline.",
        regex
      )
    ).toBe(true);
  });

  it("does not match when neither title nor OP text contains a known entity", () => {
    expect(
      matchesKnownEntity(
        "Hair transplant outside of USA?",
        "I am considering getting a transplant abroad. Any recommendations?",
        regex
      )
    ).toBe(false);
  });

  it("does not match generic hair loss discussion threads", () => {
    expect(
      matchesKnownEntity(
        "Finasteride & Shedding",
        "Has anyone experienced shedding on finasteride? My hair clinic said it's normal.",
        regex
      )
    ).toBe(false);
  });

  it("matches when clinic name appears mid-sentence in OP", () => {
    expect(
      matchesKnownEntity(
        "My FUE journey - month 4",
        "After much research I decided to go with AEK Hair Clinic based in Istanbul.",
        regex
      )
    ).toBe(true);
  });
});
