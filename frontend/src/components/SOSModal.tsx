import React, { useEffect, useState } from 'react';
import { X, AlertCircle, Navigation, Phone, Undo2 } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-[100] bg-dark/60 backdrop-blur-md overflow-y-auto p-4 flex flex-col">
      <div className="w-full max-w-md mx-auto my-auto flex flex-col gap-4 py-8">
        {/* Header Options */}
        <div className="flex justify-between items-center">
          <div className="bg-danger px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg">
            Emergency mode
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-dark hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Card: Action */}
        <div className="bg-white shadow-2xl rounded-[32px] p-6 flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-danger/10 flex items-center justify-center mb-6">
            <div className="w-14 h-14 rounded-full bg-danger flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(255,59,48,0.5)]">
              <AlertCircle className="w-7 h-7 text-white" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-dark mb-3 text-center">
            {isReceiving ? 'SOS Alert Received' : 'Send SOS alert'}
          </h2>
          
          <p className="text-gray-500 text-center mb-4 px-4 font-medium">
            {isReceiving 
              ? `${data.riderName} has triggered an emergency SOS. Please respond immediately or contact their emergency contact.`
              : 'Share your live location, rider details, and emergency information with your group and emergency contacts.'}
          </p>

          {!isReceiving && (
            <>
              <button
                onClick={handleTrigger}
                disabled={sending || isSent}
                className={`w-full ${isSent ? 'bg-green-500 hover:bg-green-600' : 'bg-danger hover:bg-danger/90'} text-white font-black text-lg py-4 rounded-xl mb-3 transition-colors disabled:opacity-50`}
              >
                {sending ? 'Sending...' : isSent ? 'SOS Alert Sent!' : 'Trigger emergency alert'}
              </button>

              {/* Error + retry — shown when the trigger call failed */}
              {sendError && !isSent && (
                <div className="w-full bg-danger/10 border border-danger/20 rounded-xl p-4 mb-3 flex flex-col gap-2">
                  <p className="text-danger text-sm font-bold">{sendError}</p>
                  <button
                    onClick={handleTrigger}
                    disabled={sending}
                    className="w-full bg-danger hover:bg-danger/90 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {sending ? 'Retrying...' : 'Try Again'}
                  </button>
                </div>
              )}

              {/* Revoke SOS button — only visible after sending */}
              {isSent && (
                <button 
                  onClick={handleRevoke}
                  disabled={isRevoking}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 rounded-xl mb-3 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Undo2 className="w-5 h-5" />
                  {isRevoking ? 'Revoking...' : 'Revoke SOS — False alarm'}
                </button>
              )}

              <button 
                onClick={onToggleCrashDetection}
                className="w-full bg-gray-100 hover:bg-gray-200 text-dark font-bold py-4 rounded-xl transition-colors"
              >
                {isCrashDetectionActive ? 'Crash detection monitoring is active' : 'Enable Crash Detection'}
              </button>
            </>
          )}
          {isReceiving && (
            <button 
              onClick={onClose}
              className="w-full bg-danger hover:bg-danger/90 text-white font-black text-lg py-4 rounded-xl mb-4 transition-colors"
            >
              Acknowledge & Stop Alarm
            </button>
          )}
        </div>

        {/* Middle Card: Before you send & Actions */}
        {!isReceiving && (
          <div className="bg-[#f2f4f7] rounded-[32px] p-6 relative overflow-hidden">
            <div className="absolute left-0 top-8 w-4 h-14 bg-[#facc15] rounded-r-full" />
            <div className="pl-4 mb-6">
              <h3 className="text-[22px] font-bold text-dark mb-2">Before you send</h3>
              <p className="text-[#64748b] text-[15px] leading-relaxed font-medium">
                Use SOS only for urgent situations such as crash, injury, medical emergency, or if you are stranded off route.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const phoneMatch = data.emergencyContact.match(/\+?\d[\d\-\s]+/);
                  if (phoneMatch) {
                    window.location.href = `tel:${phoneMatch[0].replace(/[\s-]/g, '')}`;
                  } else {
                    showToast('Could not extract a valid phone number.', 'error');
                  }
                }}
                className="flex-1 bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-[24px] transition-colors text-center text-[15px]"
              >
                Call contact
              </button>
              <button 
                onClick={handleNavigate}
                className="flex-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-[24px] transition-colors text-center text-[15px]"
              >
                Navigate
              </button>
            </div>
          </div>
        )}
        {isReceiving && (
          <div className="bg-[#f2f4f7] rounded-[32px] p-6 flex gap-3">
            <button 
              onClick={() => {
                const phoneMatch = data.emergencyContact.match(/\+?\d[\d\-\s]+/);
                if (phoneMatch) {
                  window.location.href = `tel:${phoneMatch[0].replace(/[\s-]/g, '')}`;
                } else {
                  showToast('Could not extract a valid phone number.', 'error');
                }
              }}
              className="flex-1 bg-[#111827] hover:bg-black text-white font-bold py-4 rounded-[24px] transition-colors text-center text-[15px]"
            >
              Call contact
            </button>
            <button 
              onClick={handleNavigate}
              className="flex-1 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-4 rounded-[24px] transition-colors text-center text-[15px]"
            >
              Navigate
            </button>
          </div>
        )}

        {/* Bottom Card: Shared Data */}
        <div className="bg-white shadow-2xl rounded-[32px] p-6">
          <h3 className="text-xl font-bold text-dark mb-2">
            {isReceiving ? 'Emergency Information' : 'Data shared instantly'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {isReceiving 
              ? 'This information was sent in the SOS packet.' 
              : 'This information will be sent in the SOS packet to help your ride team respond faster.'}
          </p>

          <div className="flex flex-col gap-3">
            <DataRow label="Current coordinates" value={data.coordinates} />
            <DataRow label="Rider name" value={data.riderName} />
            <DataRow label="Bike details" value={data.bikeDetails} />
            <DataRow label="Blood group" value={data.bloodGroup} />
            <DataRow label="Emergency contact" value={data.emergencyContact} />
          </div>
        </div>


      </div>
    </div>
  );
};

const DataRow = ({ label, value }: { label: string, value: string }) => (
  <div className="bg-gray-50 rounded-full px-5 py-3 flex justify-between items-center border border-gray-100">
    <span className="text-gray-500 font-medium text-sm">{label}</span>
    <span className="text-dark font-bold text-sm truncate max-w-[50%]">{value}</span>
  </div>
);
