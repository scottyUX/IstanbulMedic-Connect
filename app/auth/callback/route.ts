import { createCallbackClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// ─── Google People API types ───────────────────────────────────────────────────

interface GoogleDate {
  year?: number;
  month?: number;
  day?: number;
}

interface GooglePeopleResponse {
  names?: Array<{ givenName?: string; familyName?: string; displayName?: string }>;
  emailAddresses?: Array<{ value?: string }>;
  genders?: Array<{ value?: string; formattedValue?: string }>;
  birthdays?: Array<{ date?: GoogleDate }>;
  addresses?: Array<{
    formattedValue?: string;
    city?: string;
    country?: string;
    countryCode?: string;
  }>;
  phoneNumbers?: Array<{ value?: string; canonicalForm?: string }>;
  locales?: Array<{ value?: string }>;
}

interface GoogleExtras {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  gender: string | null;
  birthday: string | null;
  country: string | null;
  phoneNumber: string | null;
  preferredLanguage: string | null;
}

// ─── People API fetch ──────────────────────────────────────────────────────────

async function fetchGoogleExtras(providerToken: string): Promise<GoogleExtras> {
  const fields = [
    'names',
    'emailAddresses',
    'genders',
    'birthdays',
    'addresses',
    'phoneNumbers',
    'locales',
  ].join(',');

  const res = await fetch(
    `https://people.googleapis.com/v1/people/me?personFields=${fields}`,
    { headers: { Authorization: `Bearer ${providerToken}` } }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`People API ${res.status}: ${body}`);
  }

  const d: GooglePeopleResponse = await res.json();

  // Name
  const nameObj = d.names?.[0];
  const firstName = nameObj?.givenName ?? null;
  const lastName = nameObj?.familyName ?? null;

  // Email
  const email = d.emailAddresses?.[0]?.value ?? null;

  // Gender — normalise to our enum values (male/female/other/prefer_not_to_say)
  const rawGender = d.genders?.[0]?.value?.toLowerCase() ?? null;
  const gender =
    rawGender === 'male' ? 'male'
    : rawGender === 'female' ? 'female'
    : rawGender != null ? 'other'
    : null;

  // Birthday
  const dateObj = d.birthdays?.[0]?.date;
  const birthday =
    dateObj?.year && dateObj?.month && dateObj?.day
      ? `${dateObj.year}-${String(dateObj.month).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`
      : null;

  // Country — prefer country name, fall back to city
  const addrObj = d.addresses?.[0];
  const country = addrObj?.country ?? addrObj?.countryCode ?? addrObj?.city ?? null;

  // Phone — prefer E.164 canonical form
  const phoneObj = d.phoneNumbers?.[0];
  const phoneNumber = phoneObj?.canonicalForm ?? phoneObj?.value ?? null;

  // Preferred language — e.g. "en", "en-GB" → strip region tag
  const rawLocale = d.locales?.[0]?.value ?? null;
  const preferredLanguage = rawLocale ? rawLocale.split('-')[0].toLowerCase() : null;

  return { firstName, lastName, email, gender, birthday, country, phoneNumber, preferredLanguage };
}

// ─── Persist Google extras to DB ──────────────────────────────────────────────

