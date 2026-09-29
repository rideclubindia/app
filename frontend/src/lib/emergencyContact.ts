import { auth } from './firebase';
import { getAppUser, getDeterministicUuid } from './user';
import { parseEmergencyContacts } from './sos/sosOrchestrator';
import { getMyProfile, updateMyProfile } from './myProfile';

export interface EmergencyContactInfo { name: string; phone: string }

// Normalises Indian numbers to +91XXXXXXXXXX; accepts other countries when entered with a leading +
export const normalizeMobile = (raw: string): string | null => {
  const digits = raw.replace(/[^\d+]/g, '');
  if (/^\+\d{10,15}$/.test(digits)) return digits;
  const d = digits.replace(/\D/g, '').replace(/^0+/, '');
  if (/^[6-9]\d{9}$/.test(d)) return `+91${d}`;
  if (/^91[6-9]\d{9}$/.test(d)) return `+${d}`;
  return null;
};

// Same free-text field the SOS/SMS fallback already reads: "+91XXXXXXXXXX (Name)"
export const formatEmergencyContact = (c: EmergencyContactInfo) => `${c.phone} (${c.name.trim()})`;

export const myProfileId = () => {
  const u = getAppUser(auth.currentUser);
  return u ? (u.uid.length === 36 ? u.uid : getDeterministicUuid(u.uid)) : null;
};

export async function loadMyEmergencyContact(): Promise<{ raw: string | null; primary: EmergencyContactInfo | null }> {
  const id = myProfileId();
  if (!id) return { raw: null, primary: null };
  const data = await getMyProfile(true);
  const raw = data?.emergency_contact || null;
  const first = parseEmergencyContacts(raw)[0];
  return { raw, primary: first ? { name: first.name || 'Emergency contact', phone: first.phone } : null };
}

export async function saveMyEmergencyContact(c: EmergencyContactInfo) {
  const id = myProfileId();
  if (!id) throw new Error('Please log in again.');
  await updateMyProfile({ emergency_contact: formatEmergencyContact(c) });
}
