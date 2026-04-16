/**
 * HRN Storage Pipeline
 *
 * Orchestrates the full thread processing flow:
 *   thread URL → scrape → LLM extract → store in Supabase
 *
 * Usage:
 *   npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts [url]
 *   npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts --batch
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

import { scrapeHRNThread, HRNThreadData, HRNScraperResult } from "./hrnScraperTest";
import {
  extractThreadSignals,
  ExtractionResult,
  EXTRACTION_PROMPT_VERSION,
  EXTRACTION_MODEL,
} from "./extractionPrompt";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ProcessResult {
  success: boolean;
  threadUrl: string;
  threadId?: string; // UUID from forum_thread_index
  error?: string;
  timing: {
    scrapeMs: number;
    extractionMs: number;
    storageMs: number;
    totalMs: number;
  };
}

interface ForumThreadIndexRow {
  id?: string;
  clinic_id?: string | null;
  source_id?: string | null;
  forum_source: "hrn" | "reddit" | "realself";
  thread_url: string;
  title: string | null;
  author_username: string | null;
  post_date: string | null;
  reply_count: number | null;
  clinic_attribution_method: string | null;
  first_scraped_at?: string;
  last_scraped_at?: string;
}

interface HrnThreadContentRow {
  thread_id: string;
  forum_section_id: string | null;
  forum_section_name: string | null;
  view_count: number | null;
  total_pages: number | null;
  op_text: string | null;
  op_html: string | null;
  last_author_post_text: string | null;
  last_author_post_date: string | null;
  last_author_post_page: number | null;
  has_photos: boolean;
  image_urls: string[] | null;
  scrape_strategy: string | null;
  sitemap_lastmod?: string | null;
}

interface ForumThreadLlmAnalysisRow {
  thread_id: string;
  attributed_clinic_name: string | null;
  attributed_doctor_name: string | null;
  attributed_clinic_id?: string | null;
  sentiment_score: number | null;
  sentiment_label: string | null;
  satisfaction_label: string | null;
  summary_short: string | null;
  main_topics: string[] | null;
  issue_keywords: string[] | null;
  is_repair_case: boolean | null;
  secondary_clinic_mentions: object | null;
  evidence_snippets: object | null;
  model_name: string;
  prompt_version: string;
  run_timestamp?: string;
  is_current: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase Client Setup
// ─────────────────────────────────────────────────────────────────────────────

function createSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)");
  }

  return createClient(url, key);
}

function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY environment variable");
  }
  return new OpenAI({ apiKey });
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upsert thread into forum_thread_index (hub table).
 * Returns the thread ID (UUID).
 */
