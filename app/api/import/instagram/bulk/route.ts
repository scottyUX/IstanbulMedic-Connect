import { NextResponse } from 'next/server'

// ============================================
// BULK IMPORT ENDPOINT
// app/api/import/instagram/bulk/route.ts
// ============================================


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
    const { imports } = body as {
      imports: Array<{
        clinicId: string
        instagramData: InstagramClaimsData
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
          `${process.env.NEXT_PUBLIC_APP_URL}/api/import/instagram`,
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
            username: importData.instagramData.instagram.username,
            ...result
          })
          console.log(`✅ [${results.length + errors.length}/${imports.length}] Successfully imported @${importData.instagramData.instagram.username}`)



        } else {
          errors.push({
            clinicId: importData.clinicId,
            username: importData.instagramData.instagram.username,
            error: result.error
          })
          console.log(`❌ [${results.length + errors.length}/${imports.length}] Failed to import @${importData.instagramData.instagram.username}: ${result.error}`)
        }

        // Add small delay between imports (optional)
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error: any) {
        errors.push({
          clinicId: importData.clinicId,
          error: error.message
        })
        console.log(`❌ [${results.length + errors.length}/${imports.length}] Exception for clinic ${importData.clinicId}: ${error.message}`)
      }
    }
    //summary
    console.log(`\n📊 Bulk import complete: ${results.length} succeeded, ${errors.length} failed out of ${imports.length} total`)


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