import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCancellationNotification, sendCancellationConfirmation } from '@/lib/email/sendConsultationRequest'

// PATCH /api/consultations/[id] — cancel a pending consultation
export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id, name, email')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'User record not found' }, { status: 404 })
  }

  const { data: consultation, error: fetchError } = await supabase
    .from('consultations')
    .select('id, status, clinic_id, user_email')
    .eq('id', id)
    .eq('user_id', userRow.id)
    .maybeSingle()

  if (fetchError || !consultation) {
    return NextResponse.json({ error: 'Consultation not found' }, { status: 404 })
  }

  if (consultation.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending consultations can be cancelled' }, { status: 400 })
  }

  const { error: updateError } = await supabase
    .from('consultations')
    .update({ status: 'cancelled' })
    .eq('id', id)

  if (updateError) {
    console.error('PATCH /api/consultations/[id] update error:', updateError)
    return NextResponse.json({ error: 'Failed to cancel consultation' }, { status: 500 })
  }

  const { data: clinicRow } = await supabase
    .from('clinics')
    .select('display_name')
    .eq('id', consultation.clinic_id)
    .maybeSingle()

  const clinicName = clinicRow?.display_name ?? 'Unknown Clinic'
  const userName = userRow.name ?? user.email ?? 'Unknown'
  const userEmail = userRow.email ?? user.email ?? ''

  let emailSent = true
  try {
    await Promise.all([
      sendCancellationNotification({ userName, userEmail, clinicName }),
      sendCancellationConfirmation({ userName, userEmail, clinicName }),
    ])
  } catch (e) {
    emailSent = false
    console.error('cancellation email(s) failed — status updated but notifications incomplete', {
      userId: userRow.id,
      consultationId: id,
      error: e,
    })
  }

  return NextResponse.json({ success: true, emailSent })
}
