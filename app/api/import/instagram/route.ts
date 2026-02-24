// ============================================
// Instagram Extracted Claims Import Endpoint
// app/api/import/instagram/route.ts
// ============================================

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ── Types ────────────────────────────────────────────────────────────────────

interface CommentReply {
  id: string
  text: string
  ownerUsername: string
  timestamp: string
  likesCount: number
  repliesCount: number
  replies: CommentReply[]
}

interface InstagramComment {
  id: string
  text: string
  ownerUsername: string
  ownerProfilePicUrl?: string
  timestamp: string
  likesCount: number
  repliesCount: number
  replies: CommentReply[]
}

interface InstagramPost {
  id: string
  type: string
  shortCode: string
  url: string
  caption: string
  hashtags: string[]
  mentions: string[]
  likesCount: number
  commentsCount: number
  firstComment: string
  latestComments: InstagramComment[]
  timestamp: string
  displayUrl: string
}

interface InstagramClaimsData {
  instagram: {
    inputUrl: string
    id: string
    username: string
    fullName: string
    biography: string
    externalUrls: string[]
    followersCount: number
    postsCount: number
    verified: boolean
    isBusinessAccount: boolean
    businessCategoryName: string
  }
  extracted_claims: {
    identity?: { display_name_variants?: string[] }
    social?: { instagram?: any }
    contact?: {
      website_candidates?: string[]
      link_aggregator_detected?: string
      address_text?: string
    }
    services?: { claimed?: string[] }
    positioning?: { claims?: string[] }
    languages?: { claimed?: string[] }
    geography?: { claimed?: string[] }
  }
  posts?: InstagramPost[]
}

interface ClinicFact {
  id: string
  clinic_id: string
  fact_key: string
  fact_value: any
  value_type: string
  confidence: number
  computed_by: string
  is_conflicting: boolean
  first_seen_at: string
  last_seen_at: string
}

// ── Comment helpers ───────────────────────────────────────────────────────────

/**
 * Strips PII-heavy fields (profile pic URLs) from comments before storage,
 * keeping only the data useful for analysis.
 */
function sanitiseComment(c: InstagramComment) {
  return {
    id: c.id,
    text: c.text,
    ownerUsername: c.ownerUsername,
    timestamp: c.timestamp,
    likesCount: c.likesCount ?? 0,
    repliesCount: c.repliesCount ?? 0,
    replies: (c.replies ?? []).map(r => ({
      id: r.id,
      text: r.text,
      ownerUsername: r.ownerUsername,
      timestamp: r.timestamp,
      likesCount: r.likesCount ?? 0,
    })),
  }
}

// ── Post analysis helpers ─────────────────────────────────────────────────────

