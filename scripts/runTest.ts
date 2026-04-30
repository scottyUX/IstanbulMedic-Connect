/**
 * Simple test runner for the HRN scraper
 * Run with: npx tsx scripts/runTest.ts [optional-thread-url]
 */

import { testScrapeThread } from '../app/api/hrnPipeline/hrnScraperTest';

const testUrl = process.argv[2];
testScrapeThread(testUrl)
  .then(() => {
    console.log('\nTest complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });
