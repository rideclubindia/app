import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

export type NotifyPermission = 'granted' | 'denied' | 'prompt' | 'unsupported';

const isNative = () => Capacitor.isNativePlatform();
const ASKED_KEY = 'rc_notif_asked';

// Current permission, read fresh every time (the rider can change it in system settings at any moment)
export async function getNotificationPermission(): Promise<NotifyPermission> {
  if (isNative()) {
    try {
      const { display } = await LocalNotifications.checkPermissions();
      return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
    } catch { return 'unsupported'; }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  return Notification.permission === 'default' ? 'prompt' : (Notification.permission as NotifyPermission);
}

export async function requestNotificationPermission(): Promise<NotifyPermission> {
  try { localStorage.setItem(ASKED_KEY, '1'); } catch { /* ignore */ }
  if (isNative()) {
    try {
      const { display } = await LocalNotifications.requestPermissions();
      return display === 'granted' ? 'granted' : display === 'denied' ? 'denied' : 'prompt';
    } catch { return 'unsupported'; }
  }
  if (typeof Notification === 'undefined') return 'unsupported';
  const r = await Notification.requestPermission();
  return r === 'default' ? 'prompt' : (r as NotifyPermission);
}

export const hasAskedForNotifications = () => { try { return localStorage.getItem(ASKED_KEY) === '1'; } catch { return false; } };

export interface AppNotification {
  title: string;
  body: string;
  // In-app route opened when the notification is tapped
  route?: string;
  // Same tag replaces the previous notification instead of stacking (e.g. one per group)
  tag?: string;
}

let idCounter = Math.floor(Date.now() % 100000);
const tagIds = new Map<string, number>();

export async function notify(n: AppNotification) {
  if ((await getNotificationPermission()) !== 'granted') return false;
  try {
    if (isNative()) {
      const id = n.tag ? (tagIds.get(n.tag) ?? (tagIds.set(n.tag, ++idCounter), idCounter)) : ++idCounter;
      await LocalNotifications.schedule({ notifications: [{ id, title: n.title, body: n.body, extra: { route: n.route || '/home' }, iconColor: '#EF4523' }] });
    } else {
      const note = new Notification(n.title, { body: n.body, tag: n.tag, icon: '/favicon.svg' });
      note.onclick = () => { window.focus(); if (n.route) window.location.assign(n.route); note.close(); };
    }
    return true;
  } catch {
    return false;
  }
}

// Wires notification taps to in-app navigation (native); call once with the router's navigate
export function onNotificationTap(go: (route: string) => void) {
  if (!isNative()) return () => {};
  const handle = LocalNotifications.addListener('localNotificationActionPerformed', (e) => {
    const route = (e.notification.extra as any)?.route;
    if (typeof route === 'string' && route.startsWith('/')) go(route);
  });
  return () => { handle.then((h) => h.remove()).catch(() => {}); };
}

// Only interrupt when the rider is not already looking at the relevant screen
export const appInBackground = () => typeof document !== 'undefined' && document.visibilityState !== 'visible';
