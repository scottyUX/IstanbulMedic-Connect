import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendConsultationRequest, type ConsultationPassport } from '@/lib/email/sendConsultationRequest'

// POST /api/consultations — { clinicIds: string[] } → create records + send email
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let clinicIds: string[]
  try {
    const body = await request.json()
    clinicIds = body.clinicIds
    if (!Array.isArray(clinicIds) || clinicIds.length === 0) throw new Error('invalid')
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 })
  }

  // Fetch clinic names + passport data in parallel
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any
  const [
    { data: clinicRows },
    { data: qual },
    { data: treat },
    { data: profile },
    { data: transplants },
    { data: surgeries },
    { data: photos },
  ] = await Promise.all([
    supabase.from('clinics').select('id, display_name').in('id', clinicIds),
    sb.from('user_qualification').select('age_tier, country, budget_tier, timeline, whatsapp_number').eq('user_id', userRow.id).maybeSingle(),
    sb.from('user_treatment_profiles').select('norwood_scale, hair_loss_duration_years, donor_area_quality, donor_area_availability, desired_density, had_prior_transplant, allergies, medications, other_conditions').eq('user_id', userRow.id).maybeSingle(),
    sb.from('user_profiles').select('gender').eq('user_id', userRow.id).maybeSingle(),
    sb.from('user_prior_transplants').select('year, estimated_grafts, clinic_country').eq('user_id', userRow.id),
    sb.from('user_prior_surgeries').select('surgery_type, year, notes').eq('user_id', userRow.id),
    sb.from('user_photos').select('photo_view, storage_url').eq('user_id', userRow.id),
  ])

  const clinicNameMap: Record<string, string> = {}
  for (const c of clinicRows ?? []) {
    clinicNameMap[c.id] = c.display_name
  }

  // Insert one row per clinic — skip duplicates (pending unique index)
  const rows = clinicIds.map((clinicId) => ({
    user_id: userRow.id,
    clinic_id: clinicId,
    user_email: userRow.email ?? user.email ?? '',
    user_name: userRow.name ?? null,
    status: 'pending' as const,
  }))

  const { data: inserted, error: insertError } = await supabase
    .from('consultations')
    .insert(rows)
    .select('id, clinic_id')

  if (insertError) {
    if (insertError.code !== '23505') {
      console.error('POST /api/consultations insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create consultations' }, { status: 500 })
    }
  }

  const createdIds = (inserted ?? []).map((r) => r.clinic_id)
  const skippedIds = clinicIds.filter((id) => !createdIds.includes(id))

  if (createdIds.length > 0) {
    const clinicNames = createdIds.map((id) => clinicNameMap[id] ?? id)

    const passport: ConsultationPassport = {
      // Profile
      ageTier: qual?.age_tier ?? null,
      gender: profile?.gender ?? null,
      country: qual?.country ?? null,
      budgetTier: qual?.budget_tier ?? null,
      timeline: qual?.timeline ?? null,
      whatsApp: qual?.whatsapp_number ?? null,
      // Hair loss
      norwoodScale: treat?.norwood_scale ?? null,
      durationYears: treat?.hair_loss_duration_years ?? null,
      donorAreaQuality: treat?.donor_area_quality ?? null,
      donorAreaAvailability: treat?.donor_area_availability ?? null,
      desiredDensity: treat?.desired_density ?? null,
      hadPriorTransplant: treat?.had_prior_transplant ?? null,
      priorTransplants: (transplants ?? []).map((t: { year: number; estimated_grafts: number; clinic_country: string }) => ({
        year: t.year,
        estimatedGrafts: t.estimated_grafts,
        clinicCountry: t.clinic_country,
      })),
      // Medical
      allergies: treat?.allergies ?? [],
      medications: treat?.medications ?? [],
      otherConditions: treat?.other_conditions ?? [],
      priorSurgeries: (surgeries ?? []).map((s: { surgery_type: string; year: number; notes?: string }) => ({
        type: s.surgery_type,
        year: s.year,
        notes: s.notes ?? undefined,
      })),
      // Photos
      photos: (photos ?? []).map((ph: { photo_view: string; storage_url: string }) => ({
        view: ph.photo_view,
        url: ph.storage_url,
      })),
    }

    await sendConsultationRequest({
      userName: userRow.name ?? user.email ?? 'Unknown',
      userEmail: userRow.email ?? user.email ?? '',
      clinicNames,
      passport,
    }).catch((e) => console.error('sendConsultationRequest error:', e))
  }

  return NextResponse.json({ created: createdIds.length, skipped: skippedIds.length })
}

// GET /api/consultations — list all consultations for the logged-in user
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
    return NextResponse.json({ consultations: [] })
  }

  const { data, error } = await supabase
    .from('consultations')
    .select(`
      id,
      status,
      created_at,
      clinic_id,
      clinics (
        id,
        display_name,
        primary_city,
        primary_country
      )
    `)
    .eq('user_id', userRow.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('GET /api/consultations error:', error)
    return NextResponse.json({ error: 'Failed to fetch consultations' }, { status: 500 })
  }

  const clinicIds = (data ?? []).map((c) => c.clinic_id).filter(Boolean)
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

  const consultations = (data ?? []).map((c) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clinic = c.clinics as any
    return {
      id: c.id,
      status: c.status,
      createdAt: c.created_at,
      clinicId: c.clinic_id,
      clinicName: clinic?.display_name ?? '',
      clinicLocation: clinic ? `${clinic.primary_city}, ${clinic.primary_country}` : '',
      clinicImage: imageMap[c.clinic_id] ?? null,
    }
  })

  return NextResponse.json({ consultations })
}
