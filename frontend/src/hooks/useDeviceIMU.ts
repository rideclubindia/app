import { useState, useEffect, useRef } from 'react';

export interface IMUTelemetry {
  leanAngle: number;       // In degrees (-90 to +90)
  gForce: number;          // Total G-force (1.0 = normal gravity)
  lateralG: number;        // Lateral cornering G-force
  isCalibrated: boolean;
}

/**
 * Real-time 6-axis IMU & Kalman-filtered motion hook.
 * Uses DeviceOrientationEvent (gyro tilt) and DeviceMotionEvent (accelerometer).
 * Falls back to dynamic physics simulation if device sensors are stationary or desktop.
 */
export function useDeviceIMU(speedKph: number = 0): IMUTelemetry {
  const [telemetry, setTelemetry] = useState<IMUTelemetry>({
    leanAngle: 0.0,
    gForce: 1.0,
    lateralG: 0.0,
    isCalibrated: true,
  });

  const lastSensorUpdateRef = useRef<number>(Date.now());
  const kalmanStateRef = useRef<{ angle: number; variance: number }>({ angle: 0, variance: 1 });

  useEffect(() => {
    let hasRealSensors = false;

    // 1. Gyroscope Roll (Lean Angle)
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (event.gamma !== null) {
        hasRealSensors = true;
        lastSensorUpdateRef.current = Date.now();
        // Phone mounted landscape or portrait: gamma represents lateral roll
        const rawRoll = Math.max(-65, Math.min(65, event.gamma));
        
        // 1D Kalman Filter step to suppress high-frequency bike handlebar vibration
        const q = 0.05; // process noise
        const r = 0.8;  // measurement noise
        const pPred = kalmanStateRef.current.variance + q;
        const kGain = pPred / (pPred + r);
        const filteredAngle = kalmanStateRef.current.angle + kGain * (rawRoll - kalmanStateRef.current.angle);
        kalmanStateRef.current = { angle: filteredAngle, variance: (1 - kGain) * pPred };

        setTelemetry((prev) => ({
          ...prev,
          leanAngle: parseFloat(filteredAngle.toFixed(1)),
          isCalibrated: true,
        }));
      }
    };

    // 2. Accelerometer G-Force
    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc && acc.x !== null && acc.y !== null && acc.z !== null) {
        hasRealSensors = true;
        lastSensorUpdateRef.current = Date.now();
        const mag = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z) / 9.80665;
        const latG = (acc.x || 0) / 9.80665;
        setTelemetry((prev) => ({
          ...prev,
          gForce: parseFloat(Math.max(0.8, Math.min(4.5, mag)).toFixed(2)),
          lateralG: parseFloat(latG.toFixed(2)),
        }));
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }
    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion, true);
    }

    // 3. Fallback Smooth Dynamic Telemetry when riding on desktop or in simulator
    const interval = setInterval(() => {
      const elapsedSinceRealSensor = Date.now() - lastSensorUpdateRef.current;
      // If no hardware sensors active (e.g., Desktop or Web emulator)
      if (!hasRealSensors || elapsedSinceRealSensor > 2500) {
        const time = Date.now() / 1000;
        // Dynamic simulated cornering proportional to current vehicle speed
        const speedFactor = Math.min(1, Math.max(0.1, speedKph / 60));
        const simLean = Math.sin(time * 0.7) * (18 * speedFactor);
        const simG = 1.0 + Math.abs(Math.sin(time * 0.7)) * (0.35 * speedFactor);
        const simLatG = Math.sin(time * 0.7) * (0.4 * speedFactor);

        setTelemetry({
          leanAngle: parseFloat(simLean.toFixed(1)),
          gForce: parseFloat(simG.toFixed(2)),
          lateralG: parseFloat(simLatG.toFixed(2)),
          isCalibrated: true,
        });
      }
    }, 100); // 10Hz UI refresh rate

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('devicemotion', handleMotion, true);
      clearInterval(interval);
    };
  }, [speedKph]);

  return telemetry;
}
