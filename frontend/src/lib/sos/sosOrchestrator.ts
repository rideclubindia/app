import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { create } from 'zustand';
import { supabase } from '../supabase';
import { apiClient } from '../apiClient';
import { useLocationStore } from '../../store/useLocationStore';

// SOS transport orchestrator: online (ride_events + backend Twilio) first, native SMS fallback when offline, local queue otherwise.

interface SosSmsCapabilities { internet: boolean; telephony: boolean; simReady: boolean; cellService: boolean; directSend: boolean; composer: boolean; smsPermission: boolean }
interface SosSmsPlugin {
  capabilities(): Promise<SosSmsCapabilities>;
  requestSmsPermission(): Promise<{ granted: boolean }>;
  send(o: { eventId: string; numbers: string[]; message: string }): Promise<{ attempted: string[]; failed: string[] }>;
  openComposer(o: { numbers: string[]; message: string }): Promise<{ opened: boolean }>;
  addListener(ev: 'smsStatus', cb: (e: { eventId: string; number: string; state: SmsRecipientState }) => void): Promise<PluginListenerHandle>;
}
const SosSms = registerPlugin<SosSmsPlugin>('SosSms');

export type OnlineState = 'idle' | 'sending' | 'delivered_to_group' | 'queued' | 'failed';
export type SmsState = 'not_needed' | 'preparing' | 'attempted' | 'composer_opened' | 'unavailable' | 'permission_denied' | 'no_contacts' | 'failed';
export type SmsRecipientState = 'pending' | 'sent' | 'failed' | 'delivered' | 'delivery_failed';
export type ContactSmsState = 'not_sent' | 'confirmed' | 'not_confirmed' | 'no_gateway';

export interface SosLocation { lat: number; lng: number; accuracy: number | null; at: string | null; stale: boolean }
export interface SosContact { name: string | null; phone: string }
export interface SosEvent {
  id: string;
  rideId: string | null;
  riderName: string;
  rideName: string | null;
  createdAt: string;
  location: SosLocation | null;
  contacts: SosContact[];
  online: OnlineState;
  contactSms: ContactSmsState;
  sms: SmsState;
  smsRecipients: Record<string, SmsRecipientState>;
  onlineAttempts: number;
  resolved: boolean;
  lastError: string | null;
}
export interface SosEnvironment { internet: boolean; smsDirect: boolean; smsComposer: boolean; smsPermission: boolean; cellService: boolean | null; native: boolean }

const STORE_KEY = 'rc_sos_events';
const LAST_FIX_KEY = 'rc_last_fix';
const DEDUPE_WINDOW_MS = 2 * 60 * 1000;
const STALE_AFTER_MS = 2 * 60 * 1000;
const MAX_ONLINE_ATTEMPTS = 6;

const readEvents = (): SosEvent[] => { try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]'); } catch { return []; } };
const writeEvents = (evs: SosEvent[]) => { try { localStorage.setItem(STORE_KEY, JSON.stringify(evs.slice(-20))); } catch { /* storage full or blocked */ } };

interface SosStore { events: SosEvent[]; env: SosEnvironment | null; upsert: (e: SosEvent) => void }
export const useSosStore = create<SosStore>((set) => ({
  events: readEvents(),
  env: null,
  upsert: (e) => set((s) => {
    const events = [...s.events.filter((x) => x.id !== e.id), e];
    writeEvents(events);
    return { events };
  }),
}));
const patch = (id: string, p: Partial<SosEvent> | ((e: SosEvent) => Partial<SosEvent>)) => {
  const cur = useSosStore.getState().events.find((e) => e.id === id);
  if (!cur) return;
  useSosStore.getState().upsert({ ...cur, ...(typeof p === 'function' ? p(cur) : p) });
};

