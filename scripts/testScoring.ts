// scripts/testScoring.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { createClient } from "@supabase/supabase-js";
import { scoreClinic } from "../lib/scoring/scoreClinic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data: clinics, error } = await supabase
    .from("clinics")
    .select("id, display_name")
    .eq("status", "active");

  if (error) throw new Error(`Failed to fetch clinics: ${error.message}`);
  if (!clinics?.length) return console.log("No active clinics found.");

  console.log(`🏥 Scoring ${clinics.length} clinics...\n`);

  for (const clinic of clinics) {
    console.log(`Scoring: ${clinic.display_name}`);
    try {
      await scoreClinic(supabase, clinic.id);
    } catch (err) {
      console.error(`  ❌ Failed: ${err}`);
    }
  }

  console.log("\n✅ Done.");
}

main();