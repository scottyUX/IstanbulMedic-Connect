/**
 * Forum Listing Scraper
 *
 * Collects all thread URLs from target HRN forums by paginating through listing pages.
 *
 * Usage:
 *   npx tsx app/api/hrnPipeline/forumListingScraper.ts [--resume] [--forum=24]
 *
 * Options:
 *   --resume    Resume from last saved progress
 *   --forum=N   Only scrape forum N (17, 24, or 89)
 *   --limit=N   Only scrape first N pages per forum (for testing)
 */

import { chromium, Browser } from 'playwright';
import type { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Forum configurations (verified 2026-04-08)
const FORUM_CONFIGS = [
  { id: 24, slug: 'hair-transplant-reviews', maxPage: 730 },
  { id: 17, slug: 'results-posted-by-leading-hair-restoration-clinics', maxPage: 410 },
  { id: 89, slug: 'hair-transplant-repairs', maxPage: 6 },
];

// Scraper settings
const DELAY_BETWEEN_REQUESTS_MS = 4000; // 4 seconds between requests
const SAVE_PROGRESS_EVERY_N_PAGES = 10;
const PROGRESS_FILE = 'app/api/hrnPipeline/data/forum-scrape-progress.json';
const OUTPUT_FILE = 'app/api/hrnPipeline/data/thread-urls.json';

interface Progress {
  forumProgress: Record<number, number>; // forum_id -> last completed page
  threadUrls: string[];
  startedAt: string;
  lastUpdatedAt: string;
}

interface ScraperOptions {
  resume?: boolean;
  forumId?: number;
  pageLimit?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadProgress(): Progress | null {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load progress:', e);
  }
  return null;
}

function saveProgress(progress: Progress): void {
  const dir = path.dirname(PROGRESS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  progress.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function saveOutput(threadUrls: string[]): void {
  const dir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const output = {
    totalThreads: threadUrls.length,
    scrapedAt: new Date().toISOString(),
    threadUrls: threadUrls,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
}

async function extractThreadUrlsFromPage(page: Page, debug = false): Promise<string[]> {
  const result = await page.evaluate(() => {
    const allLinks = Array.from(document.querySelectorAll('a[href*="/topic/"]'));
    const threadUrls = [...new Set(allLinks.map(a => {
      const href = a.getAttribute('href') || '';
      // Remove query params, hash, and /page/X/ suffix to get base URL
      return href.split('?')[0].split('#')[0].replace(/\/page\/\d+\/?$/, '/');
    }).filter(url => url.includes('/topic/')))];
    return {
      totalLinksOnPage: document.querySelectorAll('a').length,
      topicLinksRaw: allLinks.length,
      threadUrls,
    };
  });

  if (debug) {
    console.log(`    Debug: ${result.totalLinksOnPage} total links, ${result.topicLinksRaw} topic links raw`);
  }

  return result.threadUrls;
}

async function scrapeForumPages(
  browser: Browser,
  forumConfig: { id: number; slug: string; maxPage: number },
  startPage: number,
  endPage: number,
  onProgress: (page: number, urls: string[]) => void
): Promise<string[]> {
  const allUrls: string[] = [];

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    // Fresh context for EACH page to avoid Cloudflare session blocking
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });
    const page = await context.newPage();

    const url = pageNum === 1
      ? `https://www.hairrestorationnetwork.com/forum/${forumConfig.id}-${forumConfig.slug}/`
      : `https://www.hairrestorationnetwork.com/forum/${forumConfig.id}-${forumConfig.slug}/page/${pageNum}/`;

    console.log(`  [Forum ${forumConfig.id}] Page ${pageNum}/${endPage} - ${url}`);

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for content to load
      await page.waitForTimeout(5000);

      // Check if we're stuck on Cloudflare challenge
      const pageContent = await page.content();
      const isBlocked = pageContent.includes('security verification') ||
                        pageContent.includes('Checking your browser') ||
                        pageContent.includes('cf-challenge');

      if (isBlocked) {
        console.log('    ⚠️ Cloudflare challenge detected, waiting for it to resolve...');
        await page.waitForTimeout(12000);

        const stillBlocked = await page.content().then((c: string) =>
          c.includes('security verification') || c.includes('Checking your browser')
        );
        if (stillBlocked) {
          console.log('    ❌ Still blocked after waiting. Skipping page.');
          await context.close();
          continue;
        }
        console.log('    ✅ Challenge resolved!');
      }

      const urls = await extractThreadUrlsFromPage(page, true);
      allUrls.push(...urls);

      console.log(`    Found ${urls.length} thread URLs (total: ${allUrls.length})`);

      onProgress(pageNum, urls);

    } catch (e) {
      console.error(`    Error on page ${pageNum}:`, e);
    } finally {
      await context.close();
    }

    // Rate limiting between requests
    if (pageNum < endPage) {
      const delay = DELAY_BETWEEN_REQUESTS_MS + Math.random() * 2000; // Add some jitter
      console.log(`    Waiting ${Math.round(delay / 1000)}s before next request...`);
      await sleep(delay);
    }
  }

  return allUrls;
}

