drop extension if exists "pg_net";


-- New: not in any prior migration
create table "public"."analyses" (
  "id" uuid not null default gen_random_uuid(),
  "result_id" text not null,
  "repo_url" text not null,
  "commit_sha" text,
  "analyzed_at" timestamp with time zone not null default now(),
  "report_json" jsonb not null,
  "summary_json" jsonb
);

-- analyses indexes (new)
CREATE UNIQUE INDEX analyses_pkey ON public.analyses USING btree (id);

CREATE UNIQUE INDEX analyses_repo_commit_unique ON public.analyses USING btree (repo_url, commit_sha);

CREATE INDEX analyses_repo_url_idx ON public.analyses USING btree (repo_url);

CREATE INDEX analyses_result_id_idx ON public.analyses USING btree (result_id);

CREATE UNIQUE INDEX analyses_result_id_key ON public.analyses USING btree (result_id);

-- analyses constraints (new)
alter table "public"."analyses" add constraint "analyses_pkey" PRIMARY KEY using index "analyses_pkey";

alter table "public"."analyses" add constraint "analyses_repo_commit_unique" UNIQUE using index "analyses_repo_commit_unique";

alter table "public"."analyses" add constraint "analyses_result_id_key" UNIQUE using index "analyses_result_id_key";

-- Already in 20260215042850_upsert_clinic_facts_function.sql — CREATE OR REPLACE is idempotent
set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.upsert_clinic_facts(facts_data jsonb)
 RETURNS SETOF public.clinic_facts
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  INSERT INTO clinic_facts (
    clinic_id,
    fact_key,
    fact_value,
    value_type,
    confidence,
    computed_by,
    is_conflicting,
    first_seen_at,
    last_seen_at
  )
  SELECT
    (f->>'clinic_id')::uuid,
    f->>'fact_key',
    (f->>'fact_value')::jsonb,
    (f->>'value_type')::value_type_enum,
    (f->>'confidence')::real,
    (f->>'computed_by')::computed_by_enum,
    (f->>'is_conflicting')::boolean,
    (f->>'first_seen_at')::timestamptz,
    (f->>'last_seen_at')::timestamptz
  FROM jsonb_array_elements(facts_data) AS f
  ON CONFLICT (clinic_id, fact_key) DO UPDATE SET
    fact_value = EXCLUDED.fact_value,
    confidence = EXCLUDED.confidence,
    first_seen_at = clinic_facts.first_seen_at,  -- Keep original
    last_seen_at = EXCLUDED.last_seen_at,        -- Update to now
    is_conflicting = EXCLUDED.is_conflicting
  RETURNING *;
END;
$function$
;

-- Grants for analyses (new)
grant delete on table "public"."analyses" to "anon";
grant insert on table "public"."analyses" to "anon";
grant references on table "public"."analyses" to "anon";
grant select on table "public"."analyses" to "anon";
grant trigger on table "public"."analyses" to "anon";
grant truncate on table "public"."analyses" to "anon";
grant update on table "public"."analyses" to "anon";
grant delete on table "public"."analyses" to "authenticated";
grant insert on table "public"."analyses" to "authenticated";
grant references on table "public"."analyses" to "authenticated";
grant select on table "public"."analyses" to "authenticated";
grant trigger on table "public"."analyses" to "authenticated";
grant truncate on table "public"."analyses" to "authenticated";
grant update on table "public"."analyses" to "authenticated";
grant delete on table "public"."analyses" to "service_role";
grant insert on table "public"."analyses" to "service_role";
grant references on table "public"."analyses" to "service_role";
grant select on table "public"."analyses" to "service_role";
grant trigger on table "public"."analyses" to "service_role";
grant truncate on table "public"."analyses" to "service_role";
grant update on table "public"."analyses" to "service_role";

-- Grants for clinic_google_places and clinic_social_media (idempotent — safe to re-apply)
grant delete on table "public"."clinic_google_places" to "anon";
grant insert on table "public"."clinic_google_places" to "anon";
grant references on table "public"."clinic_google_places" to "anon";
grant select on table "public"."clinic_google_places" to "anon";
grant trigger on table "public"."clinic_google_places" to "anon";
grant truncate on table "public"."clinic_google_places" to "anon";
grant update on table "public"."clinic_google_places" to "anon";
grant delete on table "public"."clinic_google_places" to "authenticated";
grant insert on table "public"."clinic_google_places" to "authenticated";
grant references on table "public"."clinic_google_places" to "authenticated";
grant select on table "public"."clinic_google_places" to "authenticated";
grant trigger on table "public"."clinic_google_places" to "authenticated";
grant truncate on table "public"."clinic_google_places" to "authenticated";
grant update on table "public"."clinic_google_places" to "authenticated";
grant delete on table "public"."clinic_google_places" to "service_role";
grant insert on table "public"."clinic_google_places" to "service_role";
grant references on table "public"."clinic_google_places" to "service_role";
grant select on table "public"."clinic_google_places" to "service_role";
grant trigger on table "public"."clinic_google_places" to "service_role";
grant truncate on table "public"."clinic_google_places" to "service_role";
grant update on table "public"."clinic_google_places" to "service_role";
grant delete on table "public"."clinic_social_media" to "anon";
grant insert on table "public"."clinic_social_media" to "anon";
grant references on table "public"."clinic_social_media" to "anon";
grant select on table "public"."clinic_social_media" to "anon";
grant trigger on table "public"."clinic_social_media" to "anon";
grant truncate on table "public"."clinic_social_media" to "anon";
grant update on table "public"."clinic_social_media" to "anon";
grant delete on table "public"."clinic_social_media" to "authenticated";
grant insert on table "public"."clinic_social_media" to "authenticated";
grant references on table "public"."clinic_social_media" to "authenticated";
grant select on table "public"."clinic_social_media" to "authenticated";
grant trigger on table "public"."clinic_social_media" to "authenticated";
grant truncate on table "public"."clinic_social_media" to "authenticated";
grant update on table "public"."clinic_social_media" to "authenticated";
grant delete on table "public"."clinic_social_media" to "service_role";
grant insert on table "public"."clinic_social_media" to "service_role";
grant references on table "public"."clinic_social_media" to "service_role";
grant select on table "public"."clinic_social_media" to "service_role";
grant trigger on table "public"."clinic_social_media" to "service_role";
grant truncate on table "public"."clinic_social_media" to "service_role";
grant update on table "public"."clinic_social_media" to "service_role";
