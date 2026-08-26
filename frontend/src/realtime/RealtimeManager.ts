/**
 * RealtimeManager - the app's single shared real-time connection.
 *
 * One Socket.IO connection per app instance (never per screen). Components
 * subscribe through `joinRide` / `on` and the manager handles:
 *   - authentication (rie_token, auto re-mint from Firebase when expired)
 *   - reconnect with exponential backoff + jitter (socket.io built-in + guards)
 *   - session recovery (sessionId persisted; missed critical events replayed)
 *   - room subscription ref-counting
 *   - adaptive location batching (distance/time gates, latest-wins)
 *   - REST fallback for telemetry when the socket is down
 *   - offline queueing of critical emits
 *
 * Usage:
 *   import { getRealtime } from '../realtime';
 *   const rt = getRealtime();
 *   rt.joinRide(rideId);
 *   const off = rt.on(EV_LOC, (env) => { ... });
 *   rt.sendLocation(rideId, { lat, lng, speed, heading });
 */

import { io, type Socket } from 'socket.io-client';
import { auth as firebaseAuth } from '../lib/firebase';
import { apiClient } from '../lib/apiClient';
import { getPendingSyncEvents, clearPendingSyncEvents, enqueueSyncEvent } from '../lib/offlineSyncDB';
import {
  EV_AUTH_REFRESH, EV_ECHO, EV_ERR, EV_EVENT_ACK, EV_LOC, EV_LOC_PUSH,
  EV_PINS_SUB, EV_PINS_UNSUB, EV_RIDE_EVENT, EV_RIDE_JOIN, EV_RIDE_LEAVE,
  EV_RIDE_SNAPSHOT, EV_RIDE_SYNC, EV_SERVER, ERR_AUTH_EXPIRED,
  ERR_SERVER_DRAINING,
  type AckResult, type Envelope, type LocationTuple,
} from './protocol';
import { useRealtimeStore } from './store';

const SESSION_KEY = 'rtc_session_id';
const TOKEN_KEY = 'rie_token';

// Client-side adaptive gating (mirrors + loosens server gates)
const MOVING_MIN_INTERVAL_MS = 3000;   // send at most every 3s while moving
const STATIONARY_MIN_INTERVAL_MS = 20000; // heartbeat every 20s while parked
const MOVING_MIN_DISTANCE_M = 8;       // or when moved >= 8m
const MAX_BATCH_FIXES = 5;
const FLUSH_INTERVAL_MS = 1500;

// Critical events are queued while offline and flushed on reconnect
const OFFLINE_QUEUE_MAX = 100;

interface PendingFix {
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  ts: number;
}

type EventHandler = (envelope: Envelope) => void;

const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
};

