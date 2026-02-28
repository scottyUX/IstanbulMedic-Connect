// ============================================
// SINGLE IMPORT ENDPOINT
// app/api/import/google-places/route.ts
// ============================================

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface GooglePlacesData {
  google_places: {
    place_id: string
    display_name: string
    formatted_address: string
    rating: number
    user_ratings_total: number
    website?: string
    phone?: string
    international_phone?: string
    location: {
      lat: number
      lng: number
    }
    address_components: any[]
    opening_hours?: any
    photos?: any[]
    reviews?: any[]
    types: string[]
  }
  extracted_claims: {
    identity?: {
      display_name_variants?: string[]
      legal_name?: string
    }
    contact?: {
      website_candidates?: string[]
      email_candidates?: string[]
      phone_candidates?: string[]
      whatsapp_candidates?: string[]
    }
    services?: {
      claimed?: string[]
      primary_service?: string
    }
    location?: {
      city?: string
      state?: string
      country?: string
      postal_code?: string
    }
    languages?: {
      claimed?: string[]
    }
    pricing?: {
      ranges?: any[]
    }
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { clinicId, googlePlacesData } = body as {
      clinicId: string
      googlePlacesData: GooglePlacesData
    }

    if (!clinicId || !googlePlacesData?.google_places) {
      return NextResponse.json(
        { error: 'Missing required fields: clinicId and googlePlacesData' },
        { status: 400 }
      )
    }

    const gp = googlePlacesData.google_places
    const claims = googlePlacesData.extracted_claims || {}

    // 1. Create source record
    const contentHash = generateContentHash(gp.place_id, new Date().toISOString())
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        source_type: 'registry',
        source_name: 'google_places',
        url: gp.website || `https://www.google.com/maps/place/?q=place_id:${gp.place_id}`,
        captured_at: new Date().toISOString(),
        content_hash: contentHash
      })
      .select()
      .single()

    if (sourceError) throw sourceError
    const sourceId = source.id

    // 2. Extract location details
    const locationDetails = extractLocationDetails(gp.address_components, claims.location)

    // 3. Update clinic record
    const { error: clinicError } = await supabase
      .from('clinics')
      .update({
        display_name: gp.display_name,
        legal_name: claims.identity?.legal_name || null,
        status: 'active',
        primary_city: locationDetails.city,
        primary_country: locationDetails.country,
        website_url: gp.website || claims.contact?.website_candidates?.[0] || null,
        whatsapp_contact: claims.contact?.whatsapp_candidates?.[0] || null,
        email_contact: claims.contact?.email_candidates?.[0] || null,
        phone_contact: gp.international_phone || gp.phone || claims.contact?.phone_candidates?.[0] || null,
        thumbnail_url: gp.photos?.[0] ? constructPhotoUrl(gp.photos[0]) : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', clinicId)

    if (clinicError) throw clinicError

    // 4. Upsert clinic location
    await supabase
      .from('clinic_locations')
      .delete()
      .eq('clinic_id', clinicId)

    const { error: locationError } = await supabase
      .from('clinic_locations')
      .insert({
        clinic_id: clinicId,
        location_name: 'Primary Location',
        address_line: gp.formatted_address,
        city: locationDetails.city,
        country: locationDetails.country,
        postal_code: locationDetails.postal_code || '00000',
        latitude: gp.location.lat,
        longitude: gp.location.lng,
        is_primary: true
      })

    if (locationError) throw locationError

    // 5. Insert/update services
    if (claims.services?.claimed && claims.services.claimed.length > 0) {
      await supabase
        .from('clinic_services')
        .delete()
        .eq('clinic_id', clinicId)

      const services = claims.services.claimed.map((service: string, idx: number) => {
        const mapped = mapServiceType(service)
        return {
          clinic_id: clinicId,
          service_category: mapped.category,
          service_name: mapped.name,
          is_primary_service: idx === 0
        }
      })

      const { error: servicesError } = await supabase
        .from('clinic_services')
        .insert(services)

      if (servicesError) throw servicesError
    }

    // 6. Store facts
    await upsertFact(clinicId, 'google_place_id', gp.place_id, 'string', sourceId)
    await upsertFact(clinicId, 'google_rating', gp.rating, 'number', sourceId)
    await upsertFact(clinicId, 'google_review_count', gp.user_ratings_total, 'number', sourceId)
    
    if (gp.opening_hours) {
      await upsertFact(clinicId, 'opening_hours', gp.opening_hours, 'json', sourceId)
    }

    // 7. Import reviews — upsert to avoid duplicate failures
    if (gp.reviews && gp.reviews.length > 0) {
      const reviews = gp.reviews.map((review: any) => ({
        clinic_id: clinicId,
        source_id: sourceId,
        rating: review.rating?.toString() || null,
        review_text: review.text || '',
        review_date: review.time ? new Date(review.time * 1000).toISOString().split('T')[0] : null,
        language: review.language || 'en'
      }))

      const { error: reviewsError } = await supabase
        .from('clinic_reviews')
        .upsert(reviews, {
          onConflict: 'clinic_id,review_text,review_date',
          ignoreDuplicates: true
        })

      if (reviewsError) console.error('Reviews insert failed:', reviewsError.message)
    }

    // 8. Store primary media — URL stored without API key, append key at display time on frontend
    if (gp.photos && gp.photos.length > 0) {
      const media = gp.photos.slice(0, 5).map((photo: any, idx: number) => ({
        clinic_id: clinicId,
        media_type: 'image',
        url: constructPhotoUrl(photo),
        is_primary: idx === 0,
        source_id: sourceId,
        display_order: idx
      }))

      await supabase.from('clinic_media').insert(media)
    }

    // 9. Store raw payload as source document
    await supabase.from('source_documents').insert({
      source_id: sourceId,
      doc_type: 'html',
      title: `Google Places Data - ${gp.display_name}`,
      raw_text: JSON.stringify(googlePlacesData),
      language: 'en',
      published_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      message: 'Google Places data imported successfully',
      clinic_id: clinicId,
      source_id: sourceId,
      place_id: gp.place_id,
      display_name: gp.display_name
    })

  } catch (error: any) {
    console.error('Error importing Google Places data:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to import Google Places data' },
      { status: 500 }
    )
  }
}

