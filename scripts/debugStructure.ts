/**
 * Debug script to inspect HRN forum page structure
 * Run with: npx tsx app/api/hrnPipeline/debugStructure.ts [url]
 */

import { chromium } from 'playwright';

async function debugHRNStructure(url: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to:', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  // Wait a bit for content to render
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'hrn-debug.png', fullPage: false });
  console.log('Screenshot saved to hrn-debug.png');

  // Dump structure info
  const structure = await page.evaluate(() => {
    const result: Record<string, unknown> = {};

    // Title
    const titleSelectors = [
      'h1.ipsType_pageTitle', '.ipsType_pageTitle', 'h1', '.cTopic h1',
      '[data-role="commentTitle"]', '.ipsBox h1'
    ];
    for (const sel of titleSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) {
        result.title = { selector: sel, text: el.textContent.trim() };
        break;
      }
    }

    // First post/article
    const postSelectors = [
      'article.cPost', '.cPost', '[data-role="comment"]', '.ipsComment',
      '.cTopic article', '.ipsBox article'
    ];
    for (const sel of postSelectors) {
      const posts = document.querySelectorAll(sel);
      if (posts.length > 0) {
        result.postsFound = { selector: sel, count: posts.length };

        // Inspect first post structure
        const firstPost = posts[0];
        result.firstPostClasses = firstPost.className;
        result.firstPostId = firstPost.id || 'no-id';

        // Look for author in first post
        const authorSelectors = [
          '.cAuthorPane_author', '.cAuthorPane_author a',
          '.ipsComment_author', '.ipsComment_author a',
          '[data-role="author"]', 'aside a[href*="/profile/"]',
          'aside strong a', 'aside .cAuthorPane a'
        ];
        for (const authorSel of authorSelectors) {
          const authorEl = firstPost.querySelector(authorSel);
          if (authorEl?.textContent?.trim()) {
            result.author = { selector: authorSel, text: authorEl.textContent.trim() };
            break;
          }
        }

        // Look for content in first post
        const contentSelectors = [
          '.cPost_contentWrap', '[data-role="commentContent"]',
          '.ipsComment_content', '.ipsType_richText',
          '.cPost__content', 'div[data-ipsquote-contentselector]'
        ];
        for (const contentSel of contentSelectors) {
          const contentEl = firstPost.querySelector(contentSel);
          if (contentEl?.textContent?.trim()) {
            result.content = {
              selector: contentSel,
              textLength: contentEl.textContent.trim().length,
              preview: contentEl.textContent.trim().substring(0, 200)
            };
            break;
          }
        }

        // Look for date in first post
        const dateSelectors = [
          'time', '.ipsComment_meta time', '[datetime]'
        ];
        for (const dateSel of dateSelectors) {
          const dateEl = firstPost.querySelector(dateSel);
          if (dateEl) {
            result.date = {
              selector: dateSel,
              datetime: dateEl.getAttribute('datetime'),
              text: dateEl.textContent?.trim()
            };
            break;
          }
        }

        break;
      }
    }

    // Look for stats (replies/views)
    const statsSelectors = [
      '.ipsType_light', '.cTopic_stats', '.ipsDataList',
      '.ipsFlex_ai\\:center', '.cTopicHeader'
    ];
    for (const sel of statsSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.includes('repl') || el?.textContent?.includes('view')) {
        result.stats = { selector: sel, text: el.textContent?.trim()?.substring(0, 200) };
        break;
      }
    }

    // Check for pagination
    const paginationEl = document.querySelector('.ipsPagination');
    if (paginationEl) {
      const pages = document.querySelectorAll('.ipsPagination_page');
      result.pagination = { found: true, pageCount: pages.length };
    }

    // Dump first article's full HTML structure (first 2000 chars)
    const firstArticle = document.querySelector('article.cPost, .cPost, .cTopic article');
    if (firstArticle) {
      result.firstArticleHtml = firstArticle.outerHTML.substring(0, 3000);
    }

    return result;
  });

  console.log('\n=== PAGE STRUCTURE ===\n');
  console.log(JSON.stringify(structure, null, 2));

  await browser.close();
}

const testUrl = process.argv[2] || 'https://www.hairrestorationnetwork.com/topic/57598-9-months-results-dr-taleb-barghouthi/';
debugHRNStructure(testUrl).catch(console.error);
