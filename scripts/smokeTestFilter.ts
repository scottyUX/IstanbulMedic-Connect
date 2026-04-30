import { createClient } from "@supabase/supabase-js";
import { loadKnownClinicKeywords, buildEntityRegex } from "./hrnStoragePipeline";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const entities = await loadKnownClinicKeywords(supabase);
  console.log("Entities loaded:", entities.length);
  console.log(
    "Sample:",
    entities.slice(0, 5).map((e) => `${e.name} (${e.source})`)
  );

  const regex = buildEntityRegex(entities);

  // Should PASS — text contains a known entity
  const knownText = entities[0]?.name || "";
  const test1 = regex.test(knownText);
  console.log(`\nTest 1 - known entity: "${knownText}" -> ${test1 ? "PASS ✓" : "FAIL ✗"}`);

  // Should FAIL — generic text with no known entity
  const unknownText = "my hair transplant journey random clinic xyz";
  const test2 = regex.test(unknownText);
  console.log(`Test 2 - unknown text: "${unknownText}" -> ${test2 ? "FAIL ✗ (too loose)" : "PASS ✓"}`);

  // Bonus: test a real thread title from our test runs
  const bloxhamTitle = "Dr. Bloxham - 2 FUTs + FUE temple points, 7350 grafts";
  const test3 = regex.test(bloxhamTitle);
  console.log(`Test 3 - Bloxham title: "${bloxhamTitle}" -> ${test3 ? "PASS ✓" : "FAIL ✗ (Bloxham not in DB)"}`);
}

main().catch(console.error);;
