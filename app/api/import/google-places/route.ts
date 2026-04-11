// app/api/import/google-places/route.ts

import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// --- Types (unchanged from v1) ---

interface AddressComponent {
  long_name: string
  short_name: string
  types: string[]
}

interface Photo {
  photo_reference?: string
  height?: number
  width?: number
  html_attributions?: string[]
}

interface Review {
  rating?: number
  text?: string
  time?: number
  language?: string
}

interface OpeningHours {
  open_now?: boolean
  weekday_text?: string[]
  periods?: Array<{
    open: { day: number; time: string }
    close?: { day: number; time: string }
  }>
}

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
    location: { lat: number; lng: number }
    address_components: AddressComponent[]
    opening_hours?: OpeningHours
    photos?: (Photo | string)[]
    reviews?: Review[]
    types: string[]
  }
  extracted_claims: {
    identity?: { display_name_variants?: string[]; legal_name?: string }
    contact?: {
      website_candidates?: string[]
      email_candidates?: string[]
      phone_candidates?: string[]
      whatsapp_candidates?: string[]
    }
    services?: { claimed?: string[]; primary_service?: string }
    location?: { city?: string; state?: string; country?: string; postal_code?: string }
    languages?: { claimed?: string[] }
    pricing?: { ranges?: Array<{ min?: number; max?: number; currency?: string }> }
  }
}

// --- Photo helpers ---

/**
 * Fetches a Google photo by its reference and uploads it to Supabase Storage,
 * so no API key ever touches the database.
 * Returns the public Supabase URL, or null on failure.
 */
