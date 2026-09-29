export const getDeterministicUuid = (str?: string | null) => {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const strVal = String(str);
  let hash = 0;
  for (let i = 0; i < strVal.length; i++) {
    hash = strVal.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hex = Math.abs(hash).toString(16).padStart(12, '0');
  return `00000000-0000-0000-0000-${hex}`;
};

export interface AppUser { uid: string; email: string | null; displayName: string | null; photoURL: string | null; }

// Same resolution order as RequireAuth in App.tsx: Firebase user → rie_token
export const getAppUser = (firebaseUser: AppUser | null): AppUser | null => {
  if (firebaseUser) return firebaseUser;
  const rieToken = typeof localStorage !== 'undefined' ? localStorage.getItem('rie_token') : null;
  if (rieToken) {
    try {
      const p = JSON.parse(atob(rieToken.split('.')[1]));
      return { uid: p.uid || p.sub, email: p.sub, displayName: String(p.sub).split('@')[0], photoURL: null };
    } catch { /* invalid token */ }
  }
  return null;
};

// Ends both session types (Firebase and the email-code rie_token) so logout is complete for every user
export const signOutApp = async (signOutFirebase: () => Promise<void>) => {
  try { localStorage.removeItem('rie_token'); } catch { /* ignore */ }
  try { sessionStorage.clear(); } catch { /* ignore */ }
  try { await signOutFirebase(); } catch { /* not signed in with Firebase */ }
};

export const formatRelativeTime =(createdAt: string) => {
  const diffMinutes = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
  return `${Math.floor(diffMinutes / 1440)}d ago`;
};

export const isWithinHours = (createdAt: string, hours: number) => {
  if (!createdAt) return false;
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return diffMs < hours * 60 * 60 * 1000;
};
