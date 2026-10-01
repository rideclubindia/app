import { useEffect, useState } from 'react';

// Phone compass heading in degrees (0 = north), or null when the device has no compass
export function useCompassHeading(): number | null {
  const [heading, setHeading] = useState<number | null>(null);
  useEffect(() => {
    let last = -1000, lastAt = 0;
    const onOrient = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      let h: number | null = null;
      if (typeof e.webkitCompassHeading === 'number') h = e.webkitCompassHeading;
      else if (e.absolute && e.alpha != null) h = 360 - e.alpha;
      if (h == null) return;
      const screenAngle = (screen.orientation?.angle ?? 0);
      h = (h + screenAngle + 360) % 360;
      const now = Date.now();
      const diff = Math.abs(((h - last + 540) % 360) - 180);
      // At most ~10 updates a second, and only for turns over 3 degrees
      if (diff < 3 || now - lastAt < 100) return;
      last = h; lastAt = now;
      setHeading(h);
    };
    const evt = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(evt, onOrient as EventListener);
    return () => window.removeEventListener(evt, onOrient as EventListener);
  }, []);
  return heading;
}