function derivePostFacts(posts: InstagramPost[], clinicId: string) {
  if (!posts?.length) return []

  const facts = []
  const now = new Date().toISOString()

  // --- Engagement stats ---
  const totalLikes    = posts.reduce((s, p) => s + (p.likesCount    ?? 0), 0)
  const totalComments = posts.reduce((s, p) => s + (p.commentsCount ?? 0), 0)
  const avgLikes      = Math.round(totalLikes    / posts.length)
  const avgComments   = Math.round(totalComments / posts.length)

  facts.push({
    clinic_id: clinicId, fact_key: 'instagram_avg_likes_per_post',
    fact_value: avgLikes, value_type: 'number',
    confidence: 1.0, computed_by: 'extractor', is_conflicting: false,
    first_seen_at: now, last_seen_at: now,
  })
  facts.push({
    clinic_id: clinicId, fact_key: 'instagram_avg_comments_per_post',
    fact_value: avgComments, value_type: 'number',
    confidence: 1.0, computed_by: 'extractor', is_conflicting: false,
    first_seen_at: now, last_seen_at: now,
  })

  // --- Top hashtags ---
  const hashtagFreq: Record<string, number> = {}
  for (const post of posts)
    for (const tag of post.hashtags ?? []) {
      const t = tag.toLowerCase()
      hashtagFreq[t] = (hashtagFreq[t] || 0) + 1
    }

  const topHashtags = Object.entries(hashtagFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag, count]) => ({ tag, count }))

  if (topHashtags.length)
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_top_hashtags',
      fact_value: JSON.stringify(topHashtags), value_type: 'json',
      confidence: 0.9, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  // --- Inferred services ---
  const serviceKeywords: Record<string, string[]> = {
    hair_transplant:  ['hairtransplant', 'hairtransplantation', 'fuemethod', 'fuetechnique', 'hairclinic'],
    rhinoplasty:      ['rhinoplasty', 'nosesurgery', 'nosereconstruction'],
    dental:           ['dentistry', 'dentalimplants', 'hollywoodsmile', 'fastandfixed'],
    bariatric:        ['bariatricsurgery', 'gastricbypass', 'sleevegastrectomy'],
    eye_surgery:      ['lasiksurgery', 'lasereyesurgery', 'cataractsurgery'],
    plastic_surgery:  ['plasticsurgery', 'blepharoplasty', 'eyelidsurgery', 'rhinoplasty', 'breastlift'],
  }

  const allTags = new Set(Object.keys(hashtagFreq))
  const inferredServices = Object.entries(serviceKeywords)
    .filter(([, kw]) => kw.some(k => allTags.has(k)))
    .map(([svc]) => svc)

  if (inferredServices.length)
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_inferred_services',
      fact_value: JSON.stringify(inferredServices), value_type: 'json',
      confidence: 0.7, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  // --- Most recent post date ---
  const sortedDates = posts.map(p => p.timestamp).filter(Boolean).sort().reverse()
  if (sortedDates[0])
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_last_post_at',
      fact_value: JSON.stringify(sortedDates[0]), value_type: 'string',
      confidence: 1.0, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  // --- Website mentions in captions ---
  const websitePattern = /(?:https?:\/\/)?(?:www\.)?([\w-]+\.(?:com|net|org|co\.[a-z]{2})(?:\/\S*)?)/gi
  const captionUrls = new Set<string>()
  for (const post of posts)
    for (const m of post.caption?.matchAll(websitePattern) ?? [])
      captionUrls.add(m[0])

  if (captionUrls.size)
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_website_mentions_in_posts',
      fact_value: JSON.stringify([...captionUrls]), value_type: 'json',
      confidence: 0.75, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  // --- Top 5 posts by likes ---
  const topPosts = [...posts]
    .sort((a, b) => (b.likesCount ?? 0) - (a.likesCount ?? 0))
    .slice(0, 5)
    .map(p => ({ url: p.url, caption: p.caption?.slice(0, 300), likes: p.likesCount }))

  if (topPosts.length)
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_top_posts_sample',
      fact_value: JSON.stringify(topPosts), value_type: 'json',
      confidence: 1.0, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  // --- Comment sentiment sample (top-commented posts) ---
  // Stores a compact sample of comments from the most-commented posts
  // for downstream LLM sentiment / moderation analysis.
  const topCommentedPosts = [...posts]
    .filter(p => p.latestComments?.length)
    .sort((a, b) => (b.commentsCount ?? 0) - (a.commentsCount ?? 0))
    .slice(0, 5)
    .map(p => ({
      postUrl: p.url,
      commentsCount: p.commentsCount,
      comments: p.latestComments.map(sanitiseComment),
    }))

  if (topCommentedPosts.length)
    facts.push({
      clinic_id: clinicId, fact_key: 'instagram_top_commented_posts_sample',
      fact_value: JSON.stringify(topCommentedPosts), value_type: 'json',
      confidence: 1.0, computed_by: 'extractor', is_conflicting: false,
      first_seen_at: now, last_seen_at: now,
    })

  return facts
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clinicId, instagramData } = body as {
      clinicId: string
      instagramData: InstagramClaimsData
    }

    if (!clinicId || !instagramData)
      return NextResponse.json(
        { error: 'Missing required fields: clinicId, instagramData' },
        { status: 400 }
      )

    const results: any = {}

    // ── 1. Source record ──────────────────────────────────────────────────────
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .upsert({
        source_type: 'social_media',
        source_name: 'Instagram',
        url: instagramData.instagram.inputUrl,
        captured_at: new Date().toISOString(),
        author_handle: instagramData.instagram.username,
        content_hash: `ig_${instagramData.instagram.username}_${instagramData.instagram.id}`,
      }, { onConflict: 'content_hash' })
      .select()
      .single()

    if (sourceError) throw sourceError
    results.source = source

    // ── 2. Source document (raw) ──────────────────────────────────────────────
    const { data: document, error: documentError } = await supabase
      .from('source_documents')
      .insert({
        source_id: source.id,
        doc_type: 'post',
        title: `Instagram Profile Data - @${instagramData.instagram.username}`,
        raw_text: JSON.stringify(instagramData, null, 2),
        language: 'English',
        published_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (documentError) throw documentError
    results.document = document

    // ── 3. clinic_social_media ────────────────────────────────────────────────
    const igProfile = instagramData.extracted_claims.social?.instagram
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('clinic_social_media')
      .upsert({
        clinic_id: clinicId,
        platform: 'instagram',
        account_handle: instagramData.instagram.username,
        follower_count: instagramData.instagram.followersCount,
        verified: instagramData.instagram.verified,
        last_checked_at: new Date().toISOString(),
        follows_count: igProfile?.follows_count ?? null,
        posts_count: igProfile?.posts_count ?? instagramData.instagram.postsCount,
        highlights_count: igProfile?.highlights_count ?? null,
        is_private: igProfile?.is_private ?? false,
        business_category: instagramData.instagram.businessCategoryName ?? null,
      }, { onConflict: 'clinic_id,platform,account_handle' })
      .select()
      .single()

    if (socialMediaError) throw socialMediaError
    results.socialMedia = socialMedia

    // ── 4. Clinic facts ───────────────────────────────────────────────────────
    const now = new Date().toISOString()
    const baseFact = (key: string, value: any, type: string, confidence: number) => ({
      clinic_id: clinicId,
      fact_key: key,
      fact_value: value,
      value_type: type,
      confidence,
      computed_by: 'extractor',
      is_conflicting: false,
      first_seen_at: now,
      last_seen_at: now,
    })

    const facts: any[] = [
      baseFact('instagram_followers_count', instagramData.instagram.followersCount, 'number', 1.0),
      baseFact('instagram_posts_count',     instagramData.instagram.postsCount,     'number', 1.0),
      baseFact('instagram_verified',        instagramData.instagram.verified,        'bool',   1.0),
      baseFact('instagram_is_business',     instagramData.instagram.isBusinessAccount, 'bool', 1.0),
    ]

    if (instagramData.extracted_claims.positioning?.claims)
      facts.push(baseFact('instagram_positioning_claims',
        JSON.stringify(instagramData.extracted_claims.positioning.claims), 'json', 0.85))

    if (instagramData.instagram.externalUrls?.length)
      facts.push(baseFact('website_url_from_instagram',
        JSON.stringify(instagramData.instagram.externalUrls[0]), 'string', 0.90))

    if (instagramData.extracted_claims.services?.claimed)
      facts.push(baseFact('services_claimed_instagram',
        JSON.stringify(instagramData.extracted_claims.services.claimed), 'json', 0.80))

    if (instagramData.extracted_claims.geography?.claimed)
      facts.push(baseFact('geographic_location_instagram',
        JSON.stringify(instagramData.extracted_claims.geography.claimed), 'json', 0.75))

    if (instagramData.extracted_claims.contact?.address_text)
      facts.push(baseFact('address_from_instagram',
        JSON.stringify(instagramData.extracted_claims.contact.address_text), 'string', 0.85))

    if (instagramData.extracted_claims.contact?.link_aggregator_detected)
      facts.push(baseFact('link_aggregator_detected_instagram',
        JSON.stringify(instagramData.extracted_claims.contact.link_aggregator_detected), 'string', 1.0))

    if (instagramData.extracted_claims.identity?.display_name_variants?.length)
      facts.push(baseFact('display_name_variants_instagram',
        JSON.stringify(instagramData.extracted_claims.identity.display_name_variants), 'json', 0.9))

    const postFacts = derivePostFacts(instagramData.posts ?? [], clinicId)
    facts.push(...postFacts)

    // ── 4b. Upsert instagram posts (now with comments) ────────────────────────
    let upsertedPosts: any[] = []
    if (instagramData.posts?.length) {
      const postRows = instagramData.posts.map(p => ({
        clinic_id:          clinicId,
        source_id:          source.id,
        instagram_post_id:  p.id,
        short_code:         p.shortCode,
        post_type:          p.type as 'Image' | 'Video' | 'Sidecar',
        url:                p.url,
        caption:            p.caption ?? null,
        hashtags:           (p.hashtags ?? []).map((t: string) => t.toLowerCase()),
        likes_count:        p.likesCount    ?? 0,
        comments_count:     p.commentsCount ?? 0,
        // ── new comment fields ──
        first_comment_text: p.firstComment?.trim() || null,
        comments_data:      (p.latestComments ?? []).map(sanitiseComment),
        // ────────────────────────
        posted_at:          p.timestamp ?? null,
      }))

      const { data: posts, error: postsError } = await supabase
        .from('clinic_instagram_posts')
        .upsert(postRows, { onConflict: 'clinic_id,instagram_post_id' })
        .select()

      if (postsError) throw postsError
      upsertedPosts = posts ?? []
      results.posts = upsertedPosts
    }

    // ── 5. Upsert facts ───────────────────────────────────────────────────────
    const { data: insertedFacts, error: factsError } = await supabase
      .rpc('upsert_clinic_facts', { facts_data: facts })

    if (factsError) throw factsError
    results.facts = insertedFacts

    // ── 6. Link evidence to facts ─────────────────────────────────────────────
    const evidenceRecords = insertedFacts?.map((fact: ClinicFact) => ({
      clinic_fact_id:      fact.id,
      source_document_id:  document.id,
      evidence_snippet:    getEvidenceSnippet(fact.fact_key, instagramData),
      evidence_locator:    getEvidenceLocator(fact.fact_key),
    })) || []

    if (evidenceRecords.length) {
      const { data: evidence, error: evidenceError } = await supabase
        .from('fact_evidence')
        .insert(evidenceRecords)
        .select()
      if (evidenceError) throw evidenceError
      results.evidence = evidence
    }

    // ── 7. Update clinic website if missing ───────────────────────────────────
    if (instagramData.instagram.externalUrls?.length) {
      const websiteUrl = instagramData.instagram.externalUrls[0]
      const { data: existingClinic } = await supabase
        .from('clinics').select('website_url').eq('id', clinicId).single()

      if (existingClinic && !existingClinic.website_url) {
        const { data: updatedClinic, error: clinicError } = await supabase
          .from('clinics').update({ website_url: websiteUrl }).eq('id', clinicId).select().single()
        if (!clinicError) results.clinicUpdated = updatedClinic
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Instagram data imported successfully',
      summary: {
        sourceCreated:       !!source,
        documentCreated:     !!document,
        socialMediaUpdated:  !!socialMedia,
        factsCreated:        insertedFacts?.length || 0,
        postFactsCreated:    postFacts.length,
        postsUpserted:       upsertedPosts.length,
        evidenceLinked:      evidenceRecords.length,
      },
      results,
    })

  } catch (error: any) {
    console.error('Instagram import error:', error)
    return NextResponse.json({ error: error.message, details: error }, { status: 500 })
  }
}

