/**
 * Reddit subreddit scraper — CLI runner.
 * Scrapes configured subreddits and inserts posts into forum_thread_index + reddit_thread_content.
 * Does NOT do clinic attribution — run scripts/forum-attribute-threads.ts after this.
 *
 * Usage:
 *   npx tsx scripts/reddit-scrape-subreddits.ts
 *   npx tsx scripts/reddit-scrape-subreddits.ts --dry-run
 *   npx tsx scripts/reddit-scrape-subreddits.ts --subreddits HairTransplants,TurkeyHairTransplant
 *   npx tsx scripts/reddit-scrape-subreddits.ts --max-posts 50 --lookback-days 180
 */

import 'dotenv/config'
import { runRedditPipeline } from '../app/api/redditPipeline/redditPipeline'

// ── Parse CLI args ────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag)
  return i >= 0 ? args[i + 1] : undefined
}

const subredditsArg = getArg('--subreddits')
const maxPostsArg = getArg('--max-posts')
const lookbackArg = getArg('--lookback-days')

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Reddit subreddit scraper')
  console.log('========================')
  if (dryRun) console.log('[DRY RUN] No data will be written to the database.\n')

  const result = await runRedditPipeline({
    subreddits: subredditsArg ? subredditsArg.split(',').map(s => s.trim()) : undefined,
    maxPostsPerSubreddit: maxPostsArg ? parseInt(maxPostsArg) : undefined,
    lookbackDays: lookbackArg ? parseInt(lookbackArg) : undefined,
    dryRun,
  })

  console.log('\n── Results ──────────────────────────────────────────────────')
  console.log(`Subreddits processed:  ${result.subredditsProcessed.join(', ') || 'none'}`)
  console.log(`Posts found:           ${result.postsFound}`)
  console.log(`New threads inserted:  ${result.newThreadsInserted}`)
  console.log(`Signal rows inserted:  ${result.signalRowsInserted}`)

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`)
    result.errors.forEach(e => console.log(`  - ${e}`))
    process.exit(1)
  }

  if (!dryRun && result.newThreadsInserted > 0) {
    console.log('\nNext step: run attribution to match posts to clinics:')
    console.log('  npx tsx scripts/forum-attribute-threads.ts --source reddit')
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
