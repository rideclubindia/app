import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const apiBase = import.meta.env.VITE_API_URL || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

// Short-lived per-rider database token from the backend, so RLS knows who is asking; tied to the current login token
let session: { token: string; exp: number; for: string } | null = null;
let inflight: Promise<string | null> | null = null;

const fetchDbToken = async (rie: string): Promise<string | null> => {
  try {
    const res = await fetch(`${apiBase}/api/v1/auth/supabase-token`, { method: 'POST', headers: { Authorization: `Bearer ${rie}` } });
    if (!res.ok) return null;
    const { access_token, expires_in } = await res.json();
    session = { token: access_token, exp: Date.now() + (Number(expires_in) || 3600) * 1000, for: rie };
    return access_token;
  } catch {
    return null;
  }
};

export const getDbToken = async (): Promise<string | null> => {
  let rie: string | null = null;
  try { rie = localStorage.getItem('rie_token'); } catch { /* storage blocked */ }
  if (!rie) { session = null; return null; }
  if (session && session.for === rie && session.exp - Date.now() > 5 * 60 * 1000) return session.token;
  if (!inflight) inflight = fetchDbToken(rie).finally(() => { inflight = null; });
  return inflight;
};

export const clearDbSession = () => { session = null; };

// Kept for existing callers; the token now comes from getDbToken
export const setSupabaseToken = (_token: string) => {};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => (await getDbToken()) ?? supabaseAnonKey,
});