async function runScraper(options: ScraperOptions = {}): Promise<void> {
  console.log('\n=== HRN Forum Listing Scraper ===\n');

  // Initialize or load progress
  let progress: Progress;
  if (options.resume) {
    const loaded = loadProgress();
    if (loaded) {
      progress = loaded;
      console.log('Resuming from saved progress...');
      console.log(`  Started: ${progress.startedAt}`);
      console.log(`  URLs collected so far: ${progress.threadUrls.length}`);
    } else {
      console.log('No progress file found, starting fresh.');
      progress = {
        forumProgress: {},
        threadUrls: [],
        startedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      };
    }
  } else {
    progress = {
      forumProgress: {},
      threadUrls: [],
      startedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  // Filter forums if specific forum requested
  let forums = FORUM_CONFIGS;
  if (options.forumId) {
    forums = forums.filter(f => f.id === options.forumId);
    if (forums.length === 0) {
      console.error(`Forum ${options.forumId} not found in config.`);
      return;
    }
  }

  // Launch browser (contexts created fresh per page in scrapeForumPages)
  const browser = await chromium.launch({ headless: false });

  try {
    for (const forum of forums) {
      const startPage = (progress.forumProgress[forum.id] || 0) + 1;
      const endPage = options.pageLimit
        ? Math.min(startPage + options.pageLimit - 1, forum.maxPage)
        : forum.maxPage;

      if (startPage > forum.maxPage) {
        console.log(`\nForum ${forum.id}: Already complete (${forum.maxPage} pages)`);
        continue;
      }

      console.log(`\nForum ${forum.id} (${forum.slug}):`);
      console.log(`  Pages: ${startPage} to ${endPage} of ${forum.maxPage}`);

      let pagesSinceLastSave = 0;

      await scrapeForumPages(
        browser,
        forum,
        startPage,
        endPage,
        (completedPage, newUrls) => {
          progress.forumProgress[forum.id] = completedPage;
          progress.threadUrls.push(...newUrls);
          pagesSinceLastSave++;

          // Save progress periodically
          if (pagesSinceLastSave >= SAVE_PROGRESS_EVERY_N_PAGES) {
            console.log(`    Saving progress (${progress.threadUrls.length} URLs)...`);
            saveProgress(progress);
            pagesSinceLastSave = 0;
          }
        }
      );

      // Save after each forum
      saveProgress(progress);
      console.log(`  Forum ${forum.id} complete. Total URLs: ${progress.threadUrls.length}`);
    }

    // Deduplicate final URLs
    const uniqueUrls = [...new Set(progress.threadUrls)];
    console.log(`\n=== Scrape Complete ===`);
    console.log(`Total URLs collected: ${progress.threadUrls.length}`);
    console.log(`Unique URLs: ${uniqueUrls.length}`);
    console.log(`Duplicates removed: ${progress.threadUrls.length - uniqueUrls.length}`);

    // Save final output
    saveOutput(uniqueUrls);
    console.log(`\nSaved to: ${OUTPUT_FILE}`);

  } finally {
    await browser.close();
  }
}

// Parse CLI args
function parseArgs(): ScraperOptions {
  const args = process.argv.slice(2);
  const options: ScraperOptions = {};

  for (const arg of args) {
    if (arg === '--resume') {
      options.resume = true;
    } else if (arg.startsWith('--forum=')) {
      options.forumId = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--limit=')) {
      options.pageLimit = parseInt(arg.split('=')[1]);
    }
  }

  return options;
}

// Run if executed directly
const options = parseArgs();
runScraper(options).catch(console.error);

export { runScraper };
export type { ScraperOptions };
