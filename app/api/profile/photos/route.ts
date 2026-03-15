import { NextResponse } from 'next/server';
import { getUserPhotos, deleteUserPhoto } from '@/lib/api/userProfile';

export async function GET() {
  try {
    const data = await getUserPhotos();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { view } = await request.json();
    if (!view) {
      return NextResponse.json({ success: false, error: 'view is required' }, { status: 400 });
    }
    await deleteUserPhoto(view);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
