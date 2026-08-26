import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Phone, Undo2, Navigation, ShieldCheck, ShieldOff } from 'lucide-react';
import { useToast } from './ToastContext';

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
}

export const SOSModal: React.FC<Props> = ({ 
  isReceiving, 
  data, 
  onTrigger, 
  onRevoke,
  onNavigate,
  onClose, 
  isCrashDetectionActive = true,
  onToggleCrashDetection
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
              <button
                onClick={handleTrigger}
                disabled={sending || isSent}
                className={`w-full ${isSent ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white font-semibold text-[14px] py-3 rounded-xl transition-colors disabled:opacity-50 active:scale-[0.98] shadow-lg ${isSent ? 'shadow-green-500/25' : 'shadow-red-500/25'}`}
              >
                {sending ? 'Sending...' : isSent ? 'SOS Alert Sent!' : 'Trigger Emergency Alert'}
              </button>

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

              {isSent && (
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
                  Crash Detection
                </span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isCrashDetectionActive ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'}`}>
                  {isCrashDetectionActive ? 'ACTIVE' : 'OFF'}
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
