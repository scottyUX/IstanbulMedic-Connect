/**
 * User profile structure based on Google OAuth data from Supabase auth.users
 */
export interface UserProfile {
  // From user object
  id: string;
  email: string | null;
  created_at: string;
  
  // From user_metadata (Google OAuth)
  full_name?: string | null;
  avatar_url?: string | null;
  given_name?: string | null;
  family_name?: string | null;
}
