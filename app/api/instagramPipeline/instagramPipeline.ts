import { runInstagramScraper } from "./instagramService";
import { extractInstagramClaims } from "./extractionInstagram";
import * as fs from "fs";
import * as path from "path";

const configPath = path.resolve(__dirname, "insta_pipeline/clinics.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const apiToken: string = config.apiToken;
const endpoint: string = config.endpoint; 
const clinics: { clinicId: string; instagramUrl: string }[] = config.clinics;

async function uploadToSupabase(payload: {
  clinicId: string;
  instagramData: any;
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
    const { clinicId, instagramUrl } = clinics[i];
    console.log(`\n[${i + 1}/${clinics.length}] Scraping: ${instagramUrl}`);

    try {
      const rawData = await runInstagramScraper({ apiToken, instagramUrl });
      const extractedClaims = extractInstagramClaims(rawData);

      // Save JSON files
      fs.writeFileSync("./instagram-raw-data.json", JSON.stringify(rawData, null, 2));
      fs.writeFileSync("./instagram-extracted-claims.json", JSON.stringify(extractedClaims, null, 2));
      console.log(`  Saved JSON files`);

      // Upload to Supabase
      const uploadResult = await uploadToSupabase({
        clinicId,
        instagramData: extractedClaims.extracted_claims,
      });

      if (!uploadResult.success) {
        console.error(`  Upload failed: ${uploadResult.error}`);
      } else {
        console.log(`  Uploaded to Supabase`);
      }

      succeeded++;
    } catch (error: any) {
      console.error(`  Failed: ${error.message}`);
      errors.push({ url: instagramUrl, error: error.message });
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
