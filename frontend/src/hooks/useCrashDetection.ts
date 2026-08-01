import { useState, useEffect, useCallback, useRef } from 'react';

interface UseCrashDetectionProps {
  onCrashDetected: () => void;
  isActive: boolean;
}

// Trigger if G-force exceeds ~4G (approx 40 m/s^2)
const CRASH_THRESHOLD = 40;
// Require this many consecutive over-threshold samples before treating it as a crash,
// to avoid firing on a single noisy accelerometer reading (e.g. dropping the phone once).
const REQUIRED_CONSECUTIVE_SAMPLES = 2;

export const useCrashDetection = ({ onCrashDetected, isActive }: UseCrashDetectionProps) => {
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const consecutiveOverThresholdRef = useRef(0);

  const handleMotion = useCallback((event: DeviceMotionEvent) => {
    if (!isActive || isCountingDown) return;

    const acc = event.accelerationIncludingGravity;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    // Calculate total vector magnitude (G-force)
    const magnitude = Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);

    if (magnitude > CRASH_THRESHOLD) {
      consecutiveOverThresholdRef.current += 1;
      if (consecutiveOverThresholdRef.current >= REQUIRED_CONSECUTIVE_SAMPLES) {
        // High impact detected across consecutive samples
        consecutiveOverThresholdRef.current = 0;
        setIsCountingDown(true);
        setCountdown(10);
      }
    } else {
      consecutiveOverThresholdRef.current = 0;
    }
  }, [isActive, isCountingDown]);

  useEffect(() => {
    if (isActive) {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, [isActive, handleMotion]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isCountingDown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (isCountingDown && countdown === 0) {
      // Countdown finished without cancellation, trigger SOS!
      onCrashDetected();
      setIsCountingDown(false);
      setCountdown(10);
    }
    return () => clearInterval(timer);
  }, [isCountingDown, countdown, onCrashDetected]);

  const cancelCountdown = () => {
    setIsCountingDown(false);
    setCountdown(10);
  };

  return { isCountingDown, countdown, cancelCountdown };
};
