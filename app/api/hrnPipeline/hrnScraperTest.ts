/**
 * HRN Forum Scraper - Proof of Concept
 *
 * Tests browser-based scraping of HairRestorationNetwork.com threads
 * to verify we can extract the data needed for the MVP.
 *
 * Run with: npx playwright test app/api/hrnPipeline/hrnScraperTest.ts
 * Or import and call testScrapeThread() from another script
 */

import { chromium, Browser, Page } from 'playwright';

// Types for scraped data
export interface HRNThreadData {
  // Basic metadata
  threadUrl: string;
  threadTitle: string;
  author: string;
  postDate: string | null;

  // Engagement metrics
  replyCount: number | null;
  viewCount: number | null;

  // Content
  opText: string;
  opHtml: string;

  // Last author post (for updates)
  lastAuthorPost: {
    text: string;
    html: string;
    date: string | null;
    pageNumber: number | null;
  } | null;

  // Detected signals
  hasPhotos: boolean;
  imageUrls: string[];

  // Scrape metadata
  scrapeTimestamp: string;
  scrapeStrategy: 'op_only' | 'op_and_last';
  pagesScanned: number;
  totalPages: number;
}

export interface HRNScraperResult {
  success: boolean;
  data: HRNThreadData | null;
  error: string | null;
  timing: {
    startTime: string;
    endTime: string;
    durationMs: number;
  };
}

/**
 * Extract thread metadata from the page header
 */
async function extractThreadMetadata(page: Page): Promise<{
  title: string;
  author: string;
  postDate: string | null;
  replyCount: number | null;
  viewCount: number | null;
  totalPages: number;
}> {
  return await page.evaluate(() => {
    // Thread title
    const titleEl = document.querySelector('h1');
    const title = titleEl?.textContent?.trim() || 'Unknown Title';

    // Find the first post (OP) - has data-ips-first-post attribute
    const firstPost = document.querySelector('article[data-ips-first-post]')
      || document.querySelector('.cTopic article:first-of-type');

    // Author - from the first post's username
    const authorEl = firstPost?.querySelector('.ipsUsername')
      || firstPost?.querySelector('.ipsEntry__username a')
      || firstPost?.querySelector('h3.ipsEntry__username a');
    const author = authorEl?.textContent?.trim() || 'Unknown Author';

    // Post date - from the first post's time element
    const dateEl = firstPost?.querySelector('time[datetime]')
      || firstPost?.querySelector('time');
    const postDate = dateEl?.getAttribute('datetime') || null;

    // Reply count and view count from page stats
    // Look in the topic header/stats area
    let replyCount: number | null = null;
    let viewCount: number | null = null;

    // Try to find stats in various locations
    const allText = document.body.textContent || '';
    const replyMatch = allText.match(/(\d+(?:,\d+)?)\s*(?:replies|posts)/i);
    const viewMatch = allText.match(/(\d+(?:,\d+)?)\s*views/i);

    if (replyMatch) {
      replyCount = parseInt(replyMatch[1].replace(/,/g, ''));
    }
    if (viewMatch) {
      viewCount = parseInt(viewMatch[1].replace(/,/g, ''));
    }

    // Total pages - look for pagination
    let totalPages = 1;
    const paginationLinks = document.querySelectorAll('.ipsPagination_page a, [data-page]');
    paginationLinks.forEach(link => {
      const pageNum = parseInt(link.textContent || '0');
      if (pageNum > totalPages) totalPages = pageNum;
    });
    // Also check for "last" page link
    const lastPageLink = document.querySelector('.ipsPagination_last a, [data-action="goToPage"][data-page]');
    if (lastPageLink) {
      const href = lastPageLink.getAttribute('href') || '';
      const dataPage = lastPageLink.getAttribute('data-page');
      if (dataPage) {
        totalPages = Math.max(totalPages, parseInt(dataPage));
      } else {
        const pageMatch = href.match(/page[\/=](\d+)/i);
        if (pageMatch) {
          totalPages = Math.max(totalPages, parseInt(pageMatch[1]));
        }
      }
    }

    return { title, author, postDate, replyCount, viewCount, totalPages };
  });
}

/**
 * Extract the original post (first post) content
 */
