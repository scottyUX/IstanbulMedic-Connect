'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. Get them from https://app.supabase.com → Project Settings → API.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile from API
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/user');
      const result = await response.json();
      
      if (result.success && result.data) {
        setProfile(result.data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    // Check initial session
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        // Check if session is expired
        if (session?.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          if (expiresAt < now) {
            setIsAuthenticated(false);
            setUser(null);
            setLoading(false);
            return;
          }
        }

        if (session?.user) {
          setIsAuthenticated(true);
          setUser(session.user);
          // Fetch user profile after session check
          await fetchUserProfile();
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      // Handle session expiration
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session) {
          // Session was refreshed, verify it's still valid
          if (session.expires_at) {
            const expiresAt = new Date(session.expires_at * 1000);
            const now = new Date();
            if (expiresAt < now) {
              setIsAuthenticated(false);
              setUser(null);
              setProfile(null);
              setLoading(false);
              return;
            }
          }
        }
      }

      if (session?.user) {
        // Check if session is expired
        if (session.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          if (expiresAt < now) {
            setIsAuthenticated(false);
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
          }
        }

        setIsAuthenticated(true);
        setUser(session.user);
        // Fetch user profile when user signs in
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchUserProfile();
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
      // Redirect will happen automatically
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      router.push('/');
    } catch (error) {
      // Still clear local state even if signOut fails
      setIsAuthenticated(false);
      setUser(null);
      setProfile(null);
      router.push('/');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        profile,
        loading,
        loginWithGoogle,
        logout,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
