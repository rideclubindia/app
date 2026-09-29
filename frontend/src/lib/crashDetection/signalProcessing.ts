import type { ProcessedFrame, SensorSample, Vec3 } from './types';

const G = 9.80665; // m/s^2 per g, matching how accelerometers report raw values

function magnitude(v: Vec3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}


export class SignalProcessor {
  private gravity: Vec3 = { x: 0, y: 0, z: G };
  private hasSeenSample = false;
  private readonly gravityAlpha: number;
  private readonly stationaryAccelThresholdG: number;
  private readonly stationaryGyroThresholdDegPerSec: number;

  constructor(opts?: {
    gravityAlpha?: number;
    stationaryAccelThresholdG?: number;
    stationaryGyroThresholdDegPerSec?: number;
  }) {
    this.gravityAlpha = opts?.gravityAlpha ?? 0.02;
    this.stationaryAccelThresholdG = opts?.stationaryAccelThresholdG ?? 0.08;
    this.stationaryGyroThresholdDegPerSec = opts?.stationaryGyroThresholdDegPerSec ?? 8;
  }

  processSample(sample: SensorSample): ProcessedFrame {
    if (!this.hasSeenSample) {
      // Seed the gravity estimate from the first sample instead of an assumed
      // orientation, so mount angle doesn't get misread as a sustained impact.
      this.gravity = { ...sample.accel };
      this.hasSeenSample = true;
    } else {
      const a = this.gravityAlpha;
      this.gravity = {
        x: this.gravity.x * (1 - a) + sample.accel.x * a,
        y: this.gravity.y * (1 - a) + sample.accel.y * a,
        z: this.gravity.z * (1 - a) + sample.accel.z * a,
      };
    }

    const linear: Vec3 = {
      x: sample.accel.x - this.gravity.x,
      y: sample.accel.y - this.gravity.y,
      z: sample.accel.z - this.gravity.z,
    };

    const accelMagnitudeG = magnitude(sample.accel) / G;
    const linearAccelMagnitudeG = magnitude(linear) / G;
    const gyroMagnitudeDegPerSec = magnitude(sample.gyro);

    const motionState: ProcessedFrame['motionState'] =
      linearAccelMagnitudeG < this.stationaryAccelThresholdG &&
      gyroMagnitudeDegPerSec < this.stationaryGyroThresholdDegPerSec
        ? 'stationary'
        : 'moving';

    return {
      t: sample.t,
      accelMagnitudeG,
      linearAccelMagnitudeG,
      gyroMagnitudeDegPerSec,
      motionState,
      gravity: { ...this.gravity },
    };
  }
}