export class RealtimeManager {
  private socket: Socket | null = null;
  private connecting = false;
  private lastFixSentAt = 0;
  private lastSentLoc: { lat: number; lng: number } | null = null;
  private pendingFixes: PendingFix[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private offlineQueue: Array<() => void> = [];
  private handlers = new Map<string, Set<EventHandler>>();
  private joinedRides = new Set<string>();
  private pinsSubscribed = false;
  private lastSeqByRide = new Map<string, number>();

  // ------------------------------------------------------------------ setup
  private ensureSocket(): Socket {
    if (this.socket) return this.socket;
    const url = (import.meta.env.VITE_REALTIME_URL as string) || (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';
    const store = useRealtimeStore.getState();

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,
      reconnectionDelayMax: 8000,
      randomizationFactor: 0.5,          // jitter avoids reconnect storms
      timeout: 10000,
      auth: (cb) => cb(this.authPayload()),
    });

    this.socket.on('connect', () => {
      store.setStatus('connected');
      store.setReconnectAttempt(0);
      // Re-join rooms after every (re)connect - server re-validates authz.
      this.resubscribeAll();
      this.flushOfflineQueue();
      this.startFlushTimer();
      this.flushOfflineSyncDB();
    });

    this.socket.on('disconnect', (reason) => {
      const s = useRealtimeStore.getState();
      s.setStatus(reason === 'io server disconnect' ? 'disconnected' : 'reconnecting');
      if (reason === 'io server disconnect') {
        // Server asked us to go (draining/kick) - socket.io will NOT auto
        // reconnect in this case; schedule our own retry.
        this.socket?.connect();
      }
    });

    this.socket.on('reconnect_attempt', (attempt: number) => {
      const s = useRealtimeStore.getState();
      s.setReconnectAttempt(attempt);
      s.setStatus('reconnecting');
      // Rotate a possibly-expired token into the handshake auth.
      if (this.socket) this.socket.auth = this.authPayload();
    });

    this.socket.on('connect_error', (err: Error) => {
      const s = useRealtimeStore.getState();
      const msg = (err as Error)?.message || '';
      if (msg === ERR_AUTH_EXPIRED || msg === 'AUTH_FAILED') {
        s.setStatus('reconnecting');
        // Token expired mid-lifetime: re-mint from Firebase then retry.
        this.remintToken().then(() => this.socket?.connect()).catch(() => { /* retry later */ });
      } else {
        s.setStatus('reconnecting');
      }
    });

    // Server envelope routing
    this.socket.onAny((event: string, envelope: unknown) => {
      if (event === EV_LOC || event === EV_RIDE_EVENT || event === EV_RIDE_SNAPSHOT) {
        this.route(event, envelope as Envelope);
      }
    });

    this.socket.on(EV_SERVER, (env: Envelope<{ code?: string; sessionId?: string; node?: string; message?: string }>) => {
      const p = env?.p || {};
      if (p.code === 'CONNECTED') {
        try { localStorage.setItem(SESSION_KEY, p.sessionId || ''); } catch { /* ignore */ }
        useRealtimeStore.getState().setSession(p.sessionId || null, p.node || null);
        // Recover missed critical events for rides we believe we're in.
        this.recoverAll();
      }
      if (p.code === ERR_SERVER_DRAINING) {
        useRealtimeStore.getState().setStatus('reconnecting');
      }
    });

    this.socket.on(EV_ERR, (env: Envelope) => {
      console.warn('[realtime] server error', env?.p);
    });

    return this.socket;
  }

  private authPayload() {
    return {
      token: this.getToken(),
      sessionId: this.getSessionId(),
    };
  }

  private getToken(): string {
    try { return localStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; }
  }

  private getSessionId(): string | null {
    try { return localStorage.getItem(SESSION_KEY) || null; } catch { return null; }
  }

  // ------------------------------------------------------------------ lifecycle
  /** Connect on login; safe to call repeatedly. */
  connect() {
    if (this.socket?.connected || this.connecting) return;
    this.connecting = true;
    useRealtimeStore.getState().setStatus('connecting');
    const socket = this.ensureSocket();
    if (!socket.connected) socket.connect();
    this.connecting = false;
  }

