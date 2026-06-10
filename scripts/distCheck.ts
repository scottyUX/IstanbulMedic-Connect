import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
import { createClient } from "@supabase/supabase-js";

async function main() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await sb.from("clinic_scores").select("overall_score, band, reputation_score, evidence_transparency_score");
  if (error) { console.error(error.message); return; }
  if (!data?.length) { console.log("No data — run testScoring.ts first"); return; }

  const bands: Record<string, number[]> = {};
  for (const r of data) {
    bands[r.band] = bands[r.band] || [];
    bands[r.band].push(r.overall_score);
  }
  console.log("Total clinics:", data.length);
  for (const band of ["A","B","C","D"]) {
    const scores = bands[band] || [];
    if (!scores.length) { console.log(`Band ${band}: 0 clinics`); continue; }
    const avg = (scores.reduce((a,b)=>a+b,0)/scores.length).toFixed(1);
    console.log(`Band ${band}: ${scores.length} clinics | avg ${avg} | range ${Math.min(...scores)}–${Math.max(...scores)}`);
  }

  const hist: Record<number, number> = {};
  for (const r of data) { hist[r.overall_score] = (hist[r.overall_score]||0)+1; }
  console.log("\nScore histogram (high→low):");
  for (const s of Object.keys(hist).map(Number).sort((a,b)=>b-a)) {
    console.log(`  ${String(s).padStart(3)}: ${"█".repeat(hist[s])} (${hist[s]})`);
  }

  const imFavs = (data ?? []).filter(r => r.band === 'A');
  console.log(`\nIM Favorite (band A): ${imFavs.length}/${(data ?? []).length} clinics`);
}

main().catch(console.error);
