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
    identity?: {
      display_name_variants?: string[]
    }
    social?: {
      instagram?: any
    }
    contact?: {
      website_candidates?: string[]
      link_aggregator_detected?: string
      address_text?: string
    }
    services?: {
      claimed?: string[]
    }
    positioning?: {
      claims?: string[]
    }
    languages?: {
      claimed?: string[]
    }
    geography?: {
      claimed?: string[]
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clinicId, instagramData } = body as {
      clinicId: string
      instagramData: InstagramClaimsData
    }

    if (!clinicId || !instagramData) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicId, instagramData' },
        { status: 400 }
      )
    }

    const results: any = {}

    // ============================================
    // 1. CREATE SOURCE RECORD
    // ============================================
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .upsert({
        source_type: 'social_media',
        source_name: 'Instagram',
        url: instagramData.instagram.inputUrl,
        captured_at: new Date().toISOString(),
        author_handle: instagramData.instagram.username,
        content_hash: `ig_${instagramData.instagram.username}_${instagramData.instagram.id}`
      }, {
        onConflict: 'content_hash'
      })
      .select()
      .single()

    if (sourceError) throw sourceError
    results.source = source

    // ============================================
    // 2. CREATE SOURCE DOCUMENT (RAW DATA)
    // ============================================
    const { data: document, error: documentError } = await supabase
      .from('source_documents')
      .insert({
        source_id: source.id,
        doc_type: 'post',
        title: `Instagram Profile Data - @${instagramData.instagram.username}`,
        raw_text: JSON.stringify(instagramData, null, 2),
        language: 'English',
        published_at: new Date().toISOString()
      })
      .select()
      .single()

    if (documentError) throw documentError
    results.document = document

    // ============================================
    // 3. UPSERT CLINIC_SOCIAL_MEDIA
    // ============================================
    const { data: socialMedia, error: socialMediaError } = await supabase
      .from('clinic_social_media')
      .upsert({
        clinic_id: clinicId,
        platform: 'instagram',
        account_handle: instagramData.instagram.username,
        follower_count: instagramData.instagram.followersCount,
        verified: instagramData.instagram.verified,
        last_checked_at: new Date().toISOString()
      }, {
        onConflict: 'clinic_id,platform,account_handle'
      })
      .select()
      .single()

    if (socialMediaError) throw socialMediaError
    results.socialMedia = socialMedia


    // ============================================
    // 4. EXTRACT AND INSERT CLINIC FACTS
    // ============================================
    const facts = []

    // Instagram followers count
    facts.push({
      clinic_id: clinicId,
      fact_key: 'instagram_followers_count',
      fact_value: instagramData.instagram.followersCount,
      value_type: 'number',
      confidence: 1.0,
      computed_by: 'extractor',
      is_conflicting: false,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })

    // Instagram posts count
    facts.push({
      clinic_id: clinicId,
      fact_key: 'instagram_posts_count',
      fact_value: instagramData.instagram.postsCount,
      value_type: 'number',
      confidence: 1.0,
      computed_by: 'extractor',
      is_conflicting: false,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })

    // Instagram verification status
    facts.push({
      clinic_id: clinicId,
      fact_key: 'instagram_verified',
      fact_value: instagramData.instagram.verified,
      value_type: 'bool',
      confidence: 1.0,
      computed_by: 'extractor',
      is_conflicting: false,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })

    // Business account status
    facts.push({
      clinic_id: clinicId,
      fact_key: 'instagram_is_business',
      fact_value: instagramData.instagram.isBusinessAccount,
      value_type: 'bool',
      confidence: 1.0,
      computed_by: 'extractor',
      is_conflicting: false,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString()
    })

    // Biography/positioning claims
    if (instagramData.extracted_claims.positioning?.claims) {
      facts.push({
        clinic_id: clinicId,
        fact_key: 'instagram_positioning_claims',
        fact_value: JSON.stringify(instagramData.extracted_claims.positioning.claims),
        value_type: 'json',
        confidence: 0.85,
        computed_by: 'extractor',
        is_conflicting: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
    }

    // Website URL from external links
    if (instagramData.instagram.externalUrls && instagramData.instagram.externalUrls.length > 0) {
      const cleanUrl = instagramData.instagram.externalUrls[0]
      facts.push({
        clinic_id: clinicId,
        fact_key: 'website_url_from_instagram',
        fact_value: JSON.stringify(cleanUrl),
        value_type: 'string',
        confidence: 0.90,
        computed_by: 'extractor',
        is_conflicting: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
    }

    // Services claimed
    if (instagramData.extracted_claims.services?.claimed) {
      facts.push({
        clinic_id: clinicId,
        fact_key: 'services_claimed_instagram',
        fact_value: JSON.stringify(instagramData.extracted_claims.services.claimed),
        value_type: 'json',
        confidence: 0.80,
        computed_by: 'extractor',
        is_conflicting: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
    }

    // Geographic location
    if (instagramData.extracted_claims.geography?.claimed) {
      facts.push({
        clinic_id: clinicId,
        fact_key: 'geographic_location_instagram',
        fact_value: JSON.stringify(instagramData.extracted_claims.geography.claimed),
        value_type: 'json',
        confidence: 0.75,
        computed_by: 'extractor',
        is_conflicting: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
    }

    // Address text
    if (instagramData.extracted_claims.contact?.address_text) {
      facts.push({
        clinic_id: clinicId,
        fact_key: 'address_from_instagram',
        fact_value: JSON.stringify(instagramData.extracted_claims.contact.address_text),
        value_type: 'string',
        confidence: 0.85,
        computed_by: 'extractor',
        is_conflicting: false,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString()
      })
    }

    // Insert all facts
    const { data: insertedFacts, error: factsError } = await supabase
      .from('clinic_facts')
      .upsert(facts, {
        onConflict: 'clinic_id,fact_key',
        ignoreDuplicates: false
      })
      .select()

    if (factsError) throw factsError
    results.facts = insertedFacts

    // ============================================
    // 5. LINK EVIDENCE TO FACTS
    // ============================================
    const evidenceRecords = insertedFacts?.map(fact => ({
      clinic_fact_id: fact.id,
      source_document_id: document.id,
      evidence_snippet: getEvidenceSnippet(fact.fact_key, instagramData),
      evidence_locator: getEvidenceLocator(fact.fact_key)
    })) || []

    if (evidenceRecords.length > 0) {
      const { data: evidence, error: evidenceError } = await supabase
        .from('fact_evidence')
        .insert(evidenceRecords)
        .select()

      if (evidenceError) throw evidenceError
      results.evidence = evidence
    }

    // ============================================
    // 6. UPDATE CLINIC RECORD (if website found)
    // ============================================
    if (instagramData.instagram.externalUrls && instagramData.instagram.externalUrls.length > 0) {
      const websiteUrl = instagramData.instagram.externalUrls[0]
      
      // Only update if clinic doesn't already have a website
      const { data: existingClinic } = await supabase
        .from('clinics')
        .select('website_url')
        .eq('id', clinicId)
        .single()

      if (existingClinic && !existingClinic.website_url) {
        const { data: updatedClinic, error: clinicError } = await supabase
          .from('clinics')
          .update({ website_url: websiteUrl })
          .eq('id', clinicId)
          .select()
          .single()

        if (!clinicError) {
          results.clinicUpdated = updatedClinic
        }
      }
    }

   

    return NextResponse.json({
      success: true,
      message: 'Instagram data imported successfully',
      summary: {
        sourceCreated: !!source,
        documentCreated: !!document,
        socialMediaUpdated: !!socialMedia,
        factsCreated: insertedFacts?.length || 0,
        evidenceLinked: evidenceRecords.length
      },
      results
    })

  } catch (error: any) {
    console.error('Instagram import error:', error)
    return NextResponse.json(
      { 
        error: error.message,
        details: error 
      },
      { status: 500 }
    )
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getEvidenceSnippet(factKey: string, data: InstagramClaimsData): string {
  const snippets: Record<string, string> = {
    'instagram_followers_count': `Followers: ${data.instagram.followersCount}`,
    'instagram_posts_count': `Posts: ${data.instagram.postsCount}`,
    'instagram_verified': `Verified: ${data.instagram.verified}`,
    'instagram_is_business': `Business Account: ${data.instagram.isBusinessAccount}`,
    'instagram_positioning_claims': `Claims: ${data.extracted_claims.positioning?.claims?.join(', ') || 'none'}`,
    'website_url_from_instagram': `External URL: ${data.instagram.externalUrls?.[0] || 'none'}`,
    'services_claimed_instagram': `Services: ${data.extracted_claims.services?.claimed?.join(', ') || 'none'}`,
    'geographic_location_instagram': `Location: ${data.extracted_claims.geography?.claimed?.join(', ') || 'none'}`,
    'address_from_instagram': `Address: ${data.extracted_claims.contact?.address_text || 'none'}`
  }

  return snippets[factKey] || `Data from Instagram profile @${data.instagram.username}`
}

function getEvidenceLocator(factKey: string): any {
  const locators: Record<string, any> = {
    'instagram_followers_count': { field: 'instagram.followersCount' },
    'instagram_posts_count': { field: 'instagram.postsCount' },
    'instagram_verified': { field: 'instagram.verified' },
    'instagram_is_business': { field: 'instagram.isBusinessAccount' },
    'instagram_positioning_claims': { field: 'extracted_claims.positioning.claims' },
    'website_url_from_instagram': { field: 'instagram.externalUrls[0]' },
    'services_claimed_instagram': { field: 'extracted_claims.services.claimed' },
    'geographic_location_instagram': { field: 'extracted_claims.geography.claimed' },
    'address_from_instagram': { field: 'extracted_claims.contact.address_text' }
  }

  return locators[factKey] || { field: 'unknown' }
}
