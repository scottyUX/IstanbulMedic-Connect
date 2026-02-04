import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UserProfile } from '@/types/user';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, data: null },
        { status: 401 }
      );
    }

    // Extract user metadata
    const metadata = user.user_metadata || {};
    
    // Transform to UserProfile format
    const profile: UserProfile = {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      full_name: metadata.full_name || metadata.name || null,
      avatar_url: metadata.avatar_url || metadata.picture || null,
      given_name: metadata.given_name || null,
      family_name: metadata.family_name || null,
    };

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { success: false, data: null, error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
