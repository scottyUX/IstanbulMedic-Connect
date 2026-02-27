import { runInstagramScraper } from "../instagramService";
import { extractInstagramClaims } from "../extractionInstagram";
import * as fs from "fs";

const TEST_CONFIG = {
  apiToken: "apify_token", 
  instagramUrl: "https://www.instagram.com/istanbulmedic/", 
};

async function testInstagramPipeline() {
  console.log("Starting Instagram pipeline test");
  console.log(`Scraping URL: ${TEST_CONFIG.instagramUrl}`);

  try {
    // Run the Instagram scraper
    console.log("\n[1/3] Running Instagram scraper via Apify...");
    const rawData = await runInstagramScraper({
      apiToken: TEST_CONFIG.apiToken,
      instagramUrl: TEST_CONFIG.instagramUrl,
    });

    console.log(`Scraper completed. Found ${rawData.profile.length} profile(s) and ${rawData.posts.length} post(s).`);

    // Save raw data
    const rawDataPath = "./instagram-raw-data.json";
    fs.writeFileSync(rawDataPath, JSON.stringify(rawData, null, 2));
    console.log(`Raw data saved to: ${rawDataPath}`);

    // Extract claims
    console.log("\n[2/3] Extracting claims from raw data...");
    const extractedClaims = extractInstagramClaims(rawData);

    console.log("Claims extracted successfully.");

    // Save extracted claims
    const claimsPath = "./instagram-extracted-claims.json";
    fs.writeFileSync(claimsPath, JSON.stringify(extractedClaims, null, 2));
    console.log(`Extracted claims saved to: ${claimsPath}`);

    //  Summary
    console.log("\n[3/3] Test Summary:");
    console.log("==================");
    console.log(`Username: ${extractedClaims.instagram.username || "N/A"}`);
    console.log(`Full Name: ${extractedClaims.instagram.fullName || "N/A"}`);
    console.log(`Followers: ${extractedClaims.instagram.followersCount || 0}`);
    console.log(`Posts: ${extractedClaims.instagram.postsCount || 0}`);
    console.log(`Verified: ${extractedClaims.instagram.verified ? "Yes" : "No"}`);
    console.log(
      `Business Account: ${extractedClaims.instagram.isBusinessAccount ? "Yes" : "No"}`
    );

    console.log("\\Test completed successfully!");
    console.log("\nOutput files:");
    console.log(`  - ${rawDataPath}`);
    console.log(`  - ${claimsPath}`);
  } catch (error) {
    console.error("\nTest failed with error:");
    console.error(error);
    process.exit(1);
  }
}

testInstagramPipeline();
