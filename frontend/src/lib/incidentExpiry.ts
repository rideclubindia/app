import { supabase } from './supabase';

const EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours

/**
 * Filters pins to only those still "active":
 * a pin expires 2 hours after its creation, or 2 hours after the latest
 * vote (confirmation) if one was cast later than creation.
 */
export async function filterActiveIncidents<T extends { id: string; created_at: string }>(pins: T[]): Promise<T[]> {
  if (!pins.length) return pins;

  try {
    const { data: votes, error } = await supabase
      .from('confirmations')
      .select('pin_id, created_at')
      .in('pin_id', pins.map(p => p.id));

    if (error) throw error;

    const lastVoteByPin = new Map<string, number>();
    (votes || []).forEach(v => {
      const t = new Date(v.created_at).getTime();
      const prev = lastVoteByPin.get(v.pin_id) || 0;
      if (t > prev) lastVoteByPin.set(v.pin_id, t);
    });

    const now = Date.now();
    return pins.filter(p => {
      const createdAt = new Date(p.created_at).getTime();
      const lastActivity = Math.max(createdAt, lastVoteByPin.get(p.id) || 0);
      return now - lastActivity < EXPIRY_MS;
    });
  } catch (e) {
    console.warn('Incident expiry check failed, showing pins unfiltered:', e);
    return pins;
  }
}
