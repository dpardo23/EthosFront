import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const isSupabaseConfigured =
  typeof supabaseUrl === 'string' && supabaseUrl.length > 0 &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 0;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