// Helper functions
async function upsertFact(
  clinicId: string,
  factKey: string,
  factValue: any,
  valueType: 'string' | 'number' | 'bool' | 'json',
  sourceId: string
) {
  const jsonValue = typeof factValue === 'object' 
    ? factValue 
    : { value: factValue }

  const { data: fact } = await supabase
    .from('clinic_facts')
    .upsert({
      clinic_id: clinicId,
      fact_key: factKey,
      fact_value: jsonValue,
      value_type: valueType,
      confidence: 1.0,
      computed_by: 'extractor',
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      is_conflicting: false
    }, {
      onConflict: 'clinic_id,fact_key'
    })
    .select()
    .single()

  if (fact) {
    const { data: sourceDoc } = await supabase
      .from('source_documents')
      .select('id')
      .eq('source_id', sourceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sourceDoc) {
      await supabase.from('fact_evidence').insert({
        clinic_fact_id: fact.id,
        source_document_id: sourceDoc.id,
        evidence_snippet: `Extracted from Google Places: ${factKey}`
      })
    }
  }
}

function extractLocationDetails(addressComponents: any[], claimsLocation?: any) {
  let city = claimsLocation?.city || ''
  let state = claimsLocation?.state || ''
  let country = claimsLocation?.country || ''
  let postal_code = claimsLocation?.postal_code || ''

  for (const component of addressComponents || []) {
    if (component.types.includes('locality') && !city) {
      city = component.long_name
    }
    if (component.types.includes('administrative_area_level_1') && !state) {
      state = component.long_name
    }
    if (component.types.includes('country') && !country) {
      country = component.long_name
    }
    if (component.types.includes('postal_code') && !postal_code) {
      postal_code = component.long_name
    }
  }

  return {
    city: city || state || 'Unknown',
    country: country || 'Unknown',
    postal_code
  }
}

function mapServiceType(serviceType: string): {
  category: 'Medical Tourism' | 'Cosmetic' | 'Dental' | 'Other'
  name: 'Hair Transplant' | 'Rhinoplasty' | 'Other'
} {
  const lower = serviceType.toLowerCase()
  
  if (lower.includes('hair') || lower.includes('transplant')) {
    return { category: 'Medical Tourism', name: 'Hair Transplant' }
  }
  if (lower.includes('nose') || lower.includes('rhino')) {
    return { category: 'Cosmetic', name: 'Rhinoplasty' }
  }
  if (lower.includes('dental') || lower.includes('teeth')) {
    return { category: 'Dental', name: 'Other' }
  }
  
  return { category: 'Other', name: 'Other' }
}

// Stores photo URL without API key — append key on frontend when displaying:
// const photoUrl = `${clinic.url}&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY}`
function constructPhotoUrl(photo: any): string {
  if (typeof photo === 'string') return photo
  if (photo.photo_reference) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}`
  }
  return ''
}

function generateContentHash(placeId: string, timestamp: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256')
    .update(`${placeId}-${timestamp}`)
    .digest('hex')
}