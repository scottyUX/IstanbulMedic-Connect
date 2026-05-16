import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

interface DoctorProfile {
  id: string;
  role: string;
  credentials: string;
  name?: string;
  years_experience?: number;
  photo_url?: string;
  clinic: {
    id: string;
    display_name: string;
  };
}

function stripNulls<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as Partial<T>;
}

export const doctorProfileTool = new DynamicStructuredTool({
  name: "doctor_profile",
  description:
    "Look up doctors and surgeons by doctor_id (UUID), doctor_name (partial match), or clinic_id (UUID, returns all doctors at the clinic). Each doctor includes role, credentials, optional years of experience and photo, plus the clinic they work at. Use this when a patient asks about a specific doctor or wants to know who works at a clinic.",
  schema: z
    .object({
      doctor_id: z.string().uuid().optional(),
      doctor_name: z.string().optional(),
      clinic_id: z.string().uuid().optional(),
    })
    .refine(
      (d) => Boolean(d.doctor_id || d.doctor_name || d.clinic_id),
      { message: "Provide one of doctor_id, doctor_name, or clinic_id" },
    ),
  func: async ({ doctor_id, doctor_name, clinic_id }) => {
    const startTime = Date.now();

    try {
      const supabase = await createClient();

      let query = supabase
        .from("clinic_team")
        .select(
          "id, clinic_id, name, role, credentials, years_experience, photo_url, doctor_involvement_level, clinics:clinics!inner(id, display_name)",
        );

      if (doctor_id) {
        query = query.eq("id", doctor_id);
      } else if (clinic_id) {
        query = query.eq("clinic_id", clinic_id);
      } else if (doctor_name) {
        query = query.ilike("name", `%${doctor_name}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) {
        return JSON.stringify({
          error: error.message,
          metadata: { tookMs: Date.now() - startTime },
        });
      }

      const doctors: DoctorProfile[] = (data ?? []).map((row) => {
        // Supabase's typed join can come back as an object or an array of objects;
        // both forms are observed depending on the schema cardinality declaration.
        const clinicJoin = Array.isArray(
          (row as { clinics?: unknown }).clinics,
        )
          ? ((row as { clinics: { id: string; display_name: string }[] })
              .clinics[0])
          : ((row as { clinics: { id: string; display_name: string } })
              .clinics);

        const base = stripNulls({
          id: row.id,
          role: row.role,
          credentials: row.credentials,
          name: row.name,
          years_experience: row.years_experience,
          photo_url: row.photo_url,
        }) as Partial<DoctorProfile>;

        return {
          ...base,
          clinic: clinicJoin
            ? { id: clinicJoin.id, display_name: clinicJoin.display_name }
            : { id: row.clinic_id, display_name: "" },
        } as DoctorProfile;
      });

      return JSON.stringify({
        doctors,
        metadata: {
          count: doctors.length,
          tookMs: Date.now() - startTime,
        },
      });
    } catch (error) {
      return JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: { tookMs: Date.now() - startTime },
      });
    }
  },
});