  /** Disconnect on logout; clears session state. */
  disconnect() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
    this.joinedRides.clear();
    this.lastSeqByRide.clear();
    this.socket?.disconnect();
    this.socket = null;
    useRealtimeStore.getState().setStatus('idle');
  }

  get status() {
    return useRealtimeStore.getState().status;
  }

  get connected() {
    return !!this.socket?.connected;
  }

  /** Measure current round-trip latency via the echo probe. */
  measureLatency(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.socket?.connected) { resolve(-1); return; }
      const t0 = Date.now();
      this.socket.timeout(4000).emit(EV_ECHO, { t: t0 }, (err: unknown) => {
        resolve(err ? -1 : Date.now() - t0);
      });
    });
  }

  // ------------------------------------------------------------------ routing
  /** Subscribe to a server event type. Returns an unsubscribe function. */
  on(type: string, handler: EventHandler): () => void {
    let set = this.handlers.get(type);
    if (!set) { set = new Set(); this.handlers.set(type, set); }
    set.add(handler);
    return () => { set!.delete(handler); };
  }

  private route(event: string, envelope: Envelope) {
    if (!envelope || typeof envelope !== 'object') return;
    const payload = (envelope.p || {}) as Record<string, unknown>;
    if (event === EV_RIDE_EVENT && envelope.seq) {
      const ride = payload.ride as string | undefined;
      if (ride) this.lastSeqByRide.set(ride, Math.max(this.lastSeqByRide.get(ride) || 0, envelope.seq));
      // Ack critical events (delivery confirmation + latency instrumentation)
      this.socket?.emit(EV_EVENT_ACK, {
        eventId: envelope.eventId,
        seq: envelope.seq,
        rttMs: Math.max(0, Date.now() - (envelope.ts || Date.now())),
      });
    }
    const set = this.handlers.get(event);
    if (set) set.forEach((h) => {
      try { h(envelope); } catch (e) { console.error('[realtime] handler error', e); }
    });
  }

  // ------------------------------------------------------------------ rooms
  /** Join a ride room (server re-checks membership; result arrives via ack). */
  joinRide(rideId: string) {
    if (!rideId || this.joinedRides.has(rideId)) return;
    this.joinedRides.add(rideId);
    this.emitWithAck(EV_RIDE_JOIN, { ride: rideId }).catch(() => { /* forbidden etc. */ });
  }

  leaveRide(rideId: string) {
    if (!rideId) return;
    this.joinedRides.delete(rideId);
    this.lastSeqByRide.delete(rideId);
    this.emitWithAck(EV_RIDE_LEAVE, { ride: rideId }).catch(() => { /* ignore */ });
  }

  subscribePins() {
    if (this.pinsSubscribed) return;
    this.pinsSubscribed = true;
    this.emitWithAck(EV_PINS_SUB, {}).catch(() => { /* ignore */ });
  }

  unsubscribePins() {
    this.pinsSubscribed = false;
    this.emitWithAck(EV_PINS_UNSUB, {}).catch(() => { /* ignore */ });
  }

  /** Ask the server for a fresh snapshot + missed critical events. */
  syncRide(rideId: string) {
    const lastSeq = this.lastSeqByRide.get(rideId) || 0;
    this.emitWithAck(EV_RIDE_SYNC, { ride: rideId, lastSeq }).catch(() => { /* ignore */ });
  }

  private resubscribeAll() {
    this.joinedRides.forEach((rideId) => {
      this.socket?.emit(EV_RIDE_JOIN, { ride: rideId }, () => { /* ack noop */ });
    });
    if (this.pinsSubscribed) this.socket?.emit(EV_PINS_SUB, {}, () => { /* noop */ });
  }

  private recoverAll() {
    this.joinedRides.forEach((rideId) => this.syncRide(rideId));
  }

  // ------------------------------------------------------------------ location
  /**
   * Adaptive GPS ingestion. Call this on every watchPosition fix; the manager
   * decides what is worth sending (distance/time gates), batches, and flushes
   * on a timer. Returns true if the fix was accepted into the batch.
   */
  sendLocation(rideId: string, fix: { lat: number; lng: number; speed: number; heading: number }): boolean {
    if (!rideId) return false;
    const now = Date.now();
    const moving = (fix.speed || 0) > 2;
    const minInterval = moving ? MOVING_MIN_INTERVAL_MS : STATIONARY_MIN_INTERVAL_MS;
    const moved = this.lastSentLoc ? haversine(this.lastSentLoc.lat, this.lastSentLoc.lng, fix.lat, fix.lng) : Infinity;
    const significant = moved >= MOVING_MIN_DISTANCE_M;

    // Always keep the freshest fix for the next flush even if gated now.
    this.pendingFixes.push({
      lat: fix.lat, lng: fix.lng, speed: fix.speed || 0, heading: fix.heading || 0, ts: now,
    });
    if (this.pendingFixes.length > MAX_BATCH_FIXES) {
      this.pendingFixes = this.pendingFixes.slice(-MAX_BATCH_FIXES); // latest wins
    }

    if (now - this.lastFixSentAt < minInterval && !significant) return false;
    this.lastFixSentAt = now;
    this.lastSentLoc = { lat: fix.lat, lng: fix.lng };
    this.flushLocations(rideId);
    return true;
  }

  private startFlushTimer() {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => {
      if (this.pendingFixes.length && this.joinedRides.size) {
        // Flush to the most recently joined ride (single-active-ride UX today)
        const rideId = [...this.joinedRides].pop()!;
        this.flushLocations(rideId);
      }
    }, FLUSH_INTERVAL_MS);
  }

  private flushLocations(rideId: string) {
    if (!this.pendingFixes.length) return;
    const fixes = this.pendingFixes.splice(0, MAX_BATCH_FIXES);
    const payload: LocationTuple[] = fixes.map((f) => [
      'self', round6(f.lat), round6(f.lng), round1(f.speed), round1(f.heading), f.ts,
    ]);
    if (!this.connected) {
      // Offline: fall back to the REST ingest path (existing behaviour).
      this.restTelemetryFallback(rideId, fixes);
      return;
    }
    this.socket!.emit(EV_LOC_PUSH, { ride: rideId, p: payload }, (ack: AckResult) => {
      if (!ack?.ok && ack?.code === 'RATE_LIMITED') {
        // Server says too fast - back off before the next push.
        this.lastFixSentAt = Date.now();
      }
    });
  }

  private restTelemetryFallback(rideId: string, fixes: PendingFix[]) {
    // Save to offline IndexedDB instead of immediately discarding
    fixes.forEach((fix) => {
      enqueueSyncEvent('loc:p', rideId, fix);
    });

    const last = fixes[fixes.length - 1];
    apiClient.post('/api/v1/location/update', {
      ride_id: parseInt(rideId, 10) || rideId,
      latitude: last.lat,
      longitude: last.lng,
      speed: last.speed,
      heading: last.heading,
      timestamp: new Date(last.ts).toISOString(),
    }).catch(() => { /* degraded banner handled by callers via status store */ });
  }

  private async flushOfflineSyncDB() {
    try {
      const pendingEvents = await getPendingSyncEvents();
      if (pendingEvents.length === 0) return;

      // Group by rideId
      const byRide: Record<string, PendingFix[]> = {};
      const keysToDelete: number[] = [];

      for (const event of pendingEvents) {
        if (event.type === 'loc:p') {
          if (!byRide[event.rideId]) byRide[event.rideId] = [];
          byRide[event.rideId].push(event.data as PendingFix);
          keysToDelete.push(event.key);
        }
      }

      for (const [rideId, fixes] of Object.entries(byRide)) {
        // Break into chunks of MAX_BATCH_FIXES (e.g. 5)
        for (let i = 0; i < fixes.length; i += MAX_BATCH_FIXES) {
          const chunk = fixes.slice(i, i + MAX_BATCH_FIXES);
          const payload = chunk.map(f => ['self', round6(f.lat), round6(f.lng), round1(f.speed), round1(f.heading), f.ts]);
          this.socket!.emit(EV_LOC_PUSH, { ride: rideId, p: payload }, () => { /* ack */ });
        }
      }

      await clearPendingSyncEvents(keysToDelete);
    } catch (e) {
      console.error('Failed to flush offline sync db', e);
    }
  }

  // ------------------------------------------------------------------ offline
  /** Queue a critical emit while disconnected; flushed FIFO on reconnect. */
  queueCritical(fn: () => void) {
    if (this.connected) { fn(); return; }
    this.offlineQueue.push(fn);
    if (this.offlineQueue.length > OFFLINE_QUEUE_MAX) this.offlineQueue.shift();
  }

  private flushOfflineQueue() {
    const q = this.offlineQueue.splice(0, this.offlineQueue.length);
    q.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } });
  }

  // ------------------------------------------------------------------ auth
  /** Re-mint the backend JWT from the live Firebase session. */
  private async remintToken() {
    try {
      const user = firebaseAuth.currentUser;
      if (!user) return;
      await user.getIdToken(true); // force-refresh the Firebase session first
      const res = await apiClient.post('/api/v1/auth/firebase-login', {
        email: user.email,
        name: user.displayName,
        firebase_uid: user.uid,
      });
      if (res.data?.access_token) {
        localStorage.setItem(TOKEN_KEY, res.data.access_token);
        if (this.socket) this.socket.auth = this.authPayload();
      }
    } catch (e) {
      console.warn('[realtime] token re-mint failed', e);
    }
  }

  /** Call after any external token refresh to push the new token mid-session. */
  notifyTokenRefreshed() {
    if (this.connected) {
      this.emitWithAck(EV_AUTH_REFRESH, { token: this.getToken() }).catch(() => { /* ignore */ });
    }
  }

  private emitWithAck(event: string, data: unknown): Promise<AckResult> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        this.queueCritical(() => {
          this.socket?.emit(event, data, (ack: AckResult) => {
            if (ack?.ok) resolve(ack);
            else reject(new Error(ack?.code || 'failed'));
          });
        });
        resolve({ ok: true, code: 'QUEUED', ts: Date.now() });
        return;
      }
      this.socket.timeout(8000).emit(event, data, (timeoutErr: unknown, ack: AckResult) => {
        if (timeoutErr) { reject(new Error('timeout')); return; }
        if (ack?.ok) resolve(ack);
        else reject(new Error(ack?.code || 'failed'));
      });
    });
  }
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6;
const round1 = (n: number) => Math.round(n * 10) / 10;

// Module singleton - the whole app shares this one manager + connection.
let instance: RealtimeManager | null = null;
export const getRealtime = (): RealtimeManager => {
  if (!instance) instance = new RealtimeManager();
  return instance;
};
