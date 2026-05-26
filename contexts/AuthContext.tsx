'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/user';

interface ConsultationResult {
  createdNames: string[];
  skippedNames: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  loginWithGoogle: (next?: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<void>;
  consultationResult: ConsultationResult | null;
  clearConsultationResult: () => void;
  bookmarkSyncCount: number;
  clearBookmarkSyncCount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPABASE_NOT_CONFIGURED_MESSAGE =
  'Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local. Get them from https://app.supabase.com → Project Settings → API.';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultationResult, setConsultationResult] = useState<ConsultationResult | null>(null);
  const [bookmarkSyncCount, setBookmarkSyncCount] = useState(0);
  const router = useRouter();
  const clearConsultationResult = () => setConsultationResult(null);
  const clearBookmarkSyncCount = () => setBookmarkSyncCount(0);

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
          const synced = await syncLocalBookmarks();
          if (synced > 0) setBookmarkSyncCount(synced);
          const consultationRedirected = await syncConsultationIntent();
          if (!consultationRedirected) {
            // Fallback: if the cookie-based server redirect failed (e.g. cookie
            // was blocked), check sessionStorage and redirect client-side.
            const stored = sessionStorage.getItem('auth_redirect_next');
            if (stored) {
              try {
                const { path, ts } = JSON.parse(stored);
                const isRecent = Date.now() - ts < 2 * 60 * 1000;
                sessionStorage.removeItem('auth_redirect_next');
                if (isRecent) router.push(path);
              } catch {
                sessionStorage.removeItem('auth_redirect_next');
              }
            }
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setProfile(null);
        }
      } catch {
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
          // Sync any pending localStorage qualification data to the DB
          if (event === 'SIGNED_IN') {
            syncLocalQualificationData();
            syncLocalBookmarks().then((synced) => { if (synced > 0) setBookmarkSyncCount(synced); });
            syncConsultationIntent();
          }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const syncLocalQualificationData = () => {
    try {
      const stored = window.localStorage.getItem('im.qualification');
      const complete = window.localStorage.getItem('im.qualification.complete') === 'true';
      if (!stored || !complete) return;
      const data = JSON.parse(stored);
      // Fire-and-forget — data is safe in localStorage as fallback
      fetch('/api/profile/qualification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, termsAccepted: true }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const syncLocalBookmarks = async (): Promise<number> => {
    try {
      const raw = window.localStorage.getItem('im.bookmarks');
      if (!raw) return 0;
      const ids: string[] = JSON.parse(raw);
      if (!ids.length) return 0;
      const results = await Promise.all(
        ids.map((clinicId) =>
          fetch('/api/bookmarks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clinicId }),
          })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      window.localStorage.removeItem('im.bookmarks');
      return results.filter((r) => r?.bookmarkId != null).length;
    } catch {
      return 0;
    }
  };

  const syncConsultationIntent = async (): Promise<boolean> => {
    try {
      const raw = sessionStorage.getItem('consultation_intent');
      if (!raw) return false;
      sessionStorage.removeItem('consultation_intent');
      // Clear the redirect fallback — the OAuth callback already landed us on
      // /profile, so leaving this set would cause a stale redirect on the next
      // sign-in within the 2-min TTL.
      sessionStorage.removeItem('auth_redirect_next');
      const clinicIds: string[] = JSON.parse(raw);
      if (!clinicIds.length) return false;
      const res = await fetch('/api/consultations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clinicIds }),
      }).catch(() => null);
      if (res?.ok) {
        const body = await res.json().catch(() => null);
        setConsultationResult({
          createdNames: body?.createdNames ?? [],
          skippedNames: body?.skippedNames ?? [],
        });
        router.push('/profile?section=consultations');
      }
      // On API failure: intent is cleared, no redirect. The OAuth callback
      // already landed the user on /profile — they can retry from the
      // Consultations tab without being double-redirected.
      return true;
    } catch {
      return false;
    }
  };

  const loginWithGoogle = async (next?: string) => {
    try {
      const supabase = createClient();
      if (!supabase) {
        throw new Error(SUPABASE_NOT_CONFIGURED_MESSAGE);
      }
      // Supabase strips query params from redirectTo, so persist the destination
      // in a cookie — the server-side callback reads it and redirects directly,
      // eliminating the flash. sessionStorage is kept as a silent fallback.
      if (next && typeof window !== 'undefined') {
        document.cookie = `auth_redirect_next=${encodeURIComponent(next)}; path=/; max-age=300; SameSite=Lax`;
        sessionStorage.setItem('auth_redirect_next', JSON.stringify({ path: next, ts: Date.now() }));
      }
      const callbackUrl = new URL(`${window.location.origin}/auth/callback`);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
          scopes: [
            'profile',
            'email',
            'https://www.googleapis.com/auth/user.birthday.read',
            'https://www.googleapis.com/auth/user.gender.read',
            'https://www.googleapis.com/auth/user.phonenumbers.read',
            'https://www.googleapis.com/auth/user.addresses.read',
          ].join(' '),
        },
      });
      if (error) throw error;
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
    } catch {
      // continue regardless
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        window.location.href = '/';
      }
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
        consultationResult,
        clearConsultationResult,
        bookmarkSyncCount,
        clearBookmarkSyncCount,
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
