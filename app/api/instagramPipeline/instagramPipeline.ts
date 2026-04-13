import { runInstagramScraper } from "./instagramService";
import { extractInstagramClaims } from "./extractionInstagram";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Secrets from env (set in .env.local locally, Vercel dashboard in production)
const apiToken = process.env.APIFY_API_TOKEN as string;
// POST endpoint for the Instagram import route handler
const endpoint = process.env.INSTAGRAM_IMPORT_ENDPOINT || "http://localhost:3000/api/import/instagram";

if (!apiToken) throw new Error("Missing env variable: APIFY_API_TOKEN");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Clinic list stays in JSON
const configPath = path.resolve(__dirname, "clinics.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const clinics: { clinicName: string; instagramUrl: string }[] = config.clinics;

async function getClinicId(clinicName: string): Promise<string | null> {
  const { data } = await supabase
    .from("clinics")
    .select("id")
    .eq("display_name", clinicName)
    .single();

  if (data) return data.id;

  // Not found — create a new clinic
  console.log(`  Clinic not found, creating: "${clinicName}"`);
  const { data: newClinic, error: insertError } = await supabase
    .from("clinics")
    .insert({ display_name: clinicName, status: "active", primary_city: "Istanbul", primary_country: "Turkey" })
    .select("id")
    .single();

  if (insertError || !newClinic) {
    console.error(`  Failed to create clinic "${clinicName}":`, insertError?.message);
    return null;
  }

  console.log(`  Created clinic with id: ${newClinic.id}`);
  return newClinic.id;
}

async function uploadToSupabase(payload: {
  clinicId: string;
  instagramData: Record<string, unknown>;
}): Promise<{ success: boolean; error?: string }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    return {
      success: false,
      error: errorData.error || `HTTP ${response.status}`,
    };
  }

  return { success: true };
}

async function runPipeline() {
  console.log(`Instagram Pipeline - ${new Date().toISOString()}`);
  console.log(`Clinics to scrape: ${clinics.length}`);

  const errors: { url: string; error: string }[] = [];
  let succeeded = 0;

  for (let i = 0; i < clinics.length; i++) {
    const { clinicName, instagramUrl } = clinics[i];
    console.log(`\n[${i + 1}/${clinics.length}] ${clinicName}`);

    const clinicId = await getClinicId(clinicName);
    if (!clinicId) {
      errors.push({ url: instagramUrl, error: `Failed to find or create clinic: "${clinicName}"` });
      continue;
    }

    try {
      const rawData = await runInstagramScraper({ apiToken, instagramUrl });
      const extractedClaims = extractInstagramClaims(rawData);

      // Save JSON files
      fs.writeFileSync("./instagram-raw-data.json", JSON.stringify(rawData, null, 2));
      fs.writeFileSync("./instagram-extracted-claims.json", JSON.stringify(extractedClaims, null, 2));
      console.log(`  Saved JSON files`);

      const uploadResult = await uploadToSupabase({
        clinicId,
        instagramData: {
          instagram: extractedClaims.instagram,
          extracted_claims: {
            identity: extractedClaims.extracted_claims.identity,
            social: extractedClaims.extracted_claims.social,
            contact: extractedClaims.extracted_claims.contact,
            services: extractedClaims.extracted_claims.services,
            positioning: extractedClaims.extracted_claims.positioning,
            languages: extractedClaims.extracted_claims.languages,
            geography: extractedClaims.extracted_claims.geography,
          },
          posts: extractedClaims.extracted_claims.posts,
        },
      });

      if (!uploadResult.success) {
        console.error(`  Upload failed: ${uploadResult.error}`);
      } else {
        console.log(`  Uploaded to Supabase`);
      }

      succeeded++;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`  Failed: ${msg}`);
      errors.push({ url: instagramUrl, error: msg });
    }
  }

  // Summary
  console.log("\n========== Pipeline Complete ==========");
  console.log(`Succeeded: ${succeeded}/${clinics.length}`);
  console.log(`Failed: ${errors.length}/${clinics.length}`);

  if (errors.length > 0) {
    console.log("\nFailed URLs:");
    for (const e of errors) {
      console.log(`  - ${e.url}: ${e.error}`);
    }
  }
}

runPipeline();
