import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/bookmarks/guest — fetch clinic details for locally-saved IDs (no auth required)
export async function POST(request: NextRequest) {
  let clinicIds: string[]
  try {
    const body = await request.json()
    clinicIds = body.clinicIds
    if (!Array.isArray(clinicIds) || clinicIds.length === 0) {
      return NextResponse.json({ bookmarks: [] })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('clinics')
    .select(`
      id,
      display_name,
      primary_city,
      primary_country,
      clinic_google_places (
        rating,
        user_ratings_total
      )
    `)
    .in('id', clinicIds)

  if (error) {
    console.error('POST /api/bookmarks/guest error:', error)
    return NextResponse.json({ error: 'Failed to fetch clinics' }, { status: 500 })
  }

  const { data: mediaRows } = await supabase
    .from('clinic_media')
    .select('clinic_id, url')
    .in('clinic_id', clinicIds)
    .eq('media_type', 'image')
    .eq('is_primary', true)

  const imageMap: Record<string, string | null> = {}
  for (const m of mediaRows ?? []) {
    imageMap[m.clinic_id] = m.url
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookmarks = (data ?? []).map((clinic: any) => {
    const googlePlaces = Array.isArray(clinic.clinic_google_places)
      ? clinic.clinic_google_places[0]
      : clinic.clinic_google_places

    return {
      bookmarkId: clinic.id,
      clinicId: clinic.id,
      name: clinic.display_name ?? '',
      location: `${clinic.primary_city}, ${clinic.primary_country}`,
      image: imageMap[clinic.id] ?? null,
      rating: googlePlaces?.rating ?? null,
      reviewCount: googlePlaces?.user_ratings_total ?? 0,
      consultationRequested: false,
    }
  })

  return NextResponse.json({ bookmarks })
}