async function upsertForumThreadIndex(
  supabase: SupabaseClient,
  scrapeData: HRNThreadData
): Promise<{ id: string; isNew: boolean }> {
  // Check if thread already exists
  const { data: existing } = await supabase
    .from("forum_thread_index")
    .select("id")
    .eq("thread_url", scrapeData.threadUrl)
    .single();

  if (existing) {
    // Update existing record
    const { error } = await supabase
      .from("forum_thread_index")
      .update({
        title: scrapeData.threadTitle,
        author_username: scrapeData.author,
        post_date: scrapeData.postDate,
        reply_count: scrapeData.replyCount,
        last_scraped_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      throw new Error(`Failed to update forum_thread_index: ${error.message}`);
    }

    return { id: existing.id, isNew: false };
  }

  // Insert new record
  const row: ForumThreadIndexRow = {
    forum_source: "hrn",
    thread_url: scrapeData.threadUrl,
    title: scrapeData.threadTitle,
    author_username: scrapeData.author,
    post_date: scrapeData.postDate,
    reply_count: scrapeData.replyCount,
    clinic_attribution_method: null, // Will be set after LLM
  };

  const { data: inserted, error } = await supabase
    .from("forum_thread_index")
    .insert(row)
    .select("id")
    .single();

  if (error || !inserted) {
    throw new Error(`Failed to insert forum_thread_index: ${error?.message}`);
  }

  return { id: inserted.id, isNew: true };
}

/**
 * Upsert HRN-specific content into hrn_thread_content.
 */
async function upsertHrnThreadContent(
  supabase: SupabaseClient,
  threadId: string,
  scrapeData: HRNThreadData,
  forumSectionId?: string,
  forumSectionName?: string
): Promise<void> {
  const row: HrnThreadContentRow = {
    thread_id: threadId,
    forum_section_id: forumSectionId || null,
    forum_section_name: forumSectionName || null,
    view_count: scrapeData.viewCount,
    total_pages: scrapeData.totalPages,
    op_text: scrapeData.opText,
    op_html: scrapeData.opHtml,
    last_author_post_text: scrapeData.lastAuthorPost?.text || null,
    last_author_post_date: scrapeData.lastAuthorPost?.date || null,
    last_author_post_page: scrapeData.lastAuthorPost?.pageNumber || null,
    has_photos: scrapeData.hasPhotos,
    image_urls: scrapeData.imageUrls.length > 0 ? scrapeData.imageUrls : null,
    scrape_strategy: scrapeData.scrapeStrategy,
  };

  // Upsert (insert or update)
  const { error } = await supabase
    .from("hrn_thread_content")
    .upsert(row, { onConflict: "thread_id" });

  if (error) {
    throw new Error(`Failed to upsert hrn_thread_content: ${error.message}`);
  }
}

/**
 * Insert LLM analysis results.
 * Marks previous analyses as not current.
 */
async function insertLlmAnalysis(
  supabase: SupabaseClient,
  threadId: string,
  extraction: ExtractionResult
): Promise<void> {
  // Mark previous analyses as not current
  await supabase
    .from("forum_thread_llm_analysis")
    .update({ is_current: false })
    .eq("thread_id", threadId);

  const row: ForumThreadLlmAnalysisRow = {
    thread_id: threadId,
    attributed_clinic_name: extraction.attributed_clinic_name,
    attributed_doctor_name: extraction.attributed_doctor_name,
    sentiment_score: extraction.sentiment_score,
    sentiment_label: extraction.sentiment_label,
    satisfaction_label: extraction.satisfaction_label,
    summary_short: extraction.summary_short,
    main_topics: extraction.main_topics,
    issue_keywords: extraction.issue_keywords,
    is_repair_case: extraction.is_repair_case,
    secondary_clinic_mentions: extraction.secondary_clinic_mentions,
    evidence_snippets: extraction.evidence_snippets,
    model_name: EXTRACTION_MODEL,
    prompt_version: EXTRACTION_PROMPT_VERSION,
    is_current: true,
  };

  const { error } = await supabase
    .from("forum_thread_llm_analysis")
    .insert(row);

  if (error) {
    throw new Error(`Failed to insert forum_thread_llm_analysis: ${error.message}`);
  }

  // Update attribution method in hub if clinic was found
  if (extraction.attributed_clinic_name) {
    await supabase
      .from("forum_thread_index")
      .update({ clinic_attribution_method: "llm" })
      .eq("id", threadId);
  }
}

/**
 * Update deterministic signals (regex-extracted) in forum_thread_signals.
 * Currently stores has_12_month_followup as a signal.
 */
async function upsertDeterministicSignals(
  supabase: SupabaseClient,
  threadId: string,
  extraction: ExtractionResult
): Promise<void> {
  // has_12_month_followup signal
  const { error } = await supabase
    .from("forum_thread_signals")
    .upsert(
      {
        thread_id: threadId,
        signal_name: "has_12_month_followup",
        signal_value: extraction.has_12_month_followup,
        extraction_method: "llm",
        extraction_version: EXTRACTION_PROMPT_VERSION,
      },
      { onConflict: "thread_id,signal_name" }
    );

  if (error) {
    console.warn(`Warning: Failed to upsert signal has_12_month_followup: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Clinic / Doctor Filter
// ─────────────────────────────────────────────────────────────────────────────

export interface KnownEntity {
  /** Exact name as stored in DB — used for display/logging */
  name: string;
  /** Source of this entity */
  source: "clinic" | "doctor";
}

/**
 * Load known clinic names (from clinics table) and doctor names (from clinic_team table).
 * Call once at batch start and pass the result into processThread via entityFilter.
 */
export async function loadKnownClinicKeywords(
  supabase: SupabaseClient
): Promise<KnownEntity[]> {
  const [clinicsRes, teamRes] = await Promise.all([
    supabase.from("clinics").select("display_name, legal_name"),
    supabase.from("clinic_team").select("name").not("name", "is", null),
  ]);

  if (clinicsRes.error) throw new Error(`Failed to load clinics: ${clinicsRes.error.message}`);
  if (teamRes.error) throw new Error(`Failed to load clinic_team: ${teamRes.error.message}`);

  const entities: KnownEntity[] = [];

  for (const row of clinicsRes.data || []) {
    if (row.display_name) entities.push({ name: row.display_name, source: "clinic" });
    if (row.legal_name && row.legal_name !== row.display_name) {
      entities.push({ name: row.legal_name, source: "clinic" });
    }
  }

  for (const row of teamRes.data || []) {
    if (row.name) entities.push({ name: row.name, source: "doctor" });
  }

  return entities;
}

/**
 * Build a single regex from all known entity names.
 * Normalises names to match variations in thread text (e.g. "Dr. Bloxham" matches
 * "Bloxham", "Dr Bloxham", "dr. bloxham").
 *
 * Doctors list (when available) can be passed in alongside clinic entities.
 */
// Generic words that appear in clinic/doctor names but are too common to match on alone
const ENTITY_STOPWORDS = new Set([
  "hair", "clinic", "clinics", "center", "centre", "medical", "health",
  "istanbul", "ankara", "turkey", "turkiye", "international", "institute",
  "group", "team", "studio", "care", "plus", "dental", "aesthetic",
  "aesthetics", "surgery", "surgical", "transplant", "restoration",
  "tourism", "limited", "ltd", "corp", "the", "and", "for", "with",
]);

export function buildEntityRegex(entities: KnownEntity[]): RegExp {
  const terms = new Set<string>();

  for (const entity of entities) {
    const name = entity.name.trim();

    // Whole name (always include — specific enough)
    terms.add(name);

    // Strip leading "Dr." / "Dr " to also match bare surnames
    const stripped = name.replace(/^Dr\.?\s+/i, "").trim();
    if (stripped !== name) terms.add(stripped);

    // Individual tokens — only if specific enough (length > 3 and not a stopword)
    for (const token of stripped.split(/\s+/)) {
      const lower = token.toLowerCase().replace(/[^a-z]/g, "");
      if (token.length > 3 && !ENTITY_STOPWORDS.has(lower)) {
        terms.add(token);
      }
    }
  }

  // Escape special regex chars then join as alternation
  const escaped = [...terms]
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length); // longest first for greedy matching

  // Empty entity list → never-matching regex (don't accidentally match everything)
  if (escaped.length === 0) return /(?!)/;

  return new RegExp(escaped.join("|"), "i");
}

/**
 * Check if thread text mentions any known clinic or doctor.
 * Searches title + OP text (both already scraped — no extra cost).
 */
export function matchesKnownEntity(
  threadTitle: string,
  opText: string,
  regex: RegExp
): boolean {
  return regex.test(threadTitle) || regex.test(opText);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pipeline Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a single thread: scrape → extract → store
 */
export async function processThread(
  threadUrl: string,
  options: {
    supabase?: SupabaseClient;
    openai?: OpenAI;
    forumSectionId?: string;
    forumSectionName?: string;
    skipScrapeIfExists?: boolean;
    /** If provided, thread is skipped (no LLM) when text doesn't match any known entity */
    entityFilter?: RegExp;
  } = {}
): Promise<ProcessResult & { skipped?: boolean }> {
  const totalStart = Date.now();
  const timing = { scrapeMs: 0, extractionMs: 0, storageMs: 0, totalMs: 0 };

  // Initialize clients
  const supabase = options.supabase || createSupabaseClient();
  const openai = options.openai || createOpenAIClient();

  try {
    // Check if thread already exists and skip if requested
    if (options.skipScrapeIfExists) {
      const { data: existing } = await supabase
        .from("forum_thread_index")
        .select("id")
        .eq("thread_url", threadUrl)
        .single();

      if (existing) {
        timing.totalMs = Date.now() - totalStart;
        return {
          success: true,
          threadUrl,
          threadId: existing.id,
          timing,
        };
      }
    }

    // 1. Scrape the thread
    console.log(`  Scraping: ${threadUrl}`);
    const scrapeStart = Date.now();
    const scrapeResult: HRNScraperResult = await scrapeHRNThread(threadUrl);
    timing.scrapeMs = Date.now() - scrapeStart;

    if (!scrapeResult.success || !scrapeResult.data) {
      throw new Error(`Scrape failed: ${scrapeResult.error}`);
    }

    const scrapeData = scrapeResult.data;
    console.log(`  Scraped: "${scrapeData.threadTitle}" (${timing.scrapeMs}ms)`);

    // 2. Entity filter — skip LLM if thread doesn't mention a known clinic/doctor
    if (options.entityFilter) {
      const matched = matchesKnownEntity(
        scrapeData.threadTitle,
        scrapeData.opText,
        options.entityFilter
      );
      if (!matched) {
        console.log(`  Skipped: no known clinic/doctor found in text`);
        timing.totalMs = Date.now() - totalStart;
        return { success: true, skipped: true, threadUrl, timing };
      }
    }

    // 3. Extract signals via LLM
    console.log(`  Extracting signals...`);
    const extractStart = Date.now();
    const extraction = await extractThreadSignals(openai, {
      threadTitle: scrapeData.threadTitle,
      opText: scrapeData.opText,
      lastAuthorPostText: scrapeData.lastAuthorPost?.text,
      threadUrl: scrapeData.threadUrl,
    });
    timing.extractionMs = Date.now() - extractStart;

    if (!extraction) {
      throw new Error("LLM extraction failed");
    }
    console.log(`  Extracted: sentiment=${extraction.sentiment_label}, clinic=${extraction.attributed_clinic_name || "unknown"} (${timing.extractionMs}ms)`);

    // 3. Store in database
    console.log(`  Storing in database...`);
    const storageStart = Date.now();

    // 3a. Upsert hub table
    const { id: threadId, isNew } = await upsertForumThreadIndex(supabase, scrapeData);
    console.log(`    forum_thread_index: ${isNew ? "inserted" : "updated"} (id=${threadId})`);

    // 3b. Upsert HRN content
    await upsertHrnThreadContent(
      supabase,
      threadId,
      scrapeData,
      options.forumSectionId,
      options.forumSectionName
    );
    console.log(`    hrn_thread_content: upserted`);

    // 3c. Insert LLM analysis
    await insertLlmAnalysis(supabase, threadId, extraction);
    console.log(`    forum_thread_llm_analysis: inserted`);

    // 3d. Upsert deterministic signals
    await upsertDeterministicSignals(supabase, threadId, extraction);

    timing.storageMs = Date.now() - storageStart;
    timing.totalMs = Date.now() - totalStart;

    console.log(`  Done! (total: ${timing.totalMs}ms)`);

    return {
      success: true,
      threadUrl,
      threadId,
      timing,
    };
  } catch (error) {
    timing.totalMs = Date.now() - totalStart;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`  Failed: ${errorMessage}`);
    return {
      success: false,
      threadUrl,
      error: errorMessage,
      timing,
    };
  }
}

/**
 * Process multiple threads in sequence with rate limiting.
 */
export async function processBatch(
  threadUrls: string[],
  options: {
    delayBetweenMs?: number;
    forumSectionId?: string;
    forumSectionName?: string;
    /** Pass extra doctor entities to fold into the filter alongside clinic names */
    extraEntities?: KnownEntity[];
    onProgress?: (completed: number, total: number, result: ProcessResult) => void;
  } = {}
): Promise<{ results: ProcessResult[]; summary: { succeeded: number; failed: number; skipped: number } }> {
  const { delayBetweenMs = 5000, onProgress } = options;

  // Initialize clients once for batch
  const supabase = createSupabaseClient();
  const openai = createOpenAIClient();

  // Build entity filter from clinics DB + any extra entities (e.g. doctors list)
  console.log(`\nLoading known clinics from database...`);
  const clinicEntities = await loadKnownClinicKeywords(supabase);
  const allEntities = [...clinicEntities, ...(options.extraEntities || [])];
  const entityFilter = allEntities.length > 0 ? buildEntityRegex(allEntities) : undefined;
  const clinicCount = allEntities.filter((e) => e.source === "clinic").length;
  const doctorCount = allEntities.filter((e) => e.source === "doctor").length;
  console.log(`  Loaded ${clinicCount} clinics, ${doctorCount} doctors from database`);

  const results: ProcessResult[] = [];
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  console.log(`\n=== HRN Storage Pipeline - Batch Mode ===`);
  console.log(`Threads to process: ${threadUrls.length}`);
  console.log(`Delay between threads: ${delayBetweenMs}ms\n`);

  for (let i = 0; i < threadUrls.length; i++) {
    const url = threadUrls[i];
    console.log(`\n[${i + 1}/${threadUrls.length}] Processing...`);

    const result = await processThread(url, {
      supabase,
      openai,
      forumSectionId: options.forumSectionId,
      forumSectionName: options.forumSectionName,
      entityFilter,
    });

    results.push(result);

    if (result.skipped) {
      skipped++;
    } else if (result.success) {
      succeeded++;
    } else {
      failed++;
    }

    onProgress?.(i + 1, threadUrls.length, result);

    // Rate limiting
    if (i < threadUrls.length - 1) {
      console.log(`  Waiting ${delayBetweenMs / 1000}s before next thread...`);
      await new Promise((resolve) => setTimeout(resolve, delayBetweenMs));
    }
  }

  console.log(`\n=== Batch Complete ===`);
  console.log(`Succeeded: ${succeeded}/${threadUrls.length}`);
  console.log(`Skipped (no match): ${skipped}/${threadUrls.length}`);
  console.log(`Failed: ${failed}/${threadUrls.length}`);

  return { results, summary: { succeeded, failed, skipped } };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLI Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage:
  npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts <thread-url>
  npx tsx app/api/hrnPipeline/hrnStoragePipeline.ts --batch [--limit=N]

Options:
  <thread-url>    Process a single thread
  --batch         Process all threads from thread-urls.json
  --limit=N       Only process first N threads (for testing)
    `);
    return;
  }

  // Batch mode
  if (args.includes("--batch")) {
    const urlsFile = path.join(__dirname, "data", "thread-urls.json");
    if (!fs.existsSync(urlsFile)) {
      console.error(`Thread URLs file not found: ${urlsFile}`);
      console.error(`Run forumListingScraper.ts first to collect thread URLs.`);
      return;
    }

    const data = JSON.parse(fs.readFileSync(urlsFile, "utf-8"));
    let urls: string[] = data.threadUrls || [];

    // Apply limit if specified
    const limitArg = args.find((a) => a.startsWith("--limit="));
    if (limitArg) {
      const limit = parseInt(limitArg.split("=")[1]);
      urls = urls.slice(0, limit);
    }

    const { summary } = await processBatch(urls);
    console.log(`\nFinal summary: ${summary.succeeded} succeeded, ${summary.skipped} skipped, ${summary.failed} failed`);
    return;
  }

  // Single thread mode
  const threadUrl = args[0];
  if (!threadUrl.includes("hairrestorationnetwork.com")) {
    console.error("Invalid URL. Must be a HairRestorationNetwork thread URL.");
    return;
  }

  const result = await processThread(threadUrl);
  console.log("\nResult:", JSON.stringify(result, null, 2));
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
