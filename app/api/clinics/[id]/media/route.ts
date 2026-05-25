import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing Supabase env vars')
  return createClient(url, key)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clinicId } = await params
    const { mediaId } = await request.json()

    if (!mediaId) {
      return NextResponse.json({ error: 'mediaId is required' }, { status: 400 })
    }

    const supabase = getAdminClient()

    // Clear existing primary for this clinic
    const { error: clearError } = await supabase
      .from('clinic_media')
      .update({ is_primary: false })
      .eq('clinic_id', clinicId)
      .eq('is_primary', true)

    if (clearError) throw clearError

    // Set new primary
    const { error: setError } = await supabase
      .from('clinic_media')
      .update({ is_primary: true })
      .eq('id', mediaId)
      .eq('clinic_id', clinicId)

    if (setError) throw setError

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/clinics/[id]/media error:', error)
    return NextResponse.json({ error: 'Failed to update primary image' }, { status: 500 })
  }
}
