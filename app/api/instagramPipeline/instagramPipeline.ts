import { runInstagramScraper } from "./instagramService";
import { extractInstagramClaims } from "./extractionInstagram";
import * as fs from "fs";
import * as path from "path";
const configPath = path.resolve(__dirname, "insta_pipeline/clinics.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
const apiToken: string = config.apiToken;
const clinicUrls: string[] = config.clinics;

// Replace once given actual endpoint
async function uploadToSupabase(payload: {
  clinic_name: string;
  scraped_at: string;
  extracted_claims: any;
}): Promise<{ success: boolean; error?: string }> {
  console.log(`  [upload] Stub called for: ${payload.clinic_name}`);
  return { success: true };
}

async function runPipeline() {
  console.log(`Instagram Pipeline - ${new Date().toISOString()}`);
  console.log(`Clinics to scrape: ${clinicUrls.length}`);

  const errors: { url: string; error: string }[] = [];
  let succeeded = 0;

  for (let i = 0; i < clinicUrls.length; i++) {
    const url = clinicUrls[i];
    console.log(`\n[${i + 1}/${clinicUrls.length}] Scraping: ${url}`);

    try {
      const rawData = await runInstagramScraper({ apiToken, instagramUrl: url });
      const extractedClaims = extractInstagramClaims(rawData);
      const scrapedAt = new Date().toISOString();
      const clinicName = extractedClaims.instagram.username || "unknown";

      // Save JSON files
      fs.writeFileSync("./instagram-raw-data.json", JSON.stringify(rawData, null, 2));
      fs.writeFileSync("./instagram-extracted-claims.json", JSON.stringify(extractedClaims, null, 2));
      console.log(`  Saved JSON files`);

      // Upload to Supabase
      const uploadResult = await uploadToSupabase({
        clinic_name: clinicName,
        scraped_at: scrapedAt,
        extracted_claims: extractedClaims.extracted_claims,
      });

      if (!uploadResult.success) {
        console.error(`  Upload failed: ${uploadResult.error}`);
      } else {
        console.log(`  Uploaded to Supabase`);
      }

      succeeded++;
    } catch (error: any) {
      console.error(`  Failed: ${error.message}`);
      errors.push({ url, error: error.message });
    }
  }

  // Summary
  console.log("\n========== Pipeline Complete ==========");
  console.log(`Succeeded: ${succeeded}/${clinicUrls.length}`);
  console.log(`Failed: ${errors.length}/${clinicUrls.length}`);

  if (errors.length > 0) {
    console.log("\nFailed URLs:");
    for (const e of errors) {
      console.log(`  - ${e.url}: ${e.error}`);
    }
  }
}

runPipeline();