async function extractOriginalPost(page: Page): Promise<{
  text: string;
  html: string;
  hasPhotos: boolean;
  imageUrls: string[];
}> {
  return await page.evaluate(() => {
    // Find the first/OP comment - has data-ips-first-post attribute
    const opComment = document.querySelector('article[data-ips-first-post]')
      || document.querySelector('.cTopic article:first-of-type')
      || document.querySelector('.ipsEntry--post');

    if (!opComment) {
      return { text: '', html: '', hasPhotos: false, imageUrls: [] };
    }

    // Get the content area - data-role="commentContent" is the key selector
    const contentEl = opComment.querySelector('[data-role="commentContent"]')
      || opComment.querySelector('.ipsType_richText')
      || opComment.querySelector('.ipsEntry__content');

    const html = contentEl?.innerHTML || '';
    const text = contentEl?.textContent?.trim() || '';

    // Find images - exclude emojis, avatars, rank badges
    const images = contentEl?.querySelectorAll('img') || [];
    const imageUrls: string[] = [];
    images.forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src');
      const className = img.className || '';
      // Skip emojis, avatars, rank images
      if (src &&
          !src.includes('emoji') &&
          !src.includes('avatar') &&
          !src.includes('rank') &&
          !className.includes('ipsEmoji') &&
          !src.startsWith('data:image/svg')) {
        imageUrls.push(src);
      }
    });

    // Also check for attachment containers
    const attachments = opComment.querySelectorAll('.ipsAttach, [data-fileid]');

    // Check for photo indicators
    const hasPhotos = imageUrls.length > 0
      || attachments.length > 0
      || text.toLowerCase().includes('photo')
      || text.toLowerCase().includes('picture')
      || text.toLowerCase().includes('attached')
      || html.includes('ipsAttach')
      || html.includes('data-fileid');

    return { text, html, hasPhotos, imageUrls };
  });
}

/**
 * Find and extract the last post by the original author
 * This often contains the best long-term update signal
 */
