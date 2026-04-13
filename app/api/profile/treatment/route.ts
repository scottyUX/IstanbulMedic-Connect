import { NextResponse } from 'next/server';
import { getTreatmentProfile, upsertTreatmentProfile } from '@/lib/api/userProfile';
import type { TreatmentProfilePayload } from '@/lib/api/userProfile';

export async function GET() {
  try {
    const data = await getTreatmentProfile();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error';
    const status = message === 'Unauthenticated' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload: TreatmentProfilePayload = await request.json();
    const result = await upsertTreatmentProfile(payload);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error';
    const status = message === 'Unauthenticated' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
