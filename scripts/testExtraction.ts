/**
 * Test script for LLM extraction
 *
 * Usage:
 *   npx tsx app/api/hrnPipeline/testExtraction.ts [thread_url]
 *
 * Requires OPENAI_API_KEY environment variable.
 */

import OpenAI from "openai";
import { scrapeHRNThread } from "./hrnScraperTest";
import {
  extractThreadSignals,
  EXTRACTION_MODEL,
  EXTRACTION_PROMPT_VERSION,
} from "./extractionPrompt";

async function testExtraction(threadUrl?: string) {
  // Default test URL
  const url =
    threadUrl ||
    "https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/";

  console.log("\n=== HRN Thread Extraction Test ===\n");
  console.log(`Model: ${EXTRACTION_MODEL}`);
  console.log(`Prompt version: ${EXTRACTION_PROMPT_VERSION}`);
  console.log(`Thread: ${url}\n`);

  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable not set");
    console.error("Run with: OPENAI_API_KEY=your-key npx tsx ...");
    process.exit(1);
  }

  // Step 1: Scrape the thread
  console.log("Step 1: Scraping thread...");
  const scrapeResult = await scrapeHRNThread(url, { headless: true });

  if (!scrapeResult.success || !scrapeResult.data) {
    console.error("Failed to scrape thread:", scrapeResult.error);
    process.exit(1);
  }

  const scraped = scrapeResult.data;

  console.log(`  Title: ${scraped.threadTitle}`);
  console.log(`  Author: ${scraped.author}`);
  console.log(`  OP text: ${scraped.opText.length} chars`);
  console.log(
    `  Last author post: ${scraped.lastAuthorPost?.text?.length || 0} chars`
  );
  console.log(`  Has photos: ${scraped.hasPhotos}`);
  console.log();

  // Step 2: Extract signals
  console.log("Step 2: Extracting signals via LLM...");
  const client = new OpenAI();

  const startTime = Date.now();
  const result = await extractThreadSignals(client, {
    threadTitle: scraped.threadTitle,
    opText: scraped.opText,
    lastAuthorPostText: scraped.lastAuthorPost?.text,
    threadUrl: url,
  });
  const duration = Date.now() - startTime;

  if (!result) {
    console.error("Extraction failed");
    process.exit(1);
  }

  console.log(`  Completed in ${duration}ms\n`);

  // Step 3: Display results
  console.log("=== Extraction Results ===\n");

  console.log("Attribution:");
  console.log(`  Clinic: ${result.attributed_clinic_name || "(not identified)"}`);
  console.log(`  Doctor: ${result.attributed_doctor_name || "(not identified)"}`);
  console.log();

  console.log("Sentiment:");
  console.log(`  Score: ${result.sentiment_score.toFixed(2)} (${result.sentiment_label})`);
  console.log(`  Satisfaction: ${result.satisfaction_label}`);
  console.log();

  console.log("Summary:");
  console.log(`  ${result.summary_short}`);
  console.log();

  console.log("Analysis:");
  console.log(`  Topics: ${result.main_topics.join(", ") || "(none)"}`);
  console.log(`  Issues: ${result.issue_keywords.join(", ") || "(none)"}`);
  console.log(`  Is repair case: ${result.is_repair_case}`);
  console.log(`  Has 12+ month followup: ${result.has_12_month_followup}`);
  console.log();

  if (result.secondary_clinic_mentions.length > 0) {
    console.log("Secondary Mentions:");
    for (const mention of result.secondary_clinic_mentions) {
      console.log(
        `  - ${mention.clinic_name} (${mention.role})${mention.doctor_name ? ` - ${mention.doctor_name}` : ""}`
      );
    }
    console.log();
  }

  console.log("Evidence Snippets:");
  for (const [key, value] of Object.entries(result.evidence_snippets)) {
    if (value) {
      console.log(`  ${key}: "${value.slice(0, 100)}${value.length > 100 ? "..." : ""}"`);
    }
  }
  console.log();

  console.log("=== Raw JSON ===\n");
  console.log(JSON.stringify(result, null, 2));
}

// Run
const url = process.argv[2];
testExtraction(url).catch(console.error);
