import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export type LockOrientation = 'portrait' | 'landscape' | 'any';

// Real orientation locking, not just a CSS media-query layout swap:
// - On native (Android/iOS via Capacitor), uses the ScreenOrientation
//   plugin to actually rotate + lock the device.
// - On the web (installed PWA / some mobile browsers), falls back to the
//   Screen Orientation API. Desktop and unsupported browsers just reject
//   silently — there's nothing to lock there, and pages already render
//   fine at any window shape.
const applyLock = async (orientation: LockOrientation) => {
  try {
    if (Capacitor.isNativePlatform()) {
      const { ScreenOrientation } = await import('@capacitor/screen-orientation');
      // 'any' hands rotation back to the user (device auto-rotate)
      if (orientation === 'any') await ScreenOrientation.unlock();
      else await ScreenOrientation.lock({ orientation });
      return;
    }
  } catch (e) {
    // Native plugin not available/failed — fall through to the web API.
  }
  try {
    const so = (screen as any).orientation;
    if (orientation === 'any') so?.unlock?.();
    else if (so?.lock) await so.lock(orientation);
  } catch (e) {
    // Not supported here (most desktop browsers, iOS Safari, etc.) — the
    // page's own portrait:/landscape: responsive classes still apply
    // based on whatever the actual window/device shape is.
  }
};

/**
 * Locks the screen to `orientation` for as long as the calling component is
 * mounted, and restores a portrait lock the moment it unmounts — covering
 * back buttons, close actions, tab switches, and any other way of leaving
 * the screen. Only Ride and Navigation screens should ever call this with
 * 'landscape'; every other screen either doesn't call it at all (inheriting
 * whatever the nearest ancestor set) or explicitly locks 'portrait'.
 */
export function useOrientationLock(orientation: LockOrientation) {
  useEffect(() => {
    applyLock(orientation);
    return () => {
      applyLock('portrait');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orientation]);
}