async function uploadPhotoToStorage(
  supabase: SupabaseClient<any>,
  photoReference: string,
  clinicId: string,
  index: number
): Promise<string | null> {
  const googleUrl =
    `https://maps.googleapis.com/maps/api/place/photo` +
    `?maxwidth=800&photo_reference=${photoReference}` +
    `&key=${process.env.GOOGLE_PLACES_API_KEY}`

  const res = await fetch(googleUrl)
  if (!res.ok) return null

  const buffer = await res.arrayBuffer()
  const path = `${clinicId}/${index}.jpg`

  const { error } = await supabase.storage
    .from('clinic-images')
    .upload(path, buffer, { contentType: 'image/jpeg', upsert: true })

  if (error) {
    console.error(`Photo upload failed (index ${index}):`, error.message)
    return null
  }

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/clinic-images/${path}`
}

/**
 * Resolves a photo entry to a safe Supabase Storage URL.
 * - If already a plain string URL (no API key risk), returns it as-is.
 * - If it has a photo_reference, uploads to storage first.
 */
async function resolvePhotoUrl(
  supabase: SupabaseClient<any>,
  photo: Photo | string,
  clinicId: string,
  index: number
): Promise<string | null> {
  if (typeof photo === 'string') return photo || null
  if (photo.photo_reference) {
    return uploadPhotoToStorage(supabase, photo.photo_reference, clinicId, index)
  }
  return null
}

// --- Main handler ---

export async function POST(request: Request) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  let sourceId: string | null = null
  let previousLocation: unknown[] = []

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body: expected JSON' }, { status: 400 })
  }

  try {
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

    // Upload primary photo first — we need the safe URL for thumbnail_url on the clinic record
    const thumbnailUrl = gp.photos?.[0]
      ? await resolvePhotoUrl(supabase, gp.photos[0], clinicId, 0)
      : null

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
    sourceId = source.id

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
        phone_contact:
          gp.international_phone ||
          gp.phone ||
          claims.contact?.phone_candidates?.[0] ||
          null,
        thumbnail_url: thumbnailUrl,   // safe Supabase Storage URL
        updated_at: new Date().toISOString()
      })
      .eq('id', clinicId)

    if (clinicError) throw clinicError

    // 4. Upsert clinic_google_places
    const { error: googlePlacesError } = await supabase
      .from('clinic_google_places')
      .upsert(
        {
          clinic_id: clinicId,
          place_id: gp.place_id,
          rating: gp.rating ?? null,
          user_ratings_total: gp.user_ratings_total ?? null,
          last_checked_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'clinic_id,place_id' }
      )

    if (googlePlacesError) throw googlePlacesError

    // 5. Replace clinic location (with best-effort rollback)
    const { data: savedLocation } = await supabase
      .from('clinic_locations')
      .select('clinic_id, location_name, address_line, city, country, postal_code, latitude, longitude, is_primary')
      .eq('clinic_id', clinicId)
    previousLocation = savedLocation || []

    await supabase.from('clinic_locations').delete().eq('clinic_id', clinicId)

    const { error: locationError } = await supabase.from('clinic_locations').insert({
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

    // 6. Replace services
    if (claims.services?.claimed && claims.services.claimed.length > 0) {
      await supabase.from('clinic_services').delete().eq('clinic_id', clinicId)

      const services = claims.services.claimed.map((service: string, idx: number) => {
        const mapped = mapServiceType(service)
        return {
          clinic_id: clinicId,
          service_category: mapped.category,
          service_name: mapped.name,
          is_primary_service: idx === 0
        }
      })

      const { error: servicesError } = await supabase.from('clinic_services').insert(services)
      if (servicesError) throw servicesError
    }

    // 7. Store raw payload (must precede upsertFact so evidence linking works)
    const { error: sourceDocError } = await supabase.from('source_documents').insert({
      source_id: sourceId,
      doc_type: 'html',
      title: `Google Places Data - ${gp.display_name}`,
      raw_text: JSON.stringify(googlePlacesData),
      language: 'en',
      published_at: new Date().toISOString()
    })

    if (sourceDocError) throw sourceDocError

    // 8. Facts, reviews, and remaining media in parallel
    const importReviews = async () => {
      if (!gp.reviews?.length) return

      const { data: existing } = await supabase
        .from('clinic_reviews')
        .select('review_text, review_date')
        .eq('clinic_id', clinicId)

      const existingSet = new Set(
        (existing || []).map(
          (r: { review_text: string; review_date: string | null }) =>
            `${r.review_date}::${r.review_text}`
        )
      )

      const newReviews = gp.reviews
        .filter(review => {
          const date = review.time
            ? new Date(review.time * 1000).toISOString().split('T')[0]
            : null
          return !existingSet.has(`${date}::${review.text || ''}`)
        })
        .map(review => ({
          clinic_id: clinicId,
          source_id: sourceId as string,
          rating: review.rating?.toString() || null,
          review_text: review.text || '',
          review_date: review.time
            ? new Date(review.time * 1000).toISOString().split('T')[0]
            : null,
          language: review.language || 'en'
        }))

      if (newReviews.length > 0) {
        await supabase.from('clinic_reviews').insert(newReviews)
      }
    }

    const importMedia = async () => {
      if (!gp.photos?.length) return

      // Primary photo already uploaded above; resolve the rest (indices 1–4)
      const remainingUrls = await Promise.all(
        gp.photos.slice(1, 5).map((photo, idx) =>
          resolvePhotoUrl(supabase, photo, clinicId, idx + 1)
        )
      )

      const media = [
        ...(thumbnailUrl
          ? [{ clinic_id: clinicId, media_type: 'image', url: thumbnailUrl, is_primary: true, source_id: sourceId, display_order: 0 }]
          : []),
        ...remainingUrls
          .map((url, idx) =>
            url
              ? { clinic_id: clinicId, media_type: 'image', url, is_primary: false, source_id: sourceId, display_order: idx + 1 }
              : null
          )
          .filter(Boolean)
      ]

      if (media.length > 0) {
        await supabase.from('clinic_media').insert(media)
      }
    }

    await Promise.all([
      upsertFact(supabase, clinicId, 'google_place_id', gp.place_id, 'string', sourceId!),
      upsertFact(supabase, clinicId, 'google_rating', gp.rating, 'number', sourceId!),
      upsertFact(supabase, clinicId, 'google_review_count', gp.user_ratings_total, 'number', sourceId!),
      ...(gp.opening_hours
        ? [upsertFact(supabase, clinicId, 'opening_hours', gp.opening_hours, 'json', sourceId!)]
        : []),
      importReviews(),
      importMedia()
    ])

    return NextResponse.json({
      success: true,
      message: 'Google Places data imported successfully',
      clinic_id: clinicId,
      source_id: sourceId,
      place_id: gp.place_id,
      display_name: gp.display_name
    })

  } catch (error: unknown) {
    console.error('Error importing Google Places data:', error)

    if (sourceId) {
      try { await supabase.from('sources').delete().eq('id', sourceId) } catch { /* best-effort */ }
    }
    if (previousLocation.length) {
      try { await supabase.from('clinic_locations').insert(previousLocation) } catch { /* best-effort */ }
    }

    const message =
      error instanceof Error
        ? error.message
        : (error as any)?.message ?? 'Failed to import Google Places data'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// --- Helpers ---

async function upsertFact(
  supabase: SupabaseClient,
  clinicId: string,
  factKey: string,
  factValue: string | number | boolean | Record<string, unknown> | OpeningHours,
  valueType: 'string' | 'number' | 'bool' | 'json',
  sourceId: string
) {
  const jsonValue = typeof factValue === 'object' ? factValue : { value: factValue }

  const { data: fact } = await supabase
    .from('clinic_facts')
    .upsert(
      {
        clinic_id: clinicId,
        fact_key: factKey,
        fact_value: jsonValue,
        value_type: valueType,
        confidence: 1.0,
        computed_by: 'extractor',
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        is_conflicting: false
      },
      { onConflict: 'clinic_id,fact_key' }
    )
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

function extractLocationDetails(
  addressComponents: AddressComponent[],
  claimsLocation?: GooglePlacesData['extracted_claims']['location']
) {
  let city = claimsLocation?.city || ''
  let state = claimsLocation?.state || ''
  let country = claimsLocation?.country || ''
  let postal_code = claimsLocation?.postal_code || ''

  for (const component of addressComponents || []) {
    if (component.types.includes('locality') && !city) city = component.long_name
    if (component.types.includes('administrative_area_level_1') && !state) state = component.long_name
    if (component.types.includes('country') && !country) country = component.long_name
    if (component.types.includes('postal_code') && !postal_code) postal_code = component.long_name
  }

  return { city: city || state || 'Unknown', country: country || 'Unknown', postal_code }
}

function mapServiceType(serviceType: string): {
  category: 'Medical Tourism' | 'Cosmetic' | 'Dental' | 'Other'
  name: 'Hair Transplant' | 'Rhinoplasty' | 'Other'
} {
  const lower = serviceType.toLowerCase()
  if (lower.includes('hair') || lower.includes('transplant')) return { category: 'Medical Tourism', name: 'Hair Transplant' }
  if (lower.includes('nose') || lower.includes('rhino')) return { category: 'Cosmetic', name: 'Rhinoplasty' }
  if (lower.includes('dental') || lower.includes('teeth')) return { category: 'Dental', name: 'Other' }
  return { category: 'Other', name: 'Other' }
}

function generateContentHash(placeId: string, timestamp: string): string {
  return crypto.createHash('sha256')
    .update(`${placeId}-${timestamp}`)
    .digest('hex')
}
