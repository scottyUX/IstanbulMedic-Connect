// lib/scoring/scoreClinic.ts
// Main scoring runner. Fetches raw data, computes scores, and persists results.
//
// Usage:
//   import { scoreClinic } from "@/lib/scoring/scoreClinic";
//   await scoreClinic(supabase, clinicId);

import { SupabaseClient } from "@supabase/supabase-js";
import { computeGoogleMetrics } from "./metrics/google";
import { computeRedditMetrics } from "./metrics/reddit";
import { computeInstagramMetrics } from "./metrics/instagram";
import { computeRegistryMetrics } from "./metrics/registry";
import { computeCredentialsMetrics } from "./metrics/credentials";
import { computeGoogleSourceScore } from "./sources/google";
import { computeReputationScore } from "./pillars/reputation";
import { computeEvidenceTransparencyScore } from "./pillars/evidenceTransparency";
import { computeOverallScore } from "./overall";

const SCORE_VERSION = "v1.5";

export async function scoreClinic(
  supabase: SupabaseClient,
  clinicId: string
): Promise<void> {
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Fetch raw data in parallel
  // ─────────────────────────────────────────────────────────────────────────

  const [googleResult, redditResult, instagramResult, registryResult, teamResult] = await Promise.all([
    supabase
      .from("clinic_google_places")
      .select("rating, user_ratings_total")
      .eq("clinic_id", clinicId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    supabase
      .from("clinic_forum_profiles")
      .select("sentiment_score, confidence_score, thread_count, unique_authors_count, longterm_thread_count, photo_thread_count, repair_mention_count, mention_count")
      .eq("clinic_id", clinicId)
      .eq("forum_source", "reddit")
      .maybeSingle(),

    supabase
      .from("clinic_social_media")
      .select("follower_count, verified, posts_count")
      .eq("clinic_id", clinicId)
      .eq("platform", "instagram")
      .maybeSingle(),

    supabase
      .from("clinic_registry_records")
      .select("license_status, expires_at")
      .eq("clinic_id", clinicId),

    supabase
      .from("clinic_team")
      .select("id, role, last_verified_at")
      .eq("clinic_id", clinicId),
  ]);

  if (googleResult.error) throw new Error(`Google fetch failed: ${googleResult.error.message}`);
  if (redditResult.error) throw new Error(`Reddit fetch failed: ${redditResult.error.message}`);
  if (instagramResult.error) throw new Error(`Instagram fetch failed: ${instagramResult.error.message}`);
  if (registryResult.error) throw new Error(`Registry fetch failed: ${registryResult.error.message}`);
  if (teamResult.error) throw new Error(`Team fetch failed: ${teamResult.error.message}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Compute metrics
  // ─────────────────────────────────────────────────────────────────────────

  const googleMetrics = computeGoogleMetrics({
    rating: googleResult.data?.rating ?? null,
    user_ratings_total: googleResult.data?.user_ratings_total ?? null,
  });

  const redditMetrics = redditResult.data
    ? computeRedditMetrics(redditResult.data)
    : undefined;

  const instagramMetrics = computeInstagramMetrics(instagramResult.data ?? null);

  const registryMetrics = computeRegistryMetrics(registryResult.data ?? []);

  // Fetch qualifications for all team members
  const teamIds = (teamResult.data ?? []).map((m: { id: string }) => m.id);
  const qualificationsResult = teamIds.length > 0
    ? await supabase
        .from("clinic_team_qualifications")
        .select("team_member_id, qualification, source, verified_at")
        .in("team_member_id", teamIds)
    : { data: [], error: null };

  if (qualificationsResult.error) {
    throw new Error(`Qualifications fetch failed: ${qualificationsResult.error.message}`);
  }

  const credentialsMetrics = computeCredentialsMetrics(
    teamResult.data ?? [],
    qualificationsResult.data ?? []
  );

  // Source breadth: count how many distinct data sources have data
  const sourceCount = [
    !!googleResult.data,
    !!redditResult.data,
    !!instagramResult.data,
    (registryResult.data ?? []).length > 0,
    credentialsMetrics.verified_qualification_count > 0,
  ].filter(Boolean).length;

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Compute source summary (Google only for now)
  // ─────────────────────────────────────────────────────────────────────────

  const googleSource = computeGoogleSourceScore(googleMetrics);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. Compute pillar scores
  // ─────────────────────────────────────────────────────────────────────────

  const reputation = computeReputationScore({
    google: googleMetrics,
    reddit: redditMetrics,
    instagram: instagramMetrics,
  });

  const evidence = computeEvidenceTransparencyScore({
    google_review_volume_score: googleMetrics.google_review_signal,
    reddit: redditMetrics,
    registry: registryMetrics,
    credentials: credentialsMetrics,
    source_count: sourceCount,
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 5. Compute overall score
  // ─────────────────────────────────────────────────────────────────────────

  const overall = computeOverallScore(reputation.score, evidence.score);

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Persist results
  // ─────────────────────────────────────────────────────────────────────────

  // --- clinic_source_scores (Google) ---
  await supabase
    .from("clinic_source_scores")
    .update({ is_current: false })
    .eq("clinic_id", clinicId)
    .eq("source_name", "google")
    .eq("is_current", true);

  const { error: sourceError } = await supabase
    .from("clinic_source_scores")
    .upsert({
      clinic_id:        clinicId,
      source_name:      "google",
      score_version:    SCORE_VERSION,
      summary_score:    googleSource.summary_score,
      confidence_score: googleSource.confidence_score,
      metrics_json:     googleSource.metrics_json,
      breakdown_json:   googleSource.breakdown_json,
      is_current:       true,
    }, { onConflict: "clinic_id,source_name,score_version" });

  if (sourceError) throw new Error(`Source score insert failed: ${sourceError.message}`);

  // --- clinic_score_components (pillars) ---
  await supabase.from("clinic_score_components").delete().eq("clinic_id", clinicId);

  const { error: componentsError } = await supabase
    .from("clinic_score_components")
    .insert([
      {
        clinic_id:     clinicId,
        component_key: "reputation",
        score:         reputation.score,
        weight:        overall.reputation_weight,
        explanation:   "",
      },
      {
        clinic_id:     clinicId,
        component_key: "evidence_transparency",
        score:         evidence.score,
        weight:        overall.evidence_transparency_weight,
        explanation:   "",
      },
    ]);

  if (componentsError) throw new Error(`Components insert failed: ${componentsError.message}`);

  // --- clinic_scores (overall) ---
  const { error: overallError } = await supabase
    .from("clinic_scores")
    .upsert({
      clinic_id:     clinicId,
      overall_score: overall.overall_score,
      band:          overall.band,
      version:       SCORE_VERSION,
      computed_at:   new Date().toISOString(),
    }, { onConflict: "clinic_id" });

  if (overallError) throw new Error(`Overall score upsert failed: ${overallError.message}`);

  console.log(
    `✅ ${clinicId} → overall: ${overall.overall_score} (${overall.band}) | ` +
    `reputation: ${reputation.score} | evidence: ${evidence.score}`
  );
}
