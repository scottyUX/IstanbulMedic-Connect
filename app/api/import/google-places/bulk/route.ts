// ============================================
// BULK IMPORT ENDPOINT
// app/api/import/google-places/bulk/route.ts
// ============================================

import { NextResponse } from 'next/server'

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
    const { imports } = body as {
      imports: Array<{
        clinicId: string
        googlePlacesData: GooglePlacesData
      }>
    }

    if (!imports || !Array.isArray(imports)) {
      return NextResponse.json(
        { error: 'Expected array of imports' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const importData of imports) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL}/api/import/google-places`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(importData)
          }
        )

        const result = await response.json()
        
        if (response.ok) {
          results.push({
            clinicId: importData.clinicId,
            placeId: importData.googlePlacesData.google_places.place_id,
            displayName: importData.googlePlacesData.google_places.display_name,
            ...result
          })
          console.log(
            `✅ [${results.length + errors.length}/${imports.length}] Successfully imported ${importData.googlePlacesData.google_places.display_name}`
          )
        } else {
          errors.push({
            clinicId: importData.clinicId,
            placeId: importData.googlePlacesData.google_places.place_id,
            displayName: importData.googlePlacesData.google_places.display_name,
            error: result.error
          })
          console.log(
            `❌ [${results.length + errors.length}/${imports.length}] Failed to import ${importData.googlePlacesData.google_places.display_name}: ${result.error}`
          )
        }

        // Add small delay between imports (optional)
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        errors.push({
          clinicId: importData.clinicId,
          placeId: importData.googlePlacesData?.google_places?.place_id,
          error: error.message
        })
        console.log(
          `❌ [${results.length + errors.length}/${imports.length}] Exception for clinic ${importData.clinicId}: ${error.message}`
        )
      }
    }

    // Summary
    console.log(
      `\n📊 Bulk import complete: ${results.length} succeeded, ${errors.length} failed out of ${imports.length} total`
    )

    return NextResponse.json({
      success: errors.length === 0,
      totalImports: imports.length,
      successfulImports: results.length,
      failedImports: errors.length,
      results,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}