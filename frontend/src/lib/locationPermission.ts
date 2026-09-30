import { Capacitor, registerPlugin } from '@capacitor/core';
import { useLocationStore } from '../store/useLocationStore';

const AppSettings = registerPlugin<{ open(): Promise<{ opened: boolean }>; openLocationServices(): Promise<{ opened: boolean }>; locationStatus(): Promise<{ granted: boolean; precise: boolean; servicesEnabled: boolean }> }>('AppSettings');

export type LocationRequestResult =
  | { status: 'granted'; lat: number; lng: number }
  | { status: 'denied' }
  | { status: 'unavailable' };

// Triggers the system permission prompt (Android shows it again unless the rider chose "Don't allow" permanently)
export const requestLocation = (): Promise<LocationRequestResult> =>
  new Promise((resolve) => {
    if (!navigator.geolocation) return resolve({ status: 'unavailable' });
    navigator.geolocation.getCurrentPosition(
      (p) => {
        useLocationStore.setState({ coordinates: { lat: p.coords.latitude, lng: p.coords.longitude } } as any);
        resolve({ status: 'granted', lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (e) => resolve(e.code === e.PERMISSION_DENIED ? { status: 'denied' } : { status: 'unavailable' }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });

export const canOpenSettings = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

// Blocked permission: app settings. GPS switched off: the phone's location services page.
export const openLocationSettings = async (which: 'app' | 'services' = 'app') => {
  if (!canOpenSettings()) return false;
  try { return (await (which === 'app' ? AppSettings.open() : AppSettings.openLocationServices())).opened; } catch { return false; }
};

// Native: exact permission/GPS state with no dialog; web: the Permissions API (null when unknown)
export const locationStatus = async (): Promise<{ granted: boolean; servicesEnabled: boolean } | null> => {
  if (canOpenSettings()) { try { return await AppSettings.locationStatus(); } catch { /* older app build without this method */ } }
  try { const q = await navigator.permissions?.query({ name: 'geolocation' as PermissionName }); if (q && q.state !== 'prompt') return { granted: q.state === 'granted', servicesEnabled: true }; } catch { /* unsupported */ }
  return null;
};
