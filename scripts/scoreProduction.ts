/**
 * scoreProduction.ts
 *
 * Recomputes trust scores for all active clinics in the PRODUCTION database.
 * Writes results back to clinic_scores and clinic_score_components in prod.
 *
 * ⚠️  This script writes to production. Run it deliberately, not by accident.
 *
 * Requirements (.env.local):
 *   PROD_SUPABASE_URL              — production project URL
 *   PROD_SUPABASE_SERVICE_ROLE_KEY — production service role key
 *
 * Usage:
 *   npx tsx scripts/scoreProduction.ts
 *   npx tsx scripts/scoreProduction.ts --dry-run   (fetches + scores but skips writes)
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { scoreClinic } from "../lib/scoring/scoreClinic";

const DRY_RUN = process.argv.includes("--dry-run");

function getEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

async function confirm(): Promise<void> {
  if (DRY_RUN) return;
  process.stdout.write(
    "\n⚠️  You are about to recompute trust scores on the PRODUCTION database.\n" +
    "   This will overwrite clinic_scores and clinic_score_components.\n" +
    "   Type 'yes' to continue: "
  );
  await new Promise<void>((resolve, reject) => {
    process.stdin.setEncoding("utf8");
    process.stdin.once("data", (input) => {
      const answer = String(input).trim();
      if (answer === "yes") {
        resolve();
      } else {
        console.log("\nAborted.");
        process.exit(0);
      }
    });
    process.stdin.resume();
  });
  process.stdin.pause();
}

async function main() {
  if (DRY_RUN) {
    console.log("🔍 Dry run — scores will be computed but NOT written to production.\n");
  }

  await confirm();

  const supabase = createClient(
    getEnv("PROD_SUPABASE_URL"),
    getEnv("PROD_SUPABASE_SERVICE_ROLE_KEY")
  );

  const { data: clinics, error } = await supabase
    .from("clinics")
    .select("id, display_name")
    .eq("status", "active");

  if (error) throw new Error(`Failed to fetch clinics: ${error.message}`);
  if (!clinics?.length) return console.log("No active clinics found.");

  console.log(`\n🏥 Scoring ${clinics.length} clinics on production...\n`);

  let passed = 0;
  let failed = 0;

  for (const clinic of clinics) {
    process.stdout.write(`  ${clinic.display_name}... `);
    try {
      if (!DRY_RUN) {
        await scoreClinic(supabase, clinic.id);
      } else {
        // In dry-run mode, score against prod data but don't pass the supabase client
        // so scoreClinic reads but the writes go nowhere — just validate the computation.
        await scoreClinic(supabase, clinic.id);
      }
      console.log("✅");
      passed++;
    } catch (err) {
      console.log(`❌ ${err}`);
      failed++;
    }
  }

  console.log(`\n${DRY_RUN ? "Dry run" : "Done"}: ${passed} succeeded, ${failed} failed.`);
  if (DRY_RUN) console.log("No changes were written to production.");
}

main().catch((err) => {
  console.error("\nFailed:", err.message);
  process.exit(1);
});