async function persistGoogleExtras(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  extras: GoogleExtras,
  authName: string | null,
  authEmail: string | null,
) {
  const fullName =
    extras.firstName && extras.lastName
      ? `${extras.firstName} ${extras.lastName}`.trim()
      : extras.firstName ?? extras.lastName ?? authName ?? null;

  // 1. users — name, email, phone
  await supabase.from('users').upsert(
    {
      id: userId,
      name: fullName,
      email: extras.email ?? authEmail,
      ...(extras.phoneNumber ? { phone_number: extras.phoneNumber } : {}),
    },
    { onConflict: 'id' }
  );

  // 2. user_profiles — personal details
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileFields: Record<string, any> = { user_id: userId };
  if (extras.firstName) profileFields.first_name = extras.firstName;
  if (extras.lastName)  profileFields.last_name  = extras.lastName;
  // Fall back to splitting full name if individual parts are missing
  if (!extras.firstName && fullName) {
    const parts = fullName.trim().split(/\s+/);
    profileFields.first_name = parts[0];
    profileFields.last_name  = parts.slice(1).join(' ') || parts[0];
  }
  if (extras.gender)            profileFields.gender             = extras.gender;
  if (extras.birthday)          profileFields.date_of_birth      = extras.birthday;
  if (extras.preferredLanguage) profileFields.preferred_language = extras.preferredLanguage;

  await supabase.from('user_profiles').upsert(profileFields, { onConflict: 'user_id' });

  // 3. user_qualification — country, preferred_language, whatsapp
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qualFields: Record<string, any> = { user_id: userId };
  if (extras.country)           qualFields.country            = extras.country;
  if (extras.preferredLanguage) qualFields.preferred_language = extras.preferredLanguage;
  if (extras.phoneNumber)       qualFields.whatsapp_number    = extras.phoneNumber;

  if (Object.keys(qualFields).length > 1) {
    await supabase.from('user_qualification').upsert(qualFields, { onConflict: 'user_id' });
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const requestedNext = searchParams.get('next');
  const normalizedNext =
    requestedNext && requestedNext.startsWith('/') ? requestedNext : null;
  const legacyPaths = ['/profile/treatment-profile'];
  const next = !normalizedNext
    ? '/profile'
    : normalizedNext.startsWith('/leila')
    ? '/langchain'
    : legacyPaths.includes(normalizedNext)
    ? '/profile'
    : normalizedNext;

  if (code) {
    const { supabase, cookieMutations } = createCallbackClient(request);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = supabase as any;

      const authMeta = data.user.user_metadata ?? {};
      const authName =
        (authMeta.full_name as string | undefined) ??
        (authMeta.name as string | undefined) ??
        data.user.email?.split('@')[0] ??
        null;

      // Check if this is a new account (no existing users row)
      const { data: existingRow } = await s
        .from('users')
        .select('id')
        .eq('auth_id', data.user.id)
        .maybeSingle();
      const isNewUser = !existingRow;

      // Ensure users row exists (needed for FK in user_profiles / user_qualification)
      const { data: userRow } = await s
        .from('users')
        .upsert(
          { auth_id: data.user.id, name: authName, email: data.user.email ?? null },
          { onConflict: 'auth_id' }
        )
        .select('id')
        .single();

      // Only pull Google People API data on first sign-in — never overwrite user edits
      const providerToken = data.session?.provider_token;
      if (isNewUser && providerToken && userRow) {
        try {
          const extras = await fetchGoogleExtras(providerToken);
          await persistGoogleExtras(s, userRow.id, extras, authName, data.user.email ?? null);
        } catch (e) {
          // Non-fatal — user can fill details manually
          console.error('Google People API error:', e);
        }
      }

      // Decide where to send the user
      const isDefaultNext = !requestedNext || next === '/profile';
      let destination = next;
      if (isDefaultNext) {
        const { data: freshUserRow } = await s
          .from('users')
          .select('id')
          .eq('auth_id', data.user.id)
          .maybeSingle();
        const { data: qualRow } = freshUserRow
          ? await s
              .from('user_qualification')
              .select('terms_accepted')
              .eq('user_id', freshUserRow.id)
              .maybeSingle()
          : { data: null };
        const hasConsented = qualRow?.terms_accepted === true;
        destination = hasConsented ? '/profile' : '/profile/get-started';
      }

      const redirectResponse = NextResponse.redirect(`${origin}${destination}`);
      cookieMutations.forEach(({ name, value, options }) =>
        redirectResponse.cookies.set(name, value, options)
      );
      return redirectResponse;
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`);
}
