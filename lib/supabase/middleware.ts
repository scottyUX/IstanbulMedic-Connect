import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/profile')) {
    // 1. Unauthenticated users can only reach /profile/get-started
    if (!user && pathname !== '/profile/get-started') {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = '/auth/login';
      loginUrl.searchParams.set('next', pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value));
      return redirectResponse;
    }

    // 2. Authenticated users without terms_accepted are gated to /profile/get-started
    if (user && pathname !== '/profile/get-started') {
      const { data: userRow } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
      const { data: qualRow } = userRow
        ? await supabase.from('user_qualification').select('terms_accepted').eq('user_id', userRow.id).maybeSingle()
        : { data: null };
      const hasConsented = qualRow?.terms_accepted === true;
      if (!hasConsented) {
        const stepperUrl = request.nextUrl.clone();
        stepperUrl.pathname = '/profile/get-started';
        stepperUrl.search = '';
        const redirectResponse = NextResponse.redirect(stepperUrl);
        supabaseResponse.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value));
        return redirectResponse;
      }
    }
  }

  return supabaseResponse;
}
