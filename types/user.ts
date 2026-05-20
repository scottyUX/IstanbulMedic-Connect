/**
 * User profile structure based on Google OAuth data from Supabase auth.users
 */
export interface UserProfile {
  // From user object
  id: string;
  email: string | null;
  created_at: string;

  // From user_metadata (Google OAuth — default scopes)
  full_name?: string | null;
  avatar_url?: string | null;
  given_name?: string | null;
  family_name?: string | null;

  // From user_metadata (Google People API — extended scopes)
  birthday?: string | null;      // ISO date: YYYY-MM-DD
  phone_number?: string | null;
  location?: string | null;
}
