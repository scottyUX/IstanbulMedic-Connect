import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/bookmarks — list all bookmarks for the logged-in user
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ bookmarks: [] })
  }

  // 1. Fetch bookmarks with clinic basic info + google places rating
  const { data, error } = await supabase
    .from('user_bookmarks')
    .select(`
      id,
      clinic_id,
      clinics (
        id,
        display_name,
        primary_city,
        primary_country,
        clinic_google_places (
          rating,
          user_ratings_total
        )
      )
    `)
    .eq('user_id', userRow.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/bookmarks error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 })
  }

  const clinicIds = (data ?? []).map((b) => b.clinic_id)

  // 2. Fetch primary images for these clinics in one query
  const imageMap: Record<string, string | null> = {}
  if (clinicIds.length > 0) {
    const { data: mediaRows } = await supabase
      .from('clinic_media')
      .select('clinic_id, url')
      .in('clinic_id', clinicIds)
      .eq('media_type', 'image')
      .eq('is_primary', true)

    for (const m of mediaRows ?? []) {
      imageMap[m.clinic_id] = m.url
    }
  }

  // 3. Check which clinics already have a pending consultation
  let requestedIds: string[] = []
  if (clinicIds.length > 0) {
    const { data: consultations } = await supabase
      .from('consultations')
      .select('clinic_id')
      .eq('user_id', userRow.id)
      .in('clinic_id', clinicIds)
      .eq('status', 'pending')
    requestedIds = (consultations ?? []).map((c) => c.clinic_id)
  }

  const bookmarks = (data ?? []).map((b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clinic = b.clinics as any
    const googlePlaces = Array.isArray(clinic?.clinic_google_places)
      ? clinic.clinic_google_places[0]
      : clinic?.clinic_google_places

    return {
      bookmarkId: b.id,
      clinicId: b.clinic_id,
      name: clinic?.display_name ?? '',
      location: clinic
        ? `${clinic.primary_city}, ${clinic.primary_country}`
        : '',
      image: imageMap[b.clinic_id] ?? null,
      rating: googlePlaces?.rating ?? null,
      reviewCount: googlePlaces?.user_ratings_total ?? 0,
      consultationRequested: requestedIds.includes(b.clinic_id),
    }
  })

  return NextResponse.json({ bookmarks })
}

// POST /api/bookmarks — { clinicId } → save bookmark
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let clinicId: string
  try {
    const body = await request.json()
    clinicId = body.clinicId
    if (!clinicId) throw new Error('missing clinicId')
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 })
  }

  const { data, error } = await supabase
    .from('user_bookmarks')
    .insert({ user_id: userRow.id, clinic_id: clinicId })
    .select('id')
    .single()

  if (error) {
    // 23505 = unique violation — already bookmarked, treat as success
    if (error.code === '23505') {
      return NextResponse.json({ bookmarkId: null, alreadyExists: true })
    }
    console.error('POST /api/bookmarks error:', error)
    return NextResponse.json({ error: 'Failed to save bookmark' }, { status: 500 })
  }

  return NextResponse.json({ bookmarkId: data.id })
}

// DELETE /api/bookmarks — { clinicId } → remove bookmark
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let clinicId: string
  try {
    const body = await request.json()
    clinicId = body.clinicId
    if (!clinicId) throw new Error('missing clinicId')
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 })
  }

  const { error } = await supabase
    .from('user_bookmarks')
    .delete()
    .eq('user_id', userRow.id)
    .eq('clinic_id', clinicId)

  if (error) {
    console.error('DELETE /api/bookmarks error:', error)
    return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
