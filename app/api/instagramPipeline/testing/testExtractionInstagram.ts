// Unit tests for extractInstagramClaims
// Uses local data - no Apify API calls
import { extractInstagramClaims } from "../extractionInstagram";
import rawData from "./instagram-raw-data.json";

let result: ReturnType<typeof extractInstagramClaims>;
let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

try {
  result = extractInstagramClaims(rawData as any);
} catch (err: any) {
  console.error(`\n✗ extractInstagramClaims threw unexpectedly: ${err.message}`);
  process.exit(1);
}

console.log("\n── instagram (raw profile) ──");
assert(typeof result.instagram.id === "string" && result.instagram.id.length > 0, "id is present");
assert(typeof result.instagram.username === "string" && result.instagram.username.length > 0, "username is present");
assert(typeof result.instagram.biography === "string", "biography is a string");
assert(typeof result.instagram.followersCount === "number", "followersCount is a number");
assert(typeof result.instagram.postsCount === "number", "postsCount is a number");
assert(typeof result.instagram.verified === "boolean", "verified is a boolean");
assert(typeof result.instagram.isBusinessAccount === "boolean", "isBusinessAccount is a boolean");
assert(Array.isArray(result.instagram.externalUrls), "externalUrls is an array");

console.log("\n── extracted_claims.identity ──");
assert(Array.isArray(result.extracted_claims.identity.display_name_variants), "display_name_variants is an array");
assert(result.extracted_claims.identity.display_name_variants.length > 0, "display_name_variants has at least one entry");

console.log("\n── extracted_claims.social.instagram ──");
const social = result.extracted_claims.social.instagram;
assert(typeof social.handle === "string" && social.handle.length > 0, "handle is present");
assert(typeof social.profile_url === "string" && social.profile_url.startsWith("https://"), "profile_url is a valid URL");
assert(typeof social.profile_id === "string" && social.profile_id.length > 0, "profile_id is present");
assert(typeof social.is_verified === "boolean", "is_verified is a boolean");
assert(typeof social.is_business === "boolean", "is_business is a boolean");
assert(typeof social.is_private === "boolean", "is_private is a boolean");
assert(typeof social.followers_count === "number", "followers_count is a number");
assert(typeof social.follows_count === "number", "follows_count is a number");
assert(typeof social.posts_count === "number", "posts_count is a number");
assert(typeof social.highlights_count === "number", "highlights_count is a number");
assert(typeof social.igtv_count === "number", "igtv_count is a number");

console.log("\n── extracted_claims.contact ──");
const contact = result.extracted_claims.contact;
assert(Array.isArray(contact.website_candidates), "website_candidates is an array");
assert(
  contact.link_aggregator_detected === null || typeof contact.link_aggregator_detected === "string",
  "link_aggregator_detected is null or string"
);

console.log("\n── extracted_claims.services ──");
assert(Array.isArray(result.extracted_claims.services.claimed), "services.claimed is an array");

console.log("\n── extracted_claims.positioning ──");
assert(Array.isArray(result.extracted_claims.positioning.claims), "positioning.claims is an array");

console.log("\n── extracted_claims.languages ──");
assert(Array.isArray(result.extracted_claims.languages.claimed), "languages.claimed is an array");

console.log("\n── extracted_claims.geography ──");
assert(Array.isArray(result.extracted_claims.geography.claimed), "geography.claimed is an array");

console.log("\n── extracted_claims.posts ──");
assert(Array.isArray(result.extracted_claims.posts), "posts is an array");
if (result.extracted_claims.posts.length > 0) {
  const post = result.extracted_claims.posts[0];
  assert(typeof post.id === "string", "post.id is a string");
  assert(typeof post.url === "string", "post.url is a string");
  assert(typeof post.caption === "string", "post.caption is a string");
  assert(Array.isArray(post.hashtags), "post.hashtags is an array");
  assert(typeof post.likesCount === "number", "post.likesCount is a number");
  assert(typeof post.commentsCount === "number", "post.commentsCount is a number");
  assert(typeof post.firstComment === "string", "post.firstComment is a string");
  assert(Array.isArray(post.latestComments), "post.latestComments is an array");
  assert(typeof post.timestamp === "string", "post.timestamp is a string");
}

// Summary
console.log("\n══════════════════════════════");
console.log(`Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log("All tests passed.");
}
