// app/api/import/instagram/route.ts
//
// HTTP wrapper around the shared importInstagramData function.
// The actual DB logic lives in lib/instagram/importInstagramData.ts
// so it can also be called directly from the CLI pipeline script.

import { NextResponse } from 'next/server'
import { importInstagramData, type InstagramClaimsData } from '@/lib/instagram/importInstagramData'

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

    const result = await importInstagramData(clinicId, instagramData)

    return NextResponse.json({
      message: 'Instagram data imported successfully',
      ...result,
    })

  } catch (error: unknown) {
    console.error('Instagram import error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ error: msg, details: error }, { status: 500 })
  }
}
