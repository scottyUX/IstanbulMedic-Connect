/**
 * seedLocalDb.ts
 *
 * One-off script: copies all clinic profile data from production Supabase
 * into your local Supabase instance for local development and demos.
 *
 * Copies (in FK-safe order):
 *   sources → clinics → clinic_team → clinic_locations → clinic_services
 *   → clinic_languages → clinic_credentials → clinic_media → clinic_scores
 *   → clinic_score_components → clinic_google_places → clinic_facts
 *   → clinic_pricing → clinic_packages → clinic_instagram_posts
 *   → clinic_mentions → clinic_reviews
 *
 * Usage:
 *   npx tsx scripts/seedLocalDb.ts
 *
 * Requirements (.env.local):
 *   PROD_SUPABASE_URL              — production project URL
 *   PROD_SUPABASE_SERVICE_ROLE_KEY — production service role key
 *   NEXT_PUBLIC_SUPABASE_URL       — local URL (http://127.0.0.1:54321)
 *   SUPABASE_SERVICE_ROLE_KEY      — local service role key
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

// ── Table definitions (name + conflict key) ───────────────────────────────────

const TABLES: Array<{ name: string; onConflict: string; label: string }> = [
  // Independent tables first
  { name: "sources",                  onConflict: "id",         label: "sources" },
  { name: "clinics",                  onConflict: "id",         label: "clinics" },

  // clinic children (FK → clinics.id)
  { name: "clinic_team",              onConflict: "id",         label: "clinic_team" },
  { name: "clinic_locations",         onConflict: "id",         label: "clinic_locations" },
  { name: "clinic_services",          onConflict: "id",         label: "clinic_services" },
  { name: "clinic_languages",         onConflict: "id",         label: "clinic_languages" },
  { name: "clinic_credentials",       onConflict: "id",         label: "clinic_credentials" },
  { name: "clinic_media",             onConflict: "id",         label: "clinic_media" },
  { name: "clinic_scores",            onConflict: "id",         label: "clinic_scores" },
  { name: "clinic_score_components",  onConflict: "id",         label: "clinic_score_components" },
  { name: "clinic_google_places",     onConflict: "id",         label: "clinic_google_places" },
  { name: "clinic_facts",             onConflict: "id",         label: "clinic_facts" },
  { name: "clinic_pricing",           onConflict: "id",         label: "clinic_pricing" },
  { name: "clinic_packages",          onConflict: "id",         label: "clinic_packages" },
  { name: "clinic_instagram_posts",   onConflict: "id",         label: "clinic_instagram_posts" },
  { name: "clinic_social_media",      onConflict: "id",         label: "clinic_social_media" },

  // References both clinics + sources
  { name: "clinic_mentions",          onConflict: "id",         label: "clinic_mentions" },
  { name: "clinic_reviews",           onConflict: "id",         label: "clinic_reviews" },
];

// ── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  const prod = createClient(
    getEnv("PROD_SUPABASE_URL"),
    getEnv("PROD_SUPABASE_SERVICE_ROLE_KEY")
  );

  const local = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  console.log("Starting prod → local sync...\n");

  for (const table of TABLES) {
    process.stdout.write(`Fetching ${table.label}...`);

    const { data, error: fetchErr } = await prod
      .from(table.name)
      .select("*");

    if (fetchErr) {
      console.error(`\n  ✗ Failed to fetch ${table.label}: ${fetchErr.message}`);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(` 0 rows — skipped`);
      continue;
    }

    console.log(` ${data.length} rows`);
    process.stdout.write(`  Upserting...`);

    // Upsert in chunks of 500 to stay well within Supabase request size limits
    const CHUNK = 500;
    for (let i = 0; i < data.length; i += CHUNK) {
      const chunk = data.slice(i, i + CHUNK);
      const { error: upsertErr } = await local
        .from(table.name)
        .upsert(chunk, { onConflict: table.onConflict });

      if (upsertErr) {
        console.error(`\n  ✗ Failed to upsert ${table.label} (chunk ${i}–${i + CHUNK}): ${upsertErr.message}`);
        break;
      }
    }

    console.log(` ✓`);
  }

  console.log("\nDone. Local DB now mirrors production.");
}

seed().catch((err) => {
  console.error("\nSeed failed:", err.message);
  process.exit(1);
});