async function extractLastAuthorPost(
  page: Page,
  browser: Browser,
  threadUrl: string,
  originalAuthor: string,
  totalPages: number
): Promise<{
  text: string;
  html: string;
  date: string | null;
  pageNumber: number | null;
} | null> {
  // If only one page, check current page for other posts by author
  if (totalPages === 1) {
    const lastPost = await findLastAuthorPostOnPage(page, originalAuthor, 1);
    return lastPost;
  }

  // For multi-page threads, go to the last page
  const lastPageUrl = threadUrl.includes('?')
    ? `${threadUrl}&page=${totalPages}`
    : `${threadUrl}?page=${totalPages}`;

  const newPage = await browser.newPage();
  try {
    await newPage.goto(lastPageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await newPage.waitForSelector('.cTopic article, article.ipsEntry--post', { timeout: 10000 }).catch(() => {});

    const lastPost = await findLastAuthorPostOnPage(newPage, originalAuthor, totalPages);
    return lastPost;
  } finally {
    await newPage.close();
  }
}

async function findLastAuthorPostOnPage(
  page: Page,
  authorName: string,
  pageNumber: number
): Promise<{
  text: string;
  html: string;
  date: string | null;
  pageNumber: number | null;
} | null> {
  return await page.evaluate(({ author, pageNum }: { author: string; pageNum: number }) => {
    // Find all posts/articles on the page
    const allPosts = document.querySelectorAll('.cTopic article, article.ipsEntry--post');
    let lastAuthorPost: Element | null = null;

    allPosts.forEach((post, index) => {
      // Skip the first post (OP) on page 1
      if (pageNum === 1 && index === 0) return;

      // Find author in this post
      const authorEl = post.querySelector('.ipsUsername')
        || post.querySelector('.ipsEntry__username a');
      const postAuthor = authorEl?.textContent?.trim();

      if (postAuthor?.toLowerCase() === author.toLowerCase()) {
        lastAuthorPost = post;
      }
    });

    if (!lastAuthorPost) return null;

    const contentEl = lastAuthorPost.querySelector('[data-role="commentContent"]')
      || lastAuthorPost.querySelector('.ipsType_richText');
    const dateEl = lastAuthorPost.querySelector('time[datetime]')
      || lastAuthorPost.querySelector('time');

    return {
      text: contentEl?.textContent?.trim() || '',
      html: contentEl?.innerHTML || '',
      date: dateEl?.getAttribute('datetime') || null,
      pageNumber: pageNum
    };
  }, { author: authorName, pageNum: pageNumber });
}

/**
 * Main scraper function - scrapes a single HRN thread
 */
export async function scrapeHRNThread(
  threadUrl: string,
  options: {
    strategy?: 'op_only' | 'op_and_last';
    headless?: boolean;
    timeout?: number;
  } = {}
): Promise<HRNScraperResult> {
  const {
    strategy = 'op_and_last',
    headless = true,
    timeout = 30000
  } = options;

  const startTime = new Date();
  let browser: Browser | null = null;

  try {
    // Launch browser
    browser = await chromium.launch({
      headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    const page = await context.newPage();

    // Navigate to thread
    console.log(`Navigating to: ${threadUrl}`);
    await page.goto(threadUrl, {
      waitUntil: 'domcontentloaded',
      timeout
    });

    // Wait for content to load - try multiple selectors for IPBoard/Invision
    const possibleSelectors = [
      'article.cPost',
      '.ipsComment',
      '[data-role="comment"]',
      '.cTopic article',
      '.ipsBox article'
    ];

    let foundSelector = null;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        foundSelector = selector;
        console.log(`Found content using selector: ${selector}`);
        break;
      } catch {
        continue;
      }
    }

    if (!foundSelector) {
      console.log('Warning: Could not find comment elements with any selector');
      // Take a debug screenshot
      await page.screenshot({ path: 'hrn-debug-screenshot.png', fullPage: false });
      console.log('Saved debug screenshot to hrn-debug-screenshot.png');

      // Log the page HTML structure for debugging
      const bodyHtml = await page.evaluate(() => {
        const main = document.querySelector('main') || document.querySelector('#ipsLayout_mainArea') || document.body;
        return main.innerHTML.substring(0, 2000);
      });
      console.log('Page structure preview:', bodyHtml.substring(0, 500));
    }

    // Extract metadata
    console.log('Extracting thread metadata...');
    const metadata = await extractThreadMetadata(page);
    console.log(`Found: "${metadata.title}" by ${metadata.author} (${metadata.totalPages} pages)`);

    // Extract OP content
    console.log('Extracting original post...');
    const opContent = await extractOriginalPost(page);
    console.log(`OP text length: ${opContent.text.length} chars, ${opContent.imageUrls.length} images`);

    // Extract last author post if strategy requires it
    let lastAuthorPost = null;
    if (strategy === 'op_and_last' && metadata.totalPages > 0) {
      console.log(`Searching for last post by ${metadata.author}...`);
      lastAuthorPost = await extractLastAuthorPost(
        page,
        browser,
        threadUrl,
        metadata.author,
        metadata.totalPages
      );
      if (lastAuthorPost) {
        console.log(`Found update on page ${lastAuthorPost.pageNumber}: ${lastAuthorPost.text.substring(0, 100)}...`);
      } else {
        console.log('No additional posts by author found');
      }
    }

    const endTime = new Date();

    const data: HRNThreadData = {
      threadUrl,
      threadTitle: metadata.title,
      author: metadata.author,
      postDate: metadata.postDate,
      replyCount: metadata.replyCount,
      viewCount: metadata.viewCount,
      opText: opContent.text,
      opHtml: opContent.html,
      lastAuthorPost,
      hasPhotos: opContent.hasPhotos,
      imageUrls: opContent.imageUrls,
      scrapeTimestamp: startTime.toISOString(),
      scrapeStrategy: strategy,
      pagesScanned: lastAuthorPost ? 2 : 1,
      totalPages: metadata.totalPages
    };

    return {
      success: true,
      data,
      error: null,
      timing: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime()
      }
    };

  } catch (error) {
    const endTime = new Date();
    return {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : String(error),
      timing: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        durationMs: endTime.getTime() - startTime.getTime()
      }
    };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Test function - scrapes a sample thread and logs results
 */
export async function testScrapeThread(testUrl?: string): Promise<void> {
  // Use a real HRN thread URL for testing
  // This is a public patient diary thread
  const url = testUrl || 'https://www.hairrestorationnetwork.com/topic/64000-my-fue-journey-3000-grafts/';

  console.log('='.repeat(60));
  console.log('HRN Scraper Test');
  console.log('='.repeat(60));
  console.log(`URL: ${url}`);
  console.log('Strategy: op_and_last');
  console.log('');

  const result = await scrapeHRNThread(url, {
    strategy: 'op_and_last',
    headless: true
  });

  if (result.success && result.data) {
    console.log('\n' + '='.repeat(60));
    console.log('SCRAPE SUCCESSFUL');
    console.log('='.repeat(60));
    console.log(`Title: ${result.data.threadTitle}`);
    console.log(`Author: ${result.data.author}`);
    console.log(`Post Date: ${result.data.postDate}`);
    console.log(`Replies: ${result.data.replyCount}`);
    console.log(`Views: ${result.data.viewCount}`);
    console.log(`Total Pages: ${result.data.totalPages}`);
    console.log(`Has Photos: ${result.data.hasPhotos}`);
    console.log(`Image URLs: ${result.data.imageUrls.length}`);
    console.log(`Duration: ${result.timing.durationMs}ms`);
    console.log('');
    console.log('OP Text (first 500 chars):');
    console.log('-'.repeat(40));
    console.log(result.data.opText.substring(0, 500));
    console.log('...');

    if (result.data.lastAuthorPost) {
      console.log('');
      console.log(`Last Author Post (page ${result.data.lastAuthorPost.pageNumber}):`);
      console.log('-'.repeat(40));
      console.log(result.data.lastAuthorPost.text.substring(0, 500));
      console.log('...');
    }
  } else {
    console.log('\n' + '='.repeat(60));
    console.log('SCRAPE FAILED');
    console.log('='.repeat(60));
    console.log(`Error: ${result.error}`);
    console.log(`Duration: ${result.timing.durationMs}ms`);
  }

  // Output raw JSON for inspection
  console.log('\n' + '='.repeat(60));
  console.log('RAW JSON OUTPUT');
  console.log('='.repeat(60));
  console.log(JSON.stringify(result, null, 2));
}

// Allow running directly with ts-node or similar
if (require.main === module) {
  const testUrl = process.argv[2];
  testScrapeThread(testUrl).catch(console.error);
}
