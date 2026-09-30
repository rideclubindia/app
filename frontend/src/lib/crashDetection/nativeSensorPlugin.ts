import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { Vec3 } from './types';

// Shape sent by CrashSensorPlugin.java (differs from the engine's SensorSample; mapped in useAccidentDetection)
export interface NativeSensorSample { t: number; accelerometer: Vec3; gyroscope: Vec3; samplingRate?: number }

export interface SampleBatchEvent {
  samples: NativeSensorSample[];
}

export interface CrashSensorPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  getAchievedSamplingRate(): Promise<{ samplingRate: number }>;
  addListener(
    eventName: 'sampleBatch',
    listenerFunc: (event: SampleBatchEvent) => void
  ): Promise<PluginListenerHandle>;
}

/**
 * Bridge to the project-local Android plugin at
 * frontend/android/app/src/main/java/com/lakshamride/app/CrashSensorPlugin.java
 * (registered manually in MainActivity, not a published Capacitor plugin).
 * No iOS implementation yet — Architecture.md §9/§15 phases iOS in later.
 */
export const CrashSensor = registerPlugin<CrashSensorPlugin>('CrashSensor');
