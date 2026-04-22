/**
 * seedLocalClinics.ts
 *
 * One-off script: copies clinics + clinic_team rows from production Supabase
 * into your local Supabase instance so the HRN pipeline can resolve clinic UUIDs.
 *
 * Usage:
 *   npx tsx app/api/hrnPipeline/seedLocalClinics.ts
 *
 * Requirements:
 *   .env.local must have:
 *     PROD_SUPABASE_URL            — production project URL
 *     PROD_SUPABASE_SERVICE_ROLE_KEY — production service role key
 *     NEXT_PUBLIC_SUPABASE_URL     — local Supabase URL (http://127.0.0.1:54321)
 *     SUPABASE_SERVICE_ROLE_KEY    — local service role key
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

async function seed() {
  const prod = createClient(
    getEnv("PROD_SUPABASE_URL"),
    getEnv("PROD_SUPABASE_SERVICE_ROLE_KEY")
  );

  const local = createClient(
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY")
  );

  // ── 1. Fetch from production ─────────────────────────────────────────────

  console.log("Fetching clinics from production...");
  const { data: clinics, error: clinicsErr } = await prod
    .from("clinics")
    .select("*");
  if (clinicsErr) throw new Error(`Failed to fetch clinics: ${clinicsErr.message}`);
  console.log(`  ${clinics?.length ?? 0} clinic rows`);

  console.log("Fetching clinic_team from production...");
  const { data: team, error: teamErr } = await prod
    .from("clinic_team")
    .select("*");
  if (teamErr) throw new Error(`Failed to fetch clinic_team: ${teamErr.message}`);
  console.log(`  ${team?.length ?? 0} clinic_team rows`);

  // ── 2. Upsert into local ─────────────────────────────────────────────────
  // Insert clinics first (clinic_team has FK → clinics.id)

  if (clinics && clinics.length > 0) {
    console.log("\nUpserting clinics into local...");
    const { error } = await local
      .from("clinics")
      .upsert(clinics, { onConflict: "id" });
    if (error) throw new Error(`Failed to upsert clinics: ${error.message}`);
    console.log(`  ✓ ${clinics.length} clinics upserted`);
  }

  if (team && team.length > 0) {
    console.log("Upserting clinic_team into local...");
    const { error } = await local
      .from("clinic_team")
      .upsert(team, { onConflict: "id" });
    if (error) throw new Error(`Failed to upsert clinic_team: ${error.message}`);
    console.log(`  ✓ ${team.length} clinic_team rows upserted`);
  }

  console.log("\nDone. Local DB now has production clinic data.");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
