import { createClient } from '@/lib/supabase/server';
import { type SupabaseClient } from '@supabase/supabase-js';

// ─── Payload types (match component interfaces) ───────────────────────────────

export interface QualificationPayload {
  ageTier?: string;
  gender?: string;
  country?: string;
  hairLossPattern?: string;
  budgetTier?: string;
  timeline?: string;
  fullName?: string;
  email?: string;
  whatsApp?: string;
  preferredLanguage?: string;
  termsAccepted: boolean;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getInternalUserId(supabase: any, authId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('User record not found. Complete Get Started first.');
  return data.id as string;
}

// ─── Qualification (GetStarted wizard) ────────────────────────────────────────

export async function upsertQualification(payload: QualificationPayload) {
  const { supabase, user } = await getAuthUser();

  // 1. Upsert core users row
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .upsert(
      { auth_id: user.id, name: payload.fullName, email: payload.email, phone_number: payload.whatsApp ?? null },
      { onConflict: 'auth_id' }
    )
    .select('id')
    .single();
  if (userError) throw userError;

  const userId = userRow.id as string;

  // 2. Upsert user_profiles (gender + language — split fullName)
  const nameParts = (payload.fullName ?? '').trim().split(/\s+/);
  const firstName = nameParts[0] ?? '';
  const lastName = nameParts.slice(1).join(' ') || firstName;

  const { error: profileError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        gender: payload.gender ?? null,
        preferred_language: payload.preferredLanguage ?? 'en',
      },
      { onConflict: 'user_id' }
    );
  if (profileError) throw profileError;

  // 3. Upsert user_qualification
  const { error: qualError } = await supabase
    .from('user_qualification')
    .upsert(
      {
        user_id: userId,
        age_tier: payload.ageTier?.replace(/-/g, '_') ?? null,
        country: payload.country ?? null,
        hair_loss_pattern: payload.hairLossPattern ?? null,
        budget_tier: payload.budgetTier?.replace(/-/g, '_') ?? null,
        timeline: payload.timeline?.replace(/-/g, '_') ?? null,
        whatsapp_number: payload.whatsApp ?? null,
        preferred_language: payload.preferredLanguage ?? 'en',
        terms_accepted: payload.termsAccepted,
      },
      { onConflict: 'user_id' }
    );
  if (qualError) throw qualError;

  return { userId };
}

export async function getQualification() {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user.id);

  const { data, error } = await (supabase as SupabaseClient)
    .from('user_qualification')
    .select('age_tier, country, hair_loss_pattern, budget_tier, timeline, whatsapp_number, preferred_language, terms_accepted')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  // Also fetch name/email from users + gender from user_profiles
  const { data: userRow } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', userId)
    .maybeSingle();

  const { data: profileRow } = await (supabase as SupabaseClient)
    .from('user_profiles')
    .select('gender, preferred_language')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    ageTier: data?.age_tier?.replace(/_/g, '-') ?? null,
    country: data?.country ?? null,
    hairLossPattern: data?.hair_loss_pattern ?? null,
    budgetTier: data?.budget_tier?.replace(/_/g, '-') ?? null,
    timeline: data?.timeline?.replace(/_/g, '-') ?? null,
    whatsApp: data?.whatsapp_number ?? null,
    preferredLanguage: data?.preferred_language ?? profileRow?.preferred_language ?? 'en',
    termsAccepted: data?.terms_accepted ?? false,
    fullName: userRow?.name ?? null,
    email: userRow?.email ?? null,
    gender: profileRow?.gender ?? null,
  };
}

// ─── Treatment profile (TreatmentProfile wizard) ──────────────────────────────

export async function getTreatmentProfile() {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user.id);

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
  const userId = await getInternalUserId(supabase, user.id);

  // 1. Upsert user_treatment_profiles
  const { error: treatError } = await supabase
    .from('user_treatment_profiles')
    .upsert(
      {
        user_id: userId,
        norwood_scale: payload.norwoodScale ?? null,
        hair_loss_duration_years: payload.durationYears ?? null,
        donor_area_quality: payload.donorAreaQuality ?? null,
        donor_area_availability: payload.donorAreaAvailability ?? null,
        desired_density: payload.desiredDensity ?? null,
        had_prior_transplant: payload.hadPriorTransplant ?? false,
        allergies: payload.allergies ?? [],
        medications: payload.medications ?? [],
        other_conditions: payload.otherConditions ?? [],
      },
      { onConflict: 'user_id' }
    );
  if (treatError) throw treatError;

  // 2. Replace prior transplants — delete all then re-insert
  const { error: delTransplantError } = await supabase
    .from('user_prior_transplants')
    .delete()
    .eq('user_id', userId);
  if (delTransplantError) throw delTransplantError;

  if (payload.priorTransplants?.length) {
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

  // 3. Replace prior surgeries
  const { error: delSurgeryError } = await supabase
    .from('user_prior_surgeries')
    .delete()
    .eq('user_id', userId);
  if (delSurgeryError) throw delSurgeryError;

  if (payload.priorSurgeries?.length) {
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

  // 4. Upsert photos — one row per view angle
  if (payload.photos?.length) {
    for (const photo of payload.photos) {
      const { error } = await supabase
        .from('user_photos')
        .upsert(
          {
            user_id: userId,
            photo_view: photo.view,
            storage_url: photo.storageUrl,
            file_size_bytes: photo.fileSizeBytes,
            mime_type: photo.mimeType,
          },
          { onConflict: 'user_id,photo_view' }
        );
      if (error) throw error;
    }
  }

  return { userId };
}

// ─── User Photos ──────────────────────────────────────────────────────────────

export async function getUserPhotos() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: userRow } = await supabase
    .from('users')
    .select('id')
    .eq('auth_id', user.id)
    .maybeSingle();
  if (!userRow) return [];

  const { data } = await supabase
    .from('user_photos')
    .select('photo_view, storage_url, file_size_bytes, mime_type')
    .eq('user_id', userRow.id);
  return data ?? [];
}

export async function deleteUserPhoto(view: string) {
  const { supabase, user } = await getAuthUser();
  const userId = await getInternalUserId(supabase, user.id);

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
