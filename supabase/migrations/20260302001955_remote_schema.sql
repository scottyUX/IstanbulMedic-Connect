drop extension if exists "pg_net";

create type "public"."social_platform_enum" as enum ('instagram', 'tiktok', 'x', 'reddit', 'youtube', 'facebook');


  create table "public"."analyses" (
    "id" uuid not null default gen_random_uuid(),
    "result_id" text not null,
    "repo_url" text not null,
    "commit_sha" text,
    "analyzed_at" timestamp with time zone not null default now(),
    "report_json" jsonb not null,
    "summary_json" jsonb
      );



  create table "public"."clinic_google_places" (
    "id" uuid not null default gen_random_uuid(),
    "clinic_id" uuid not null,
    "place_id" character varying not null,
    "rating" numeric,
    "user_ratings_total" bigint,
    "last_checked_at" timestamp with time zone,
    "created_at" timestamp with time zone default (now() AT TIME ZONE 'utc'::text),
    "updated_at" timestamp with time zone default (now() AT TIME ZONE 'utc'::text)
      );



  create table "public"."clinic_social_media" (
    "id" uuid not null default gen_random_uuid(),
    "clinic_id" uuid not null,
    "platform" public.social_platform_enum not null,
    "account_handle" character varying not null,
    "follower_count" bigint,
    "verified" boolean default false,
    "last_checked_at" timestamp without time zone,
    "created_at" timestamp with time zone default (now() AT TIME ZONE 'utc'::text)
      );


CREATE UNIQUE INDEX analyses_pkey ON public.analyses USING btree (id);

CREATE UNIQUE INDEX analyses_repo_commit_unique ON public.analyses USING btree (repo_url, commit_sha);

CREATE INDEX analyses_repo_url_idx ON public.analyses USING btree (repo_url);

CREATE INDEX analyses_result_id_idx ON public.analyses USING btree (result_id);

CREATE UNIQUE INDEX analyses_result_id_key ON public.analyses USING btree (result_id);

CREATE UNIQUE INDEX clinic_facts_clinic_id_fact_key_unique ON public.clinic_facts USING btree (clinic_id, fact_key);

CREATE UNIQUE INDEX clinic_google_places_clinic_id_place_id_key ON public.clinic_google_places USING btree (clinic_id, place_id);

CREATE UNIQUE INDEX clinic_google_places_pkey ON public.clinic_google_places USING btree (id);

CREATE UNIQUE INDEX clinic_media_unique_url ON public.clinic_media USING btree (clinic_id, url);

CREATE UNIQUE INDEX clinic_reviews_unique_review ON public.clinic_reviews USING btree (clinic_id, review_text, review_date);

CREATE UNIQUE INDEX clinic_social_media_clinic_id_platform_account_handle_key ON public.clinic_social_media USING btree (clinic_id, platform, account_handle);

CREATE UNIQUE INDEX clinic_social_media_pkey ON public.clinic_social_media USING btree (id);

CREATE INDEX idx_clinic_facts_clinic_id ON public.clinic_facts USING btree (clinic_id);

CREATE INDEX idx_clinic_facts_clinic_key ON public.clinic_facts USING btree (clinic_id, fact_key);

CREATE INDEX idx_clinic_facts_fact_key ON public.clinic_facts USING btree (fact_key);

CREATE INDEX idx_clinic_google_places_clinic_id ON public.clinic_google_places USING btree (clinic_id);

CREATE INDEX idx_clinic_google_places_place_id ON public.clinic_google_places USING btree (place_id);

CREATE INDEX idx_clinic_social_media_clinic_id ON public.clinic_social_media USING btree (clinic_id);

CREATE INDEX idx_clinic_social_media_follower_count ON public.clinic_social_media USING btree (follower_count);

CREATE INDEX idx_clinic_social_media_platform ON public.clinic_social_media USING btree (platform);

alter table "public"."analyses" add constraint "analyses_pkey" PRIMARY KEY using index "analyses_pkey";

alter table "public"."clinic_google_places" add constraint "clinic_google_places_pkey" PRIMARY KEY using index "clinic_google_places_pkey";

alter table "public"."clinic_social_media" add constraint "clinic_social_media_pkey" PRIMARY KEY using index "clinic_social_media_pkey";

alter table "public"."analyses" add constraint "analyses_repo_commit_unique" UNIQUE using index "analyses_repo_commit_unique";

alter table "public"."analyses" add constraint "analyses_result_id_key" UNIQUE using index "analyses_result_id_key";

alter table "public"."clinic_facts" add constraint "clinic_facts_clinic_id_fact_key_unique" UNIQUE using index "clinic_facts_clinic_id_fact_key_unique";

alter table "public"."clinic_google_places" add constraint "clinic_google_places_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE not valid;

alter table "public"."clinic_google_places" validate constraint "clinic_google_places_clinic_id_fkey";

alter table "public"."clinic_google_places" add constraint "clinic_google_places_clinic_id_place_id_key" UNIQUE using index "clinic_google_places_clinic_id_place_id_key";

alter table "public"."clinic_media" add constraint "clinic_media_unique_url" UNIQUE using index "clinic_media_unique_url";

alter table "public"."clinic_reviews" add constraint "clinic_reviews_unique_review" UNIQUE using index "clinic_reviews_unique_review";

alter table "public"."clinic_social_media" add constraint "clinic_social_media_clinic_id_fkey" FOREIGN KEY (clinic_id) REFERENCES public.clinics(id) ON DELETE CASCADE not valid;

alter table "public"."clinic_social_media" validate constraint "clinic_social_media_clinic_id_fkey";

alter table "public"."clinic_social_media" add constraint "clinic_social_media_clinic_id_platform_account_handle_key" UNIQUE using index "clinic_social_media_clinic_id_platform_account_handle_key";

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


