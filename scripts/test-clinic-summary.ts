/**
 * Smoke test: runs the same queries the clinic_summary tool uses,
 * directly against your Supabase database. No Next.js runtime needed.
 *
 * Usage:
 *   npx tsx scripts/test-clinic-summary.ts
 *   npx tsx scripts/test-clinic-summary.ts "Vera"
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = resolve(__dirname, '..', '.env.local');
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z_0-9]*)=(.*)$/);
  if (m) process.env[m[1]] = m[2].trim();
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function stripNulls(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v != null));
}

async function main() {
  const searchTerm = process.argv.slice(2).join(' ') || 'clinic';
  console.log(`\n🔍 Searching for: "${searchTerm}"\n`);

  // Step 1: Find the clinic
  const { data: clinics, error: clinicErr } = await supabase
    .from('clinics')
    .select('*')
    .ilike('display_name', `%${searchTerm}%`)
    .limit(5);

  if (clinicErr || !clinics?.length) {
    console.error('❌ No clinics found:', clinicErr?.message ?? 'empty results');
    // Show what clinics exist
    const { data: all } = await supabase
      .from('clinics')
      .select('id, display_name, status, primary_city')
      .limit(20);
    console.log('\nAvailable clinics:');
    all?.forEach((c) => console.log(`  - ${c.display_name} (${c.primary_city}) [${c.status}]`));
    return;
  }

  const clinic = clinics.find((c) => c.status === 'active') ?? clinics[0];
  console.log(`✅ Found: ${clinic.display_name} (${clinic.id})\n`);

  // Step 2: Fetch all related data in parallel (same as the tool does)
  const id = clinic.id;
  const start = Date.now();

  const [locations, services, credentials, pricing, packages, scores, languages, team, reviews] =
    await Promise.all([
      supabase.from('clinic_locations').select('*').eq('clinic_id', id).eq('is_primary', true).limit(1),
      supabase.from('clinic_services').select('*').eq('clinic_id', id),
      supabase.from('clinic_credentials').select('*').eq('clinic_id', id),
      supabase.from('clinic_pricing').select('*').eq('clinic_id', id),
      supabase.from('clinic_packages').select('*').eq('clinic_id', id),
      supabase.from('clinic_scores').select('*').eq('clinic_id', id).limit(1),
      supabase.from('clinic_languages').select('*').eq('clinic_id', id),
      supabase.from('clinic_team').select('*').eq('clinic_id', id),
      supabase.from('clinic_reviews').select('id', { count: 'exact', head: true }).eq('clinic_id', id),
    ]);

  // Step 3: Build the summary (same logic as the tool)
  const summary: Record<string, unknown> = {
    id: clinic.id,
    display_name: clinic.display_name,
    status: clinic.status,
  };

  if (clinic.description) summary.description = clinic.description;
  if (clinic.short_description) summary.short_description = clinic.short_description;
  if (clinic.website_url) summary.website_url = clinic.website_url;
  if (clinic.years_in_operation != null) summary.years_in_operation = clinic.years_in_operation;
  if (clinic.procedures_performed != null) summary.procedures_performed = clinic.procedures_performed;

  const contact = stripNulls({
    phone: clinic.phone_contact,
    email: clinic.email_contact,
    whatsapp: clinic.whatsapp_contact,
  });
  if (Object.keys(contact).length > 0) summary.contact = contact;

  const loc = locations.data?.[0];
  if (loc) {
    const location: Record<string, unknown> = { city: loc.city, country: loc.country };
    if (loc.address_line) location.address = loc.address_line;
    if (loc.postal_code) location.postal_code = loc.postal_code;
    if (loc.opening_hours) location.opening_hours = loc.opening_hours;
    if (loc.payment_methods?.length) location.payment_methods = loc.payment_methods;
    summary.location = location;
  }

  if (services.data?.length) {
    summary.specialties = services.data.map((s) => ({
      service_name: s.service_name,
      service_category: s.service_category,
      is_primary: s.is_primary_service,
    }));
  }

  if (credentials.data?.length) {
    summary.accreditations = credentials.data.map((c) =>
      stripNulls({
        credential_name: c.credential_name,
        credential_type: c.credential_type,
        issuing_body: c.issuing_body,
        valid_from: c.valid_from,
        valid_to: c.valid_to,
      })
    );
  }

  if (pricing.data?.length) {
    summary.pricing = pricing.data.map((p) =>
      stripNulls({
        service_name: p.service_name,
        price_min: p.price_min,
        price_max: p.price_max,
        currency: p.currency,
        pricing_type: p.pricing_type,
        is_verified: p.is_verified,
      })
    );
  }

  if (packages.data?.length) {
    summary.packages = packages.data.map((pkg) =>
      stripNulls({
        package_name: pkg.package_name,
        includes: pkg.includes,
        excludes: pkg.excludes,
        nights_included: pkg.nights_included,
        transport_included: pkg.transport_included,
        aftercare_duration_days: pkg.aftercare_duration_days,
        price_min: pkg.price_min,
        price_max: pkg.price_max,
        currency: pkg.currency,
      })
    );
  }

  const score = scores.data?.[0];
  if (score) summary.score = { overall_score: score.overall_score, band: score.band };

  if (languages.data?.length) {
    summary.languages = languages.data.map((l) => ({
      language: l.language,
      support_type: l.support_type,
    }));
  }

  if (team.data?.length) {
    summary.team = team.data.map((t) =>
      stripNulls({ name: t.name, role: t.role, credentials: t.credentials, years_experience: t.years_experience })
    );
  }

  if (reviews.count != null && reviews.count > 0) summary.review_count = reviews.count;

  const elapsed = Date.now() - start;

  // Print result
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n⏱  Queries took ${elapsed}ms`);
  console.log(`📋 Fields returned: ${Object.keys(summary).join(', ')}`);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
