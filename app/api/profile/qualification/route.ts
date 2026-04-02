import { NextResponse } from 'next/server';
import { getQualification, upsertQualification } from '@/lib/api/userProfile';
import type { QualificationPayload } from '@/lib/api/userProfile';

export async function GET() {
  try {
    const data = await getQualification();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error as any)?.message ?? 'Unknown error';
    const status = message === 'Unauthenticated' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const payload: QualificationPayload = await request.json();
    const result = await upsertQualification(payload);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error as any)?.message ?? 'Unknown error';
    const status = message === 'Unauthenticated' ? 401 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
