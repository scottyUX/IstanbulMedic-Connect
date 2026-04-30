/**
 * Script to investigate HRN forum listing structure
 */

import { chromium } from 'playwright';

async function investigateForum(forumUrl: string) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  console.log('Fetching:', forumUrl);
  await page.goto(forumUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const info = await page.evaluate(() => {
    const pageText = document.body.innerText;

    // Look for topic/post count mentions
    const topicMatch = pageText.match(/([\d,]+)\s*topics?/i);
    const postMatch = pageText.match(/([\d,]+)\s*posts?/i);

    // Get all thread links - strip /page/X/ to get base URLs only
    const allLinks = Array.from(document.querySelectorAll('a[href*="/topic/"]'));
    const threadUrls = [...new Set(allLinks.map(a => {
      const href = a.getAttribute('href') || '';
      // Remove query params, hash, and /page/X/ suffix
      return href.split('?')[0].split('#')[0].replace(/\/page\/\d+\/?$/, '/');
    }).filter(url => url.includes('/topic/')))];

    // Check for subforums (child forums)
    const subforumLinks = Array.from(document.querySelectorAll('li[data-forumid] a, .cForumRow a, [data-forumid] a'));
    const subforums = subforumLinks
      .map(a => ({
        text: a.textContent?.trim(),
        href: a.getAttribute('href')
      }))
      .filter(f => f.href && f.href.includes('/forum/') && f.text && f.text.length > 3);

    // Look for pagination - try multiple selectors
    const paginationEl = document.querySelector('.ipsPagination');
    let maxPage = 1;

    // Try last page link
    const lastPageLink = document.querySelector('.ipsPagination_last a');
    if (lastPageLink) {
      const href = lastPageLink.getAttribute('href') || '';
      const match = href.match(/page\/(\d+)/);
      if (match) maxPage = parseInt(match[1]);
    }

    // Fallback: look at all pagination page links
    if (maxPage === 1) {
      const pageLinks = Array.from(document.querySelectorAll('.ipsPagination_page a, [data-page]'));
      pageLinks.forEach(link => {
        const href = link.getAttribute('href') || '';
        const dataPage = link.getAttribute('data-page');
        const match = href.match(/page\/(\d+)/) || (dataPage ? [null, dataPage] : null);
        if (match && parseInt(match[1]) > maxPage) {
          maxPage = parseInt(match[1]);
        }
      });
    }

    // Also grab the pagination HTML for debugging
    const paginationHtml = paginationEl?.innerHTML?.slice(0, 500) || 'none';

    // Unique subforums
    const uniqueSubforums = [...new Map(subforums.map(s => [s.href, s])).values()];

    return {
      topicCount: topicMatch ? topicMatch[1] : 'not found',
      postCount: postMatch ? postMatch[1] : 'not found',
      threadUrlsFound: threadUrls.length,
      sampleUrls: threadUrls.slice(0, 10),
      subforums: uniqueSubforums.slice(0, 20),
      hasPagination: paginationEl !== null,
      maxPage,
      paginationHtml,
    };
  });

  console.log('\n=== Forum Analysis ===\n');
  console.log('Topic count:', info.topicCount);
  console.log('Post count:', info.postCount);
  console.log('Unique thread URLs on this page:', info.threadUrlsFound);
  console.log('Has pagination:', info.hasPagination);
  console.log('Max page detected:', info.maxPage);
  if (info.maxPage === 1 && info.hasPagination) {
    console.log('Pagination HTML (debug):', info.paginationHtml);
  }

  if (info.subforums.length > 0) {
    console.log('\nSubforums found:', info.subforums.length);
    info.subforums.forEach(sf => console.log('  -', sf.text, '\n    ', sf.href));
  }

  console.log('\nSample thread URLs:');
  info.sampleUrls.forEach(url => console.log(' ', url));

  await browser.close();
  return info;
}

// Run on our target forums
async function main() {
  const forums = [
    'https://www.hairrestorationnetwork.com/forum/24-hair-transplant-reviews/',
    'https://www.hairrestorationnetwork.com/forum/17-results-posted-by-leading-hair-restoration-clinics/',
    'https://www.hairrestorationnetwork.com/forum/89-hair-transplant-repairs/',
  ];

  for (const forum of forums) {
    console.log('\n' + '='.repeat(60));
    await investigateForum(forum);
  }
}

main().catch(console.error);
