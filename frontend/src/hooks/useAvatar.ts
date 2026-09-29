import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getDeterministicUuid } from '../lib/user';

export const initialsImage = (name: string) =>
  `https://ui-avatars.com/api/?background=FF6B22&color=fff&bold=true&name=${encodeURIComponent(name || 'Rider')}`;

const sha256 = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

// Photo for a signed-in user: uploaded profile photo, then Gravatar for their email, then an initials image
export function useAvatar(user: { uid?: string; email?: string | null; displayName?: string | null; photoURL?: string | null } | null, knownAvatarUrl?: string | null) {
  const name = user?.displayName || user?.email?.split('@')[0] || 'Rider';
  const [url, setUrl] = useState<string>(knownAvatarUrl || user?.photoURL || initialsImage(name));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let photo = knownAvatarUrl || user?.photoURL || null;
      if (!photo && user?.uid) {
        const { data } = await supabase.from('profiles').select('avatar_url').eq('id', getDeterministicUuid(user.uid)).maybeSingle();
        photo = data?.avatar_url || null;
      }
      if (!photo && user?.email) {
        const hash = await sha256(user.email.trim().toLowerCase());
        // Gravatar rejects fallback URLs with a query string, so ask for a 404 and let the <img> fall back to initials
        photo = `https://gravatar.com/avatar/${hash}?s=160&d=404`;
      }
      if (!cancelled) setUrl(photo || initialsImage(name));
    })().catch(() => {});
    return () => { cancelled = true; };
  }, [user?.uid, user?.email, user?.photoURL, knownAvatarUrl, name]);

  return url;
}
