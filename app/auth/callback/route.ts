import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const isSafeNext =
    Boolean(requestedNext) &&
    requestedNext!.startsWith('/') &&
    !requestedNext!.startsWith('//') &&
    !requestedNext!.startsWith('/auth') &&
    !requestedNext!.startsWith('/api/auth');

  const normalizedNext = isSafeNext ? requestedNext! : '/langchain';
  const next = normalizedNext.startsWith('/leila') ? '/langchain' : normalizedNext;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
