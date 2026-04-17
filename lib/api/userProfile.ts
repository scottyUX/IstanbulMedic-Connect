import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';

// ─── Payload types (match component interfaces) ───────────────────────────────

export interface QualificationPayload {
  ageTier?: string;
  gender?: string;
  birthday?: string;  // ISO date: YYYY-MM-DD
  country?: string;
  norwoodScale?: number; // saved to user_treatment_profiles.norwood_scale
  budgetTier?: string;
  timeline?: string;
  fullName?: string;
  email?: string;
  whatsApp?: string;
  preferredLanguage?: string;
  termsAccepted?: boolean; // optional — omit during mid-stepper autosaves to avoid resetting it
}

export interface PhotoMetadata {
  view: string;
  storageUrl: string;
  fileSizeBytes: number;
  mimeType: string;
}

export interface TreatmentProfilePayload {
  norwoodScale?: number;
  durationYears?: number;
  donorAreaQuality?: string;
  donorAreaAvailability?: string;
  desiredDensity?: string;
  hadPriorTransplant?: boolean;
  priorTransplants?: { year: number; estimatedGrafts: number; clinicCountry: string }[];
  allergies?: string[];
  medications?: string[];
  priorSurgeries?: { type: string; year: number; notes?: string }[];
  otherConditions?: string[];
  photos?: PhotoMetadata[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getAuthUser() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Unauthenticated');
  return { supabase, user };
}

/**
 * Soft variant used by read-only endpoints (getUserPhotos, getProfileStatus)
 * that return empty/default data rather than throwing when the caller is not
 * authenticated or does not have a users row yet.
 * Returns null for both "unauthenticated" and "no users row" cases.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function tryGetInternalUserId(supabase: any): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).maybeSingle();
  return data?.id ?? null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInternalUserId(supabase: any, user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data.id as string;

  // Auto-create row for new Google OAuth users who skipped the GetStarted wizard
  const name = (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split('@')[0] ?? null) as string | null;
  const { data: newRow, error: insertErr } = await supabase
    .from('users')
    .upsert(
      { auth_id: user.id, email: user.email ?? null, name },
      { onConflict: 'auth_id' }
    )
    .select('id')
    .single();
  if (insertErr) throw insertErr;
  return newRow.id as string;
}

// ─── Qualification (GetStarted wizard) ────────────────────────────────────────

export async function upsertQualification(payload: QualificationPayload) {
  const { supabase, user } = await getAuthUser();

  // 1. Upsert core users row — fall back to Google auth metadata so new users
  //    never hit a NOT NULL failure on name/email during their first save.
  const resolvedName =
    payload.fullName ||
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    user.email?.split('@')[0] ||
    null;
  const resolvedEmail = payload.email || user.email || null;

  const { data: userRow, error: userError } = await supabase
    .from('users')
    .upsert(
      { auth_id: user.id, name: resolvedName, email: resolvedEmail, phone_number: payload.whatsApp ?? null },
      { onConflict: 'auth_id' }
    )
    .select('id')
    .single();
  if (userError) throw userError;

  const userId = userRow.id as string;

  // 2. Upsert user_profiles — only write fields explicitly provided
  const nameParts = (resolvedName ?? '').trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const profileFields: Record<string, any> = { user_id: userId, first_name: firstName, last_name: lastName };
  if (payload.gender            !== undefined) profileFields.gender             = payload.gender ?? null;
  if (payload.birthday          !== undefined) profileFields.date_of_birth      = payload.birthday ?? null;
  // preferredLanguage is intentionally written to both user_profiles and
  // user_qualification (see step 3). getQualification prefers the qual row;
  // the profile copy acts as a fallback if the qual row is absent.
  if (payload.preferredLanguage !== undefined) profileFields.preferred_language = payload.preferredLanguage;

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(profileFields, { onConflict: 'user_id' });
  if (profileError) throw profileError;

  // 3. Upsert user_qualification — only write fields explicitly provided
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qualFields: Record<string, any> = { user_id: userId };
  if (payload.termsAccepted !== undefined) qualFields.terms_accepted = payload.termsAccepted;
  if (payload.ageTier          !== undefined) qualFields.age_tier          = payload.ageTier.replace(/-/g, '_');
  if (payload.country          !== undefined) qualFields.country           = payload.country;
  if (payload.budgetTier       !== undefined) qualFields.budget_tier       = payload.budgetTier.replace(/-/g, '_');
  if (payload.timeline         !== undefined) qualFields.timeline          = payload.timeline.replace(/-/g, '_');
  if (payload.whatsApp         !== undefined) qualFields.whatsapp_number   = payload.whatsApp;
  if (payload.preferredLanguage !== undefined) qualFields.preferred_language = payload.preferredLanguage;

  const { error: qualError } = await supabase
    .from('user_qualification')
    .upsert(qualFields, { onConflict: 'user_id' });
  if (qualError) throw qualError;

  // 4. Save norwoodScale to user_treatment_profiles (clinical data belongs there)
  if (payload.norwoodScale !== undefined) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: treatError } = await (supabase as any)
      .from('user_treatment_profiles')
      .upsert({ user_id: userId, norwood_scale: payload.norwoodScale }, { onConflict: 'user_id' });
    if (treatError) throw treatError;
  }

  return { userId };
}

export async function getQualification() {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user);

  const { data, error } = await (supabase as SupabaseClient)
    .from('user_qualification')
    .select('age_tier, country, budget_tier, timeline, whatsapp_number, preferred_language, terms_accepted')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Fetch name/email from users, gender/dob from user_profiles, norwoodScale from treatment
  const [
    { data: userRow,    error: userRowError  },
    { data: profileRow, error: profileError  },
    { data: treatRow,   error: treatError    },
  ] = await Promise.all([
    supabase.from('users').select('name, email').eq('id', userId).maybeSingle(),
    (supabase as any).from('user_profiles').select('gender, preferred_language, date_of_birth').eq('user_id', userId).maybeSingle(),
    (supabase as any).from('user_treatment_profiles').select('norwood_scale').eq('user_id', userId).maybeSingle(),
  ]);
  if (userRowError)  throw userRowError;
  if (profileError)  throw profileError;
  if (treatError)    throw treatError;

  return {
    ageTier: data?.age_tier?.replace(/_/g, '-') ?? null,
    country: data?.country ?? null,
    norwoodScale: treatRow?.norwood_scale ?? null,
    budgetTier: data?.budget_tier?.replace(/_/g, '-') ?? null,
    timeline: data?.timeline?.replace(/_/g, '-') ?? null,
    whatsApp: data?.whatsapp_number ?? null,
    preferredLanguage: data?.preferred_language ?? profileRow?.preferred_language ?? null,
    termsAccepted: data?.terms_accepted ?? false,
    fullName: userRow?.name ?? null,
    email: userRow?.email ?? null,
    gender: profileRow?.gender ?? null,
    birthday: profileRow?.date_of_birth ?? null,
  };
}

// ─── Treatment profile (TreatmentProfile wizard) ──────────────────────────────

export async function getTreatmentProfile() {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user);

  const { data, error } = await supabase
    .from('user_treatment_profiles')
    .select('norwood_scale, hair_loss_duration_years, donor_area_quality, donor_area_availability, desired_density, had_prior_transplant, allergies, medications, other_conditions')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const { data: transplants } = await (supabase as SupabaseClient)
    .from('user_prior_transplants')
    .select('year, estimated_grafts, clinic_country')
    .eq('user_id', userId);

  const { data: surgeries } = await (supabase as SupabaseClient)
    .from('user_prior_surgeries')
    .select('surgery_type, year, notes')
    .eq('user_id', userId);

  return {
    norwoodScale: data.norwood_scale ?? undefined,
    durationYears: data.hair_loss_duration_years ?? undefined,
    donorAreaQuality: data.donor_area_quality ?? undefined,
    donorAreaAvailability: data.donor_area_availability ?? undefined,
    desiredDensity: data.desired_density ?? undefined,
    hadPriorTransplant: data.had_prior_transplant ?? undefined,
    allergies: (data.allergies ?? []) as string[],
    medications: (data.medications ?? []) as string[],
    otherConditions: (data.other_conditions ?? []) as string[],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    priorTransplants: ((transplants ?? []) as any[]).map((t) => ({
      year: t.year as number,
      estimatedGrafts: t.estimated_grafts as number,
      clinicCountry: t.clinic_country as string,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    priorSurgeries: ((surgeries ?? []) as any[]).map((s) => ({
      type: s.surgery_type as string,
      year: s.year as number,
      notes: (s.notes ?? undefined) as string | undefined,
    })),
  };
}

export async function upsertTreatmentProfile(payload: TreatmentProfilePayload) {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user);

  // 1. Upsert user_treatment_profiles — only write fields explicitly provided in the payload
  //    so that MedicalHistory and HairLossStatus don't overwrite each other's columns.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const treatFields: Record<string, any> = { user_id: userId };
  if (payload.norwoodScale          !== undefined) treatFields.norwood_scale             = payload.norwoodScale;
  if (payload.durationYears         !== undefined) treatFields.hair_loss_duration_years  = payload.durationYears;
  if (payload.donorAreaQuality      !== undefined) treatFields.donor_area_quality        = payload.donorAreaQuality;
  if (payload.donorAreaAvailability !== undefined) treatFields.donor_area_availability   = payload.donorAreaAvailability;
  if (payload.desiredDensity        !== undefined) treatFields.desired_density           = payload.desiredDensity;
  if (payload.hadPriorTransplant    !== undefined) treatFields.had_prior_transplant      = payload.hadPriorTransplant;
  if (payload.allergies             !== undefined) treatFields.allergies                 = payload.allergies;
  if (payload.medications           !== undefined) treatFields.medications               = payload.medications;
  if (payload.otherConditions       !== undefined) treatFields.other_conditions          = payload.otherConditions;

  const { error: treatError } = await supabase
    .from('user_treatment_profiles')
    .upsert(treatFields, { onConflict: 'user_id' });
  if (treatError) throw treatError;

  // 2. Replace prior transplants — only when explicitly provided
  if (payload.priorTransplants !== undefined) {
    const { error: delTransplantError } = await supabase
      .from('user_prior_transplants')
      .delete()
      .eq('user_id', userId);
    if (delTransplantError) throw delTransplantError;

    if (payload.priorTransplants.length) {
      const { error } = await supabase.from('user_prior_transplants').insert(
        payload.priorTransplants.map((t) => ({
          user_id: userId,
          year: t.year,
          estimated_grafts: t.estimatedGrafts,
          clinic_country: t.clinicCountry,
        }))
      );
      if (error) throw error;
    }
  }

  // 3. Replace prior surgeries — only when explicitly provided
  if (payload.priorSurgeries !== undefined) {
    const { error: delSurgeryError } = await supabase
      .from('user_prior_surgeries')
      .delete()
      .eq('user_id', userId);
    if (delSurgeryError) throw delSurgeryError;

    if (payload.priorSurgeries.length) {
      const { error } = await supabase.from('user_prior_surgeries').insert(
        payload.priorSurgeries.map((s) => ({
          user_id: userId,
          surgery_type: s.type,
          year: s.year,
          notes: s.notes ?? null,
        }))
      );
      if (error) throw error;
    }
  }

  // 4. Upsert photos — one row per view angle, parallelised since each upsert
  //    targets a distinct (user_id, photo_view) row with no inter-dependencies.
  if (payload.photos?.length) {
    const results = await Promise.all(
      payload.photos.map((photo) =>
        supabase.from('user_photos').upsert(
          {
            user_id: userId,
            photo_view: photo.view,
            storage_url: photo.storageUrl,
            file_size_bytes: photo.fileSizeBytes,
            mime_type: photo.mimeType,
          },
          { onConflict: 'user_id,photo_view' }
        )
      )
    );
    const failed = results.find((r: { error: unknown }) => r.error);
    if (failed) throw (failed as { error: unknown }).error;
  }

  return { userId };
}

// ─── User Photos ──────────────────────────────────────────────────────────────

export async function getUserPhotos() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const userId = await tryGetInternalUserId(supabase);
  if (!userId) return [];

  const { data } = await supabase
    .from('user_photos')
    .select('photo_view, storage_url, file_size_bytes, mime_type')
    .eq('user_id', userId);
  return data ?? [];
}

export async function deleteUserPhoto(view: string) {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user);

  const { error } = await supabase
    .from('user_photos')
    .delete()
    .eq('user_id', userId)
    .eq('photo_view', view);
  if (error) throw error;
}

// ─── Profile completion status (UserProfileDashboard) ─────────────────────────

export async function getProfileStatus() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();

  if (!userRow) {
    return { qualificationComplete: false, treatmentComplete: false };
  }

  const [{ data: qual }, { data: treatment }] = await Promise.all([
    supabase.from('user_qualification').select('id').eq('user_id', userRow.id).maybeSingle(),
    supabase.from('user_treatment_profiles').select('id').eq('user_id', userRow.id).maybeSingle(),
  ]);

  return {
    qualificationComplete: !!qual,
    treatmentComplete: !!treatment,
  };
}
