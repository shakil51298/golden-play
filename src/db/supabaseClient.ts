import { createClient } from '@supabase/supabase-js';

// User's live Supabase Credentials
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://jxafvuqtqphpkmkqqyhf.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4YWZ2dXF0cXBocGtta3FxeWhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4NTE0MjgsImV4cCI6MjA5NzQyNzQyOH0.q29GQt_w32ufSoNcYlsRJz_2c73lB4hN1jiGetMMhKQ';

export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Checks if the Supabase client has been correctly configured with real credentials.
 */
export function isSupabaseConfigured(): boolean {
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY && !SUPABASE_URL.includes('MY_SUPABASE_URL');
}
