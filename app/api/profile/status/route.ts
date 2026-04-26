import { NextResponse } from 'next/server';
import { getProfileStatus } from '@/lib/api/userProfile';

export async function GET() {
  try {
    const status = await getProfileStatus();
    if (!status) {
      return NextResponse.json({ success: false, error: 'Unauthenticated' }, { status: 401 });
    }
    return NextResponse.json({ success: true, data: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
