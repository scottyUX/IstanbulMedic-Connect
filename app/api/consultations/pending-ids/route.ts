import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/consultations/pending-ids — returns clinic IDs where user has a pending consultation
// Returns empty array for unauthenticated users (no 401, so callers don't need auth checks)
export async function GET() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ pendingClinicIds: [] })
  }

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ pendingClinicIds: [] })
  }

  const { data, error } = await supabase
    .from('consultations')
    .select('clinic_id')
    .eq('user_id', userRow.id)
    .eq('status', 'pending')

  if (error) {
    console.error('GET /api/consultations/pending-ids error:', error)
    return NextResponse.json({ pendingClinicIds: [] })
  }

  return NextResponse.json({ pendingClinicIds: (data ?? []).map((r) => r.clinic_id) })
}
