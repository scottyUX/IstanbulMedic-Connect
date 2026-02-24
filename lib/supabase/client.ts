'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './database.types';

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let cachedClient: SupabaseBrowserClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function createClient(): SupabaseBrowserClient | null {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase environment variables are missing. Auth features are disabled.');
    }
    return null;
  }

  cachedClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}
