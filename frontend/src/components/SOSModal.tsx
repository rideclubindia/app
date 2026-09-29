import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Phone, Undo2, Navigation, ShieldCheck, ShieldOff, RotateCw } from 'lucide-react';
import { useToast } from './ToastContext';
import { useSosStore, sendAgain, type OnlineState, type SmsState, type SmsRecipientState, type ContactSmsState } from '../lib/sos/sosOrchestrator';

interface SOSData {
  coordinates: string;
  riderName: string;
  bikeDetails: string;
  bloodGroup: string;
  emergencyContact: string;
}

interface Props {
  isReceiving: boolean;
  data: SOSData;
  onTrigger?: () => void;
  onRevoke?: () => void;
  onNavigate?: (lat: number, lng: number) => void;
  onClose: () => void;
  isCrashDetectionActive?: boolean;
  onToggleCrashDetection?: () => void;
  sosEventId?: string | null;
  memberUid?: string;
  crashDetectionStatus?: string;
}

const ONLINE_LABEL: Record<OnlineState, [string, Tone]> = {
  idle: ['Preparing emergency alert', 'wait'],
  sending: ['Sending…', 'wait'],
  delivered_to_group: ['Group alerted', 'ok'],
  queued: ['Queued · retries when online', 'warn'],
  failed: ['Delivery failed', 'bad'],
};
const SMS_LABEL: Record<SmsState, [string, Tone]> = {
  not_needed: ['Not needed (online)', 'muted'],
  preparing: ['Preparing SMS…', 'wait'],
  attempted: ['Handed to phone network', 'wait'],
  composer_opened: ['SMS app opened · tap Send', 'warn'],
  unavailable: ['SMS unavailable on this device', 'bad'],
  permission_denied: ['SMS permission denied', 'bad'],
  no_contacts: ['No emergency contacts', 'bad'],
  failed: ['SMS failed', 'bad'],
};
const CONTACT_SMS_LABEL: Record<ContactSmsState, [string, Tone]> = {
  not_sent: ['Waiting for internet', 'muted'],
  confirmed: ['SMS confirmed by gateway', 'ok'],
  not_confirmed: ['Delivery not confirmed', 'warn'],
  no_gateway: ['SMS gateway not configured', 'warn'],
};
type Tone = 'ok' | 'warn' | 'bad' | 'wait' | 'muted';
const TONE: Record<Tone, string> = {
  ok: 'text-green-700 bg-green-50', warn: 'text-amber-700 bg-amber-50', bad: 'text-red-700 bg-red-50',
  wait: 'text-gray-700 bg-gray-100', muted: 'text-gray-500 bg-gray-50',
};

const recipientSummary = (r: Record<string, SmsRecipientState>) => {
  const v = Object.values(r);
  if (!v.length) return null;
  const n = (s: SmsRecipientState) => v.filter((x) => x === s).length;
  const parts = [n('delivered') && `${n('delivered')} delivered`, n('sent') && `${n('sent')} sent, delivery unknown`, n('pending') && `${n('pending')} sending`, (n('failed') + n('delivery_failed')) && `${n('failed') + n('delivery_failed')} failed`].filter(Boolean);
  return parts.join(' · ');
};