export const reportLocationFix = (lat: number, lng: number, accuracy?: number | null) => {
  try { localStorage.setItem(LAST_FIX_KEY, JSON.stringify({ lat, lng, accuracy: accuracy ?? null, at: new Date().toISOString() })); } catch { /* ignore */ }
};

// Current fix → last reported fix → persisted last-known coordinates; never invents a location.
export const resolveSosLocation = (live?: { lat: number; lng: number } | null): SosLocation | null => {
  let last: any = null;
  try { last = JSON.parse(localStorage.getItem(LAST_FIX_KEY) || 'null'); } catch { /* ignore */ }
  if (live && Number.isFinite(live.lat) && Number.isFinite(live.lng) && !(live.lat === 0 && live.lng === 0)) {
    const fresh = last && Math.abs(last.lat - live.lat) < 1e-5 && Math.abs(last.lng - live.lng) < 1e-5;
    return { lat: live.lat, lng: live.lng, accuracy: fresh ? last.accuracy : null, at: fresh ? last.at : new Date().toISOString(), stale: false };
  }
  if (last?.lat != null) return { lat: last.lat, lng: last.lng, accuracy: last.accuracy, at: last.at, stale: Date.now() - new Date(last.at).getTime() > STALE_AFTER_MS };
  const cached = useLocationStore.getState().coordinates;
  if (cached) return { lat: cached.lat, lng: cached.lng, accuracy: null, at: null, stale: true };
  return null;
};

// Parses the profile's emergency contact field; supports several numbers separated by , ; / or new lines.
export const parseEmergencyContacts = (raw: string | null | undefined, defaultCountry = '+91'): SosContact[] => {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: SosContact[] = [];
  for (const chunk of String(raw).split(/[,;\n/]|\s{2,}/)) {
    const m = chunk.match(/\+?\d[\d\s-]{6,}\d/);
    if (!m) continue;
    let digits = m[0].replace(/[\s-]/g, '');
    if (!digits.startsWith('+')) {
      digits = digits.replace(/^0+/, '');
      if (digits.length === 10) digits = defaultCountry + digits;
      else if (digits.length === 12 && digits.startsWith('91')) digits = '+' + digits;
      else continue;
    }
    if (!/^\+\d{10,15}$/.test(digits) || seen.has(digits)) continue;
    seen.add(digits);
    const name = chunk.match(/\(([^)]+)\)/)?.[1]?.trim() || chunk.replace(m[0], '').replace(/[()]/g, '').trim() || null;
    out.push({ name, phone: digits });
  }
  return out;
};

export const locationLink = (loc: SosLocation) => `https://www.google.com/maps?q=${loc.lat.toFixed(6)},${loc.lng.toFixed(6)}`;