// ── Evidence helpers ──────────────────────────────────────────────────────────

function getEvidenceSnippet(factKey: string, data: InstagramClaimsData): string {
  const posts = data.posts ?? []
  const snippets: Record<string, string> = {
    instagram_followers_count:            `Followers: ${data.instagram.followersCount}`,
    instagram_posts_count:                `Posts: ${data.instagram.postsCount}`,
    instagram_verified:                   `Verified: ${data.instagram.verified}`,
    instagram_is_business:                `Business Account: ${data.instagram.isBusinessAccount}`,
    instagram_positioning_claims:         `Claims: ${data.extracted_claims.positioning?.claims?.join(', ') || 'none'}`,
    website_url_from_instagram:           `External URL: ${data.instagram.externalUrls?.[0] || 'none'}`,
    services_claimed_instagram:           `Services: ${data.extracted_claims.services?.claimed?.join(', ') || 'none'}`,
    geographic_location_instagram:        `Location: ${data.extracted_claims.geography?.claimed?.join(', ') || 'none'}`,
    address_from_instagram:               `Address: ${data.extracted_claims.contact?.address_text || 'none'}`,
    link_aggregator_detected_instagram:   `Link aggregator: ${data.extracted_claims.contact?.link_aggregator_detected || 'none'}`,
    display_name_variants_instagram:      `Name variants: ${data.extracted_claims.identity?.display_name_variants?.join(', ') || 'none'}`,
    instagram_avg_likes_per_post:         `Computed from ${posts.length} posts`,
    instagram_avg_comments_per_post:      `Computed from ${posts.length} posts`,
    instagram_top_hashtags:               `Aggregated from ${posts.length} post captions`,
    instagram_inferred_services:          `Inferred from hashtag frequency across ${posts.length} posts`,
    instagram_last_post_at:               `Most recent of ${posts.length} posts`,
    instagram_website_mentions_in_posts:  `Extracted from post captions`,
    instagram_top_posts_sample:           `Top 5 posts by likes from profile`,
    instagram_top_commented_posts_sample: `Top 5 posts by comment count — includes full latestComments`,
  }
  return snippets[factKey] ?? `Data from Instagram profile @${data.instagram.username}`
}

