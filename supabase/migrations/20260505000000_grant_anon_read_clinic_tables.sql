-- Grant anon SELECT on clinic tables used by the browser Supabase client.
-- These tables were missing grants, causing client-side queries to silently
-- return empty results (clinic_credentials, clinic_forum_profiles, etc.).

grant select on table "public"."clinic_credentials"       to "anon";
grant select on table "public"."clinic_credentials"       to "authenticated";

grant select on table "public"."clinic_registry_records"  to "anon";
grant select on table "public"."clinic_registry_records"  to "authenticated";

grant select on table "public"."clinic_forum_profiles"  to "anon";
grant select on table "public"."clinic_forum_profiles"  to "authenticated";

grant select on table "public"."clinic_facts"           to "anon";
grant select on table "public"."clinic_facts"           to "authenticated";

grant select on table "public"."clinic_media"           to "anon";
grant select on table "public"."clinic_media"           to "authenticated";

grant select on table "public"."clinic_reviews"         to "anon";
grant select on table "public"."clinic_reviews"         to "authenticated";

grant select on table "public"."sources"                to "anon";
grant select on table "public"."sources"                to "authenticated";
