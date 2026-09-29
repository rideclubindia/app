import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { useEffect, useRef, useState } from 'react';
import { CrashDetectionEngine } from './engine';
import { EmergencyManager, flushQueuedEmergencyEvents, type EmergencyLocation, type EmergencyManagerState } from './emergencyManager';
import { CrashSensor, type SampleBatchEvent } from './nativeSensorPlugin';

const IDLE_STATE: EmergencyManagerState = { phase: 'idle', sosId: null, triggerType: null, expiresAt: null, isOffline: false };

/**
 * Phase 3/5 of Crash Detection & Emergency Response Architecture.md, wired to
 * the real Emergency Manager (supersedes the Phase 2 log-only
 * useCrashDetectionDebug hook). Runs the native sensor stream through the
 * Phase 1 engine while `rideId` is set; on CRASH_SUSPECTED, starts the
 * countdown via EmergencyManager, which itself talks to the backend from
 * SOS Escalation Architecture.md.
 */
export function useCrashDetection(rideId: string | undefined, getLocation: () => EmergencyLocation | null) {
  const [uiState, setUiState] = useState<EmergencyManagerState>(IDLE_STATE);
  const managerRef = useRef<EmergencyManager | null>(null);
  const getLocationRef = useRef(getLocation);
  useEffect(() => {
    getLocationRef.current = getLocation;
  }, [getLocation]);

  useEffect(() => {
    const onOnline = () => {
      flushQueuedEmergencyEvents().catch(() => {});
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  useEffect(() => {
    if (!rideId || !Capacitor.isNativePlatform()) {
      return;
    }

    const engine = new CrashDetectionEngine();
    const manager = new EmergencyManager(rideId, setUiState);
    managerRef.current = manager;

    let listenerHandle: PluginListenerHandle | null = null;
    let cancelled = false;

    (async () => {
      const handle = await CrashSensor.addListener('sampleBatch', (event: SampleBatchEvent) => {
        for (const sample of event.samples) {
          const result = engine.processSample(sample);
          if (result.event) {
            const location = getLocationRef.current();
            if (location) {
              manager.startFromCrashCandidate(result.event, location).catch(() => {});
            }
          }
        }
      });
      if (cancelled) {
        await handle.remove();
        return;
      }
      listenerHandle = handle;
      await CrashSensor.start();
    })().catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('[crash-detection] failed to start native sensor stream', err);
    });

    return () => {
      cancelled = true;
      CrashSensor.stop().catch(() => {});
      listenerHandle?.remove();
      manager.destroy();
      managerRef.current = null;
      setUiState(IDLE_STATE);
    };
  }, [rideId]);

  return {
    emergencyState: uiState,
    confirmSafe: () => managerRef.current?.confirmSafe(),
    triggerManualSos: (location: EmergencyLocation) => managerRef.current?.startManual(location),
  };
}