export const buildSosSms = (e: SosEvent) => {
  const time = new Date(e.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  const lines = ['RIDECLUB SOS', `Emergency alert from ${e.riderName}.`];
  if (e.rideName) lines.push(`Ride: ${e.rideName}`);
  if (e.location) {
    lines.push(`Location: ${locationLink(e.location)}`);
    if (e.location.stale && e.location.at) lines.push(`(last known at ${new Date(e.location.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })})`);
    else if (e.location.stale) lines.push('(last known location)');
  } else {
    lines.push('Location: unavailable');
  }
  lines.push(`Time: ${time}`, 'Please contact the rider immediately.');
  return lines.join('\n');
};

export const detectEnvironment = async (): Promise<SosEnvironment> => {
  const native = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  let env: SosEnvironment = { internet: navigator.onLine, smsDirect: false, smsComposer: false, smsPermission: false, cellService: null, native };
  if (native) {
    try {
      const c = await SosSms.capabilities();
      env = { internet: c.internet, smsDirect: c.directSend, smsComposer: c.composer, smsPermission: c.smsPermission, cellService: c.cellService, native };
    } catch { /* plugin missing in this build */ }
  } else {
    env.smsComposer = /android|iphone|ipad/i.test(navigator.userAgent);
  }
  useSosStore.setState({ env });
  return env;
};

const withTimeout = <T,>(p: PromiseLike<T>, ms: number): Promise<T> =>
  Promise.race([Promise.resolve(p), new Promise<T>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

let listenerReady: Promise<unknown> | null = null;
const ensureSmsListener = () => {
  if (listenerReady || !Capacitor.isNativePlatform()) return;
  listenerReady = SosSms.addListener('smsStatus', ({ eventId, number, state }) => {
    patch(eventId, (e) => ({ smsRecipients: { ...e.smsRecipients, [number]: state } }));
  }).catch(() => { listenerReady = null; });
};

const deliverOnline = async (id: string, memberUid: string, extraPayload: Record<string, unknown>) => {
  const e = useSosStore.getState().events.find((x) => x.id === id);
  if (!e || !e.rideId) return false;
  patch(id, { online: 'sending', onlineAttempts: e.onlineAttempts + 1 });
  try {
    const { data: existing } = await withTimeout(
      supabase.from('ride_events').select('id').eq('ride_id', e.rideId).eq('event_type', 'SOS').contains('payload', { sos_event_id: id }).limit(1),
      8000,
    );
    if (!existing?.length) {
      const { error } = await withTimeout(supabase.from('ride_events').insert({
        ride_id: e.rideId, user_id: memberUid, event_type: 'SOS', description: 'Emergency SOS!',
        payload: { ...extraPayload, sos_event_id: id, location: e.location, transport: 'online' },
      }), 8000);
      if (error) throw error;
    }
    patch(id, { online: 'delivered_to_group', lastError: null });
  } catch (err: any) {
    patch(id, { online: 'queued', lastError: err?.message || 'Network unavailable' });
    return false;
  }

  if (e.contactSms === 'confirmed' || !e.location || !e.contacts.length) return true;
  let confirmed = false, noGateway = false;
  for (const c of e.contacts.slice(0, 3)) {
    try {
      const res = await withTimeout(apiClient.post('/api/v1/sos/dispatch', {
        ride_id: e.rideId, lat: e.location.lat, lng: e.location.lng,
        emergency_contact_phone: c.phone, emergency_contact_name: c.name || undefined,
      }), 10000);
      if (res.data?.sms_sent) confirmed = true;
      else if (res.data?.reason === 'twilio_not_configured') noGateway = true;
    } catch { /* reported as not confirmed below */ }
  }
  patch(id, { contactSms: confirmed ? 'confirmed' : noGateway ? 'no_gateway' : 'not_confirmed' });
  return true;
};

const deliverSms = async (id: string, env: SosEnvironment, allowComposer: boolean) => {
  const e = useSosStore.getState().events.find((x) => x.id === id);
  if (!e) return;
  if (!e.contacts.length) { patch(id, { sms: 'no_contacts' }); return; }
  const numbers = e.contacts.map((c) => c.phone);
  const message = buildSosSms(e);
  patch(id, { sms: 'preparing' });

  if (env.native && env.smsDirect) {
    let granted = env.smsPermission;
    if (!granted) { try { granted = (await SosSms.requestSmsPermission()).granted; } catch { granted = false; } }
    if (granted) {
      ensureSmsListener();
      try {
        const r = await SosSms.send({ eventId: id, numbers, message });
        const recipients: Record<string, SmsRecipientState> = {};
        r.attempted.forEach((n) => { recipients[n] = 'pending'; });
        r.failed.forEach((n) => { recipients[n] = 'failed'; });
        patch(id, { sms: r.attempted.length ? 'attempted' : 'failed', smsRecipients: recipients });
        return;
      } catch { /* fall through to composer */ }
    } else if (!allowComposer || !env.smsComposer) {
      patch(id, { sms: 'permission_denied' });
      return;
    }
  }

  if (allowComposer && env.smsComposer) {
    try {
      if (env.native) {
        const r = await SosSms.openComposer({ numbers, message });
        patch(id, { sms: r.opened ? 'composer_opened' : 'unavailable' });
      } else {
        const sep = /iphone|ipad/i.test(navigator.userAgent) ? '&' : '?';
        window.location.href = `sms:${numbers.join(',')}${sep}body=${encodeURIComponent(message)}`;
        patch(id, { sms: 'composer_opened' });
      }
      return;
    } catch { /* fall through */ }
  }
  patch(id, { sms: 'unavailable' });
};

export interface TriggerSosInput {
  rideId: string | null;
  riderName: string;
  rideName?: string | null;
  memberUid: string;
  liveLocation?: { lat: number; lng: number } | null;
  emergencyContactRaw?: string | null;
  payload?: Record<string, unknown>;
  forceNew?: boolean;
}

// Idempotent: repeated taps within the dedupe window return the same event instead of creating another.
export const triggerSos = async (input: TriggerSosInput): Promise<SosEvent> => {
  const now = Date.now();
  const active = useSosStore.getState().events.find((e) => !e.resolved && e.rideId === input.rideId && now - new Date(e.createdAt).getTime() < DEDUPE_WINDOW_MS);
  if (active && !input.forceNew) return active;

  const ev: SosEvent = {
    id: crypto.randomUUID(),
    rideId: input.rideId,
    riderName: input.riderName || 'A RideClub rider',
    rideName: input.rideName || null,
    createdAt: new Date().toISOString(),
    location: resolveSosLocation(input.liveLocation),
    contacts: parseEmergencyContacts(input.emergencyContactRaw),
    online: 'idle',
    contactSms: 'not_sent',
    sms: 'not_needed',
    smsRecipients: {},
    onlineAttempts: 0,
    resolved: false,
    lastError: null,
  };
  useSosStore.getState().upsert(ev);

  const env = await detectEnvironment();
  const onlineOk = env.internet ? await deliverOnline(ev.id, input.memberUid, input.payload || {}) : false;
  if (!onlineOk) {
    if (!env.internet) patch(ev.id, { online: 'queued', lastError: 'No internet connection' });
    await deliverSms(ev.id, env, true);
  }
  scheduleRetry(input.memberUid, input.payload || {});
  return useSosStore.getState().events.find((e) => e.id === ev.id)!;
};

// Explicit resend: re-sends the SMS for the same event and retries online delivery; never automatic.
export const sendAgain = async (id: string, memberUid: string, payload: Record<string, unknown> = {}) => {
  const env = await detectEnvironment();
  if (env.internet) await deliverOnline(id, memberUid, payload);
  await deliverSms(id, env, true);
};

export const requestSosSmsPermission = async () => {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return false;
  try { return (await SosSms.requestSmsPermission()).granted; } catch { return false; }
};

export const resolveSos =(id: string) => patch(id, { resolved: true });

let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryListener: (() => void) | null = null;
const scheduleRetry = (memberUid: string, payload: Record<string, unknown>) => {
  const pending = () => useSosStore.getState().events.filter((e) => !e.resolved && e.online === 'queued' && e.onlineAttempts < MAX_ONLINE_ATTEMPTS);
  const run = async () => {
    retryTimer = null;
    for (const e of pending()) await deliverOnline(e.id, memberUid, payload);
    const left = pending();
    if (left.length) {
      const attempts = Math.max(...left.map((e) => e.onlineAttempts));
      retryTimer = setTimeout(run, Math.min(5 * 60_000, 15_000 * 2 ** attempts));
    }
  };
  if (!pending().length) return;
  if (!retryListener) {
    retryListener = () => { if (retryTimer) clearTimeout(retryTimer); run(); };
    window.addEventListener('online', retryListener);
  }
  if (!retryTimer) retryTimer = setTimeout(run, 15_000);
};

// Resumes queued events after an app restart.
export const resumePendingSos = (memberUid: string) => scheduleRetry(memberUid, {});
