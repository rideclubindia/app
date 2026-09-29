import { apiClient } from '../apiClient';
import { clearPendingSyncEvents, enqueueSyncEvent, getPendingSyncEvents } from '../offlineSyncDB';
import type { CrashCandidateEvent } from './types';

// Phase 3/5 of Crash Detection & Emergency Response Architecture.md, wired to
// the SOS Countdown & 24/7 Emergency Escalation Architecture.md backend
// (backend/api/routers/emergency.py: POST /api/sos, POST /api/crash-events,
// PATCH /api/sos/{id}). Countdown length/expiry is server-authoritative once
// the create call succeeds (§4 of the SOS doc) — this manager only keeps a
// provisional local timer for the brief window before that response lands,
// or for the fully-offline case (§13).

export type EmergencyPhase = 'idle' | 'countdown' | 'triggered' | 'resolved';

export interface EmergencyManagerState {
  phase: EmergencyPhase;
  sosId: string | null;
  triggerType: 'manual_sos' | 'automatic_crash_sos' | null;
  expiresAt: number | null; // epoch ms, provisional until the server confirms it
  isOffline: boolean;
}

export interface EmergencyLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  speedKph?: number;
  isStale?: boolean;
}

const PROVISIONAL_COUNTDOWN_MS = 120_000; // matches backend SOS_COUNTDOWN_SECONDS default

export class EmergencyManager {
  private state: EmergencyManagerState = {
    phase: 'idle',
    sosId: null,
    triggerType: null,
    expiresAt: null,
    isOffline: false,
  };
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly rideId: string,
    private readonly onChange: (state: EmergencyManagerState) => void
  ) {}

  getState(): EmergencyManagerState {
    return this.state;
  }

  async startFromCrashCandidate(candidate: CrashCandidateEvent, location: EmergencyLocation): Promise<void> {
    this.beginProvisionalCountdown('automatic_crash_sos');
    try {
      const res = await apiClient.post('/crash-events', {
        ride_id: this.rideId,
        location: this.toLocationPayload(location),
        confidence: candidate.confidence,
        peak_acceleration: candidate.peakAccelMagnitudeG,
        rotation_change: candidate.rotationChangeDegPerSec,
        stationary_duration_s: candidate.stationaryDurationMs / 1000,
      });
      this.applyServerConfirmation(res.data.sosId, res.data.expiresAt);
    } catch (err) {
      this.queueOffline('crash_event', {
        ride_id: this.rideId,
        location: this.toLocationPayload(location),
        confidence: candidate.confidence,
        peak_acceleration: candidate.peakAccelMagnitudeG,
        rotation_change: candidate.rotationChangeDegPerSec,
        stationary_duration_s: candidate.stationaryDurationMs / 1000,
      });
    }
  }

  async startManual(location: EmergencyLocation): Promise<void> {
    this.beginProvisionalCountdown('manual_sos');
    try {
      const res = await apiClient.post('/sos', {
        ride_id: this.rideId,
        location: this.toLocationPayload(location),
      });
      this.applyServerConfirmation(res.data.sosId, res.data.expiresAt);
    } catch (err) {
      this.queueOffline('manual_sos', { ride_id: this.rideId, location: this.toLocationPayload(location) });
    }
  }

  /** "I'M OK" / "Cancel SOS" — §5. */
  async confirmSafe(): Promise<void> {
    if (this.state.phase !== 'countdown') return;
    this.stopTicking();
    this.state = { ...this.state, phase: 'resolved' };
    this.emit();

    if (!this.state.sosId) {
      // Still offline/unsynced — nothing to PATCH yet; the queued create
      // will still fire once connectivity returns, but there's no
      // clean way to retract it pre-emptively without a sosId. This is a
      // disclosed limitation of the fully-offline path (Architecture.md §13).
      return;
    }
    try {
      await apiClient.patch(`/sos/${this.state.sosId}`, { status: 'user_cancelled', method: 'i_am_ok' });
    } catch {
      // best-effort — the countdown display has already resolved locally;
      // a failed cancel PATCH here just means the backend's own expiry
      // sweep may still escalate if this never lands, which is the
      // correct fail-safe direction for a safety feature.
    }
  }

  private beginProvisionalCountdown(triggerType: 'manual_sos' | 'automatic_crash_sos'): void {
    this.state = {
      phase: 'countdown',
      sosId: null,
      triggerType,
      expiresAt: Date.now() + PROVISIONAL_COUNTDOWN_MS,
      isOffline: false,
    };
    this.emit();
    this.startTicking();
  }

  private applyServerConfirmation(sosId: string, expiresAtIso: string): void {
    if (this.state.phase !== 'countdown') return; // already cancelled locally
    this.state = { ...this.state, sosId, expiresAt: new Date(expiresAtIso).getTime(), isOffline: false };
    this.emit();
  }

  private queueOffline(kind: 'manual_sos' | 'crash_event', data: unknown): void {
    this.state = { ...this.state, isOffline: true };
    this.emit();
    enqueueSyncEvent(kind, this.rideId, data).catch(() => {});
  }

  private startTicking(): void {
    this.stopTicking();
    this.tickHandle = setInterval(() => {
      if (this.state.phase !== 'countdown' || this.state.expiresAt == null) return;
      if (Date.now() >= this.state.expiresAt) {
        this.stopTicking();
        this.state = { ...this.state, phase: 'triggered' };
        this.emit();
      }
    }, 1000);
  }

  private stopTicking(): void {
    if (this.tickHandle != null) {
      clearInterval(this.tickHandle);
      this.tickHandle = null;
    }
  }

  private toLocationPayload(location: EmergencyLocation) {
    return {
      lat: location.lat,
      lng: location.lng,
      accuracy: location.accuracy ?? null,
      speedKph: location.speedKph ?? null,
      isStale: location.isStale ?? false,
    };
  }

  private emit(): void {
    this.onChange(this.state);
  }

  destroy(): void {
    this.stopTicking();
  }
}

/** Retry any queued offline emergency events — call on reconnect (§13). */
export async function flushQueuedEmergencyEvents(): Promise<void> {
  const pending = await getPendingSyncEvents();
  const relevant = pending.filter((p) => p.type === 'manual_sos' || p.type === 'crash_event');
  const flushed: number[] = [];
  for (const item of relevant) {
    try {
      const path = item.type === 'crash_event' ? '/crash-events' : '/sos';
      await apiClient.post(path, item.data);
      if (item.id != null) flushed.push(item.id);
    } catch {
      // leave it queued, try again on the next reconnect
    }
  }
  if (flushed.length) await clearPendingSyncEvents(flushed);
}