const SosStatusPanel = ({ eventId, memberUid }: { eventId: string; memberUid: string }) => {
  const ev = useSosStore((s) => s.events.find((e) => e.id === eventId));
  const env = useSosStore((s) => s.env);
  const [resending, setResending] = useState(false);
  if (!ev) return null;
  const smsRow: [string, Tone] = ev.sms === 'attempted' && recipientSummary(ev.smsRecipients)
    ? [recipientSummary(ev.smsRecipients)!, Object.values(ev.smsRecipients).some((s) => s === 'delivered') ? 'ok' : 'wait']
    : SMS_LABEL[ev.sms];
  const rows: [string, [string, Tone]][] = [
    ['Internet', env ? (env.internet ? ['Available', 'ok'] : ['Unavailable', 'bad']) : ['Checking…', 'wait']],
    ['Location', ev.location ? [ev.location.stale ? 'Last known location' : `Available${ev.location.accuracy ? ` · ±${Math.round(ev.location.accuracy)} m` : ''}`, ev.location.stale ? 'warn' : 'ok'] : ['Location unavailable', 'bad']],
    ['Emergency contacts', ev.contacts.length ? [`${ev.contacts.length}`, 'ok'] : ['None saved', 'bad']],
    ['Ride group', ONLINE_LABEL[ev.online]],
    ['Contacts via server', ev.online === 'delivered_to_group' ? CONTACT_SMS_LABEL[ev.contactSms] : ['Waiting for internet', 'muted']],
    ['SMS fallback', smsRow],
  ];
  return (
    <div className="rounded-xl border border-red-100 bg-white overflow-hidden">
      <div className="px-3 py-2 bg-red-50 border-b border-red-100 flex items-center justify-between">
        <span className="text-[12px] font-bold text-red-700 tracking-wide">SOS ACTIVE</span>
        <span className="text-[11px] text-red-700/80 tabular-nums">{new Date(ev.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(([k, [v, tone]]) => (
          <div key={k} className="flex items-center justify-between gap-3 px-3 py-2">
            <span className="text-[12px] text-gray-600">{k}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full text-right ${TONE[tone]}`}>{v}</span>
          </div>
        ))}
      </div>
      {ev.lastError && ev.online !== 'delivered_to_group' && (
        <p className="px-3 py-2 text-[11px] text-gray-600 border-t border-gray-100">
          {ev.online === 'queued' ? 'Could not reach RideClub. Your alert is saved on this phone and will be sent automatically when the connection returns. ' : ''}
          {!ev.contacts.length ? 'Add an emergency contact in your profile so SMS can reach someone.' : ''}
        </p>
      )}
      <button
        onClick={async () => { setResending(true); try { await sendAgain(ev.id, memberUid); } finally { setResending(false); } }}
        disabled={resending}
        className="w-full h-11 border-t border-gray-100 text-[13px] font-semibold text-red-700 hover:bg-red-50 flex items-center justify-center gap-1.5 disabled:opacity-50"
      >
        <RotateCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} /> {resending ? 'Sending again…' : 'Send again'}
      </button>
    </div>
  );
};

export const SOSModal: React.FC<Props> = ({ 
  isReceiving, 
  data, 
  onTrigger, 
  onRevoke,
  onNavigate,
  onClose, 
  isCrashDetectionActive = true,
  onToggleCrashDetection,
  sosEventId,
  memberUid = '',
  crashDetectionStatus
}) => {
  const [sending, setSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isRevoking, setIsRevoking] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const { showToast } = useToast();

  // When receiving, play a buzzer sound
  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    if (isReceiving) {
      audio = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');
      audio.loop = true;
      audio.play().catch(e => console.warn('Audio play failed', e));
    }
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [isReceiving]);

  const handleTrigger = async () => {
    if (onTrigger) {
      setSending(true);
      setSendError(null);
      try {
        await onTrigger();
        setIsSent(true);
      } catch (err: any) {
        console.error('SOS trigger failed:', err);
        setSendError(err?.message || 'Failed to send SOS. Please try again.');
        showToast('Failed to send SOS. Please try again.', 'error');
      } finally {
        setSending(false);
      }
    }
  };

  const handleRevoke = async () => {
    if (onRevoke) {
      setIsRevoking(true);
      await onRevoke();
      setIsRevoking(false);
      setIsSent(false);
    }
  };

  const handleNavigate = () => {
    const [lat, lng] = data.coordinates.split(',').map(s => parseFloat(s.trim()));
    if (!isNaN(lat) && !isNaN(lng) && onNavigate) {
      onNavigate(lat, lng);
      onClose();
    }
  };

  const handleCall = () => {
    const phoneMatch = data.emergencyContact.match(/\+?\d[\d\-\s]+/);
    if (phoneMatch) {
      window.location.href = `tel:${phoneMatch[0].replace(/[\s-]/g, '')}`;
    } else {
      showToast('Could not extract a valid phone number.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-[8px] shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center shrink-0 animate-pulse">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="block text-[9px] font-bold text-white/70 uppercase tracking-[0.2em] leading-none">Emergency Mode</span>
              <h2 className="text-[15px] font-semibold text-white leading-tight truncate mt-0.5">
                {isReceiving ? 'SOS Alert Received' : 'Send SOS Alert'}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto hide-scrollbar p-4 flex flex-col gap-3">

          <p className="text-[12px] text-gray-500 font-medium leading-relaxed">
            {isReceiving 
              ? <><strong className="text-[#111111]">{data.riderName}</strong> has triggered an emergency SOS. Respond immediately or contact their emergency contact.</>
              : 'Shares your live location, rider details and emergency info with your group and emergency contacts.'}
          </p>

          {!isReceiving ? (
            <>
              {sosEventId ? (
                <SosStatusPanel eventId={sosEventId} memberUid={memberUid} />
              ) : (
                <button
                  onClick={handleTrigger}
                  disabled={sending}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98] shadow-lg shadow-red-500/25"
                >
                  {sending ? 'Preparing emergency alert…' : 'Send Emergency Alert'}
                </button>
              )}

              {sendError && !isSent && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 flex flex-col gap-2">
                  <p className="text-red-500 text-[12px] font-semibold">{sendError}</p>
                  <button
                    onClick={handleTrigger}
                    disabled={sending}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg text-[12px] transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Retrying...' : 'Try Again'}
                  </button>
                </div>
              )}

              {(isSent || sosEventId) && (
                <button
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl text-[13px] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Undo2 className="w-4 h-4" />
                  {isRevoking ? 'Revoking...' : 'Revoke SOS — False Alarm'}
                </button>
              )}

              {/* Crash Detection Toggle */}
              <button
                onClick={onToggleCrashDetection}
                className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2 text-[12px] font-semibold text-[#111111]">
                  {isCrashDetectionActive ? <ShieldCheck className="w-4 h-4 text-green-500" /> : <ShieldOff className="w-4 h-4 text-gray-400" />}
                  Accident Detection
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isCrashDetectionActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  {crashDetectionStatus || (isCrashDetectionActive ? 'ACTIVE' : 'OFF')}
                </span>
              </button>
            </>
          ) : (
            <button 
              onClick={onClose}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold text-[14px] py-3 rounded-xl transition-colors active:scale-[0.98] shadow-lg shadow-red-500/25"
            >
              Acknowledge & Stop Alarm
            </button>
          )}

          {/* Actions Row */}
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={handleCall}
              className="bg-[#111111] hover:bg-black text-white font-semibold py-2.5 rounded-xl transition-colors text-center text-[12px] flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Phone className="w-3.5 h-3.5" /> Call Contact
            </button>
            <button 
              onClick={handleNavigate}
              className="bg-[#FF5A00] hover:bg-[#ff6a1a] text-white font-semibold py-2.5 rounded-xl transition-colors text-center text-[12px] flex items-center justify-center gap-1.5 active:scale-[0.98]"
            >
              <Navigation className="w-3.5 h-3.5" /> Navigate
            </button>
          </div>

          {/* Shared Data */}
          <div className="pt-1">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
              {isReceiving ? 'Emergency Information' : 'Data Shared Instantly'}
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              <DataTile label="Coordinates" value={data.coordinates} />
              <DataTile label="Rider" value={data.riderName} />
              <DataTile label="Bike" value={data.bikeDetails} />
              <DataTile label="Blood Group" value={data.bloodGroup} />
              <DataTile label="Emergency Contact" value={data.emergencyContact} wide />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataTile = ({ label, value, wide }: { label: string, value: string, wide?: boolean }) => (
  <div className={`bg-gray-50 rounded-lg px-2.5 py-2 border border-gray-100 ${wide ? 'col-span-2' : ''}`}>
    <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">{label}</span>
    <span className="block text-[11px] font-semibold text-[#111111] truncate">{value || '--'}</span>
  </div>
);