function getEvidenceLocator(factKey: string): any {
  const locators: Record<string, any> = {
    instagram_followers_count:            { field: 'instagram.followersCount' },
    instagram_posts_count:                { field: 'instagram.postsCount' },
    instagram_verified:                   { field: 'instagram.verified' },
    instagram_is_business:                { field: 'instagram.isBusinessAccount' },
    instagram_positioning_claims:         { field: 'extracted_claims.positioning.claims' },
    website_url_from_instagram:           { field: 'instagram.externalUrls[0]' },
    services_claimed_instagram:           { field: 'extracted_claims.services.claimed' },
    geographic_location_instagram:        { field: 'extracted_claims.geography.claimed' },
    address_from_instagram:               { field: 'extracted_claims.contact.address_text' },
    link_aggregator_detected_instagram:   { field: 'extracted_claims.contact.link_aggregator_detected' },
    display_name_variants_instagram:      { field: 'extracted_claims.identity.display_name_variants' },
    instagram_avg_likes_per_post:         { field: 'posts[*].likesCount', derived: true },
    instagram_avg_comments_per_post:      { field: 'posts[*].commentsCount', derived: true },
    instagram_top_hashtags:               { field: 'posts[*].hashtags', derived: true },
    instagram_inferred_services:          { field: 'posts[*].hashtags', derived: true },
    instagram_last_post_at:               { field: 'posts[*].timestamp', derived: true },
    instagram_website_mentions_in_posts:  { field: 'posts[*].caption', derived: true },
    instagram_top_posts_sample:           { field: 'posts[*]', derived: true },
    instagram_top_commented_posts_sample: { field: 'posts[*].latestComments', derived: true },
  }
  return locators[factKey] ?? { field: 'unknown' }
}