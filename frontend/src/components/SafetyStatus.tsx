import { useCallback, useEffect, useState } from 'react';
import { Bell, CheckCircle2, CircleAlert, Loader2, MapPin, MessageSquare, Phone, Activity } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission, type NotifyPermission } from '../lib/notify';
import { requestLocation, openLocationSettings, canOpenSettings, locationStatus } from '../lib/locationPermission';
import { loadMyEmergencyContact, type EmergencyContactInfo } from '../lib/emergencyContact';
import { detectEnvironment } from '../lib/sos/sosOrchestrator';
import { getAccidentPreference, setAccidentPreference, requestMotionPermission } from '../lib/crashDetection/useAccidentDetection';
import { EmergencyContactSheet } from './RideStartGate';

type Tone = 'ok' | 'warn' | 'bad';
interface Row { key: string; icon: typeof Bell; title: string; detail: string; tone: Tone; action?: { label: string; run: () => void } }

const locationState = async (): Promise<'granted' | 'denied' | 'prompt' | 'off'> => {
  const st = await locationStatus();
  if (!st) return 'prompt';
  // Android can't tell "never asked" from "denied"; Allow asks again and falls back to settings if blocked
  if (!st.granted) return 'prompt';
  return st.servicesEnabled ? 'granted' : 'off';
};

// Readiness checklist, re-read from the system every time it is shown or the app returns to the foreground
export default function SafetyStatus() {
  const [notif, setNotif] = useState<NotifyPermission | null>(null);
  const [loc, setLoc] = useState<'granted' | 'denied' | 'prompt' | 'off' | null>(null);
  const [contact, setContact] = useState<EmergencyContactInfo | null | undefined>(undefined);
  const [sms, setSms] = useState<{ direct: boolean; composer: boolean; native: boolean } | null>(null);
  const [accident, setAccident] = useState(getAccidentPreference());
  const [editing, setEditing] = useState(false);

  const refresh = useCallback(async () => {
    const [n, l, c, env] = await Promise.all([
      getNotificationPermission(), locationState(),
      loadMyEmergencyContact().then((r) => r.primary).catch(() => null),
      detectEnvironment().catch(() => null),
    ]);
    setNotif(n); setLoc(l); setContact(c); setAccident(getAccidentPreference());
    setSms(env ? { direct: env.smsDirect && env.smsPermission, composer: env.smsComposer, native: env.native } : null);
  }, []);

  useEffect(() => {
    refresh();
    const onVis = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [refresh]);

  if (notif === null || contact === undefined) {
    return <div className="rounded-2xl bg-white border border-gray-100 p-5 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;
  }

  const settings = canOpenSettings() ? { label: 'Open settings', run: () => openLocationSettings('app') } : undefined;
  const rows: Row[] = [
    {
      key: 'contact', icon: Phone, title: 'Emergency contact',
      detail: contact ? `${contact.name} · ${contact.phone}` : 'Required before you can start a ride',
      tone: contact ? 'ok' : 'bad', action: { label: contact ? 'Edit' : 'Add', run: () => setEditing(true) },
    },
    {
      key: 'loc', icon: MapPin, title: 'Location',
      detail: loc === 'granted' ? 'Allowed. Background tracking runs only during a live ride' : loc === 'denied' ? 'Blocked. Live rides, SOS location and navigation won\'t work' : loc === 'off' ? 'Allowed, but location (GPS) is turned off on this phone' : 'Not allowed yet',
      tone: loc === 'granted' ? 'ok' : 'bad',
      action: loc === 'granted' ? undefined : loc === 'denied' ? settings
        : loc === 'off' ? (canOpenSettings() ? { label: 'Turn on', run: () => { openLocationSettings('services'); } } : undefined)
        : { label: 'Allow', run: () => requestLocation().then((r) => { if (r.status === 'denied' && canOpenSettings()) openLocationSettings('app'); refresh(); }) },
    },
    {
      key: 'notif', icon: Bell, title: 'Notifications',
      detail: notif === 'granted' ? 'On for rides, group messages and SOS' : notif === 'denied' ? 'Blocked. You\'ll miss ride starts, SOS alerts and messages' : notif === 'unsupported' ? 'Not supported on this device' : 'Not allowed yet',
      tone: notif === 'granted' ? 'ok' : notif === 'unsupported' ? 'warn' : 'bad',
      action: notif === 'prompt' ? { label: 'Allow', run: () => requestNotificationPermission().then(refresh) } : notif === 'denied' ? settings : undefined,
    },
    {
      key: 'accident', icon: Activity, title: 'Accident detection',
      detail: accident === 'on' ? 'On during live rides. Uses motion sensors' : accident === 'off' ? 'Off. Crashes won\'t trigger an automatic alert' : 'Not set up',
      tone: accident === 'on' ? 'ok' : 'warn',
      action: accident === 'on' ? { label: 'Turn off', run: () => { setAccidentPreference('off'); setAccident('off'); } }
        : { label: 'Turn on', run: async () => { if (await requestMotionPermission()) { setAccidentPreference('on'); setAccident('on'); } } },
    },
    {
      key: 'sms', icon: MessageSquare, title: 'SMS fallback',
      detail: !sms ? 'Unknown' : sms.direct ? 'Can text your contact automatically without internet' : sms.composer ? 'Opens your SMS app with the message ready; you tap send' : 'Not available. SOS uses internet only',
      tone: !sms ? 'warn' : sms.direct ? 'ok' : 'warn',
    },
  ];

  const tone = (t: Tone) => t === 'ok' ? 'text-emerald-600' : t === 'warn' ? 'text-amber-500' : 'text-red-600';

  return (
    <>
      <div className="rounded-2xl bg-white border border-gray-100 divide-y divide-gray-100">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.key} className="flex items-center gap-3 p-4">
              <span className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 text-gray-700"><Icon className="w-5 h-5" /></span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-950 flex items-center gap-1.5">
                  {r.title}
                  {r.tone === 'ok' ? <CheckCircle2 className={`w-4 h-4 ${tone(r.tone)}`} /> : <CircleAlert className={`w-4 h-4 ${tone(r.tone)}`} />}
                </p>
                <p className="text-[13px] text-gray-500 mt-0.5">{r.detail}</p>
              </div>
              {r.action && (
                <button onClick={r.action.run} className="h-9 px-3.5 rounded-full bg-gray-950 text-white text-[13px] font-semibold shrink-0 cursor-pointer">{r.action.label}</button>
              )}
            </div>
          );
        })}
      </div>
      {editing && (
        <EmergencyContactSheet
          initial={contact || undefined}
          onCancel={() => setEditing(false)}
          onDone={() => { setEditing(false); refresh(); }}
        />
      )}
    </>
  );
}
