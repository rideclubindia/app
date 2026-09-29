import { registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import type { SensorSample } from './types';

export interface SampleBatchEvent {
  samples: SensorSample[];
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
