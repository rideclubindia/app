import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { ChevronDown, MapPin, Bell, Camera, FileCheck, Lock, ArrowRight, ShieldAlert } from 'lucide-react';
import { requestSosSmsPermission } from '../lib/sos/sosOrchestrator';
import { getDeterministicUuid } from '../lib/user';
import darkLogo from '../assets/Logos/Logo for Dark Backgrounds 2.svg';
import permissionsBackground from '../assets/permissions.png';
import { useToast } from '../components/ToastContext';

interface PolicyAcceptanceProps {
  onAccept?: () => void;
}

const PolicyAcceptance: React.FC<PolicyAcceptanceProps> = ({ onAccept }) => {
  const navigate = useNavigate();
    const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [agreedAll, setAgreedAll] = useState(false);
  const [cb1, setCb1] = useState(false);
  const [cb2, setCb2] = useState(false);
  const [cb3, setCb3] = useState(false);
  const [cb4, setCb4] = useState(false);
  const [cb5, setCb5] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAgreeAll = (checked: boolean) => {
    setAgreedAll(checked);
    setCb1(checked);
    setCb2(checked);
    setCb3(checked);
    setCb4(checked);
    setCb5(checked);
  };

  useEffect(() => {
    if (cb1 && cb2 && cb3 && cb4 && cb5) {
      setAgreedAll(true);
    } else {
      setAgreedAll(false);
    }
  }, [cb1, cb2, cb3, cb4, cb5]);

  const isFormValid = cb1 && cb2 && cb3 && cb4 && cb5;

  const handleAccept = async () => {
    let userUid = auth.currentUser?.uid;
    const rieToken = localStorage.getItem('rie_token');

    if (!userUid && rieToken) {
      try {
        const payload = JSON.parse(atob(rieToken.split('.')[1]));
        if (payload.uid || payload.sub) {
          userUid = payload.uid || payload.sub;
        }
      } catch (e) {
        console.warn("Could not parse rie_token in policy acceptance", e);
      }
    }

    if (!isFormValid) return;
    if (!userUid) {
      showToast('Could not verify your account. Please log in again.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      try {
        await useLocationStore.getState().fetchLocationOnce();
      } catch (error: any) {
        if (error?.code === 1) { // PERMISSION_DENIED
          showToast("Location access is blocked. Please enable it in your browser settings.", 'info');
        }
      }
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'denied') {
            showToast("Notifications are blocked. Please enable them in your browser settings.", 'info');
          }
        });
      }
      // Request Device Motion for Crash Detection (iOS/Safari requirement)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        (DeviceMotionEvent as any).requestPermission()
          .then((permissionState: string) => {
            if (permissionState !== 'granted') {
              console.warn("Motion permission denied");
            }
          })
          .catch(console.error);
      }
      // Ask for SMS now (consented above) so an offline SOS never stalls on a permission prompt
      await requestSosSmsPermission();
    } catch (permissionError) {
      console.warn('Native permission request failed', permissionError);
    }

    try {
      const userId = getDeterministicUuid(userUid);
      // Save locally to avoid asking again on this device
      localStorage.setItem(`policy_accepted_${userId}`, 'true');

      try {
        const updates: any = {
          policy_accepted_at: new Date().toISOString(),
          device_info: navigator.userAgent,
          accepted_privacy_version: 2,
          accepted_terms_version: 2
        };
        await supabase.from('profiles').update(updates).eq('id', userId);
      } catch (e) {
        console.warn('Could not update profiles table with policy acceptance.', e);
      }

      if (onAccept) {
        onAccept();
      } else {
        navigate('/home', { replace: true });
        window.location.reload(); 
      }
    } catch (err) {
      console.error('Failed to accept policies', err);
      showToast('Failed to accept policies. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [openItem, setOpenItem] = useState<string | null>(null);

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#1B2A42]"><div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  const items: { id: string; icon: React.ElementType; title: string; summary: string; checked: boolean; set: (v: boolean) => void; details: React.ReactNode }[] = [
    {
      id: 'location', icon: MapPin, title: 'Location', checked: cb1, set: setCb1,
      summary: 'Navigation, hazard alerts, and showing your position to your ride group.',
      details: 'I consent to Ride Club using my device\'s GPS location while I use the app, to provide navigation, route and hazard alerts, and to share my live position with members of rides I join.',
    },
    {
      id: 'notifications', icon: Bell, title: 'Notifications', checked: cb2, set: setCb2,
      summary: 'Road hazards, SOS alerts from your group, and ride messages.',
      details: 'I consent to receive push notifications about critical road hazards, accidents, SOS alerts from my ride group and group messages.',
    },
    {
      id: 'camera', icon: Camera, title: 'Camera & Photos', checked: cb3, set: setCb3,
      summary: 'Only when you choose to attach a photo to an incident report.',
      details: 'I agree to grant camera and photo library access when I report an incident, so I can attach and upload evidence for the community.',
    },
    {
      id: 'safety', icon: ShieldAlert, title: 'Ride safety features', checked: cb5, set: setCb5,
      summary: 'Background location during rides, accident detection, and emergency SMS when offline.',
      details: (
        <>
          <p><strong className="text-white font-semibold">Background location.</strong> During a live ride on Android, Ride Club keeps sharing my location with my ride group when the screen is off or the app is in the background. A "tracking your ride" notification is shown, and it stops when I leave or end the ride.</p>
          <p><strong className="text-white font-semibold">Accident detection (optional, asked at your first ride).</strong> If I turn it on, Ride Club uses my phone's motion sensors and GPS speed during a live ride to detect a possible crash. Detection happens on my phone; raw sensor data is never uploaded. I get a 15-second countdown to tap "I'm OK" before SOS is sent.</p>
          <p><strong className="text-white font-semibold">Emergency SMS.</strong> If SOS is triggered with no internet, Ride Club may send an SMS from my phone, at normal carrier rates, to the emergency contacts in my profile with my name, ride name, last known location link and time. Delivery depends on my carrier and cannot be guaranteed.</p>
          <p>Ride Club is not a substitute for calling 112.</p>
        </>
      ),
    },
    {
      id: 'terms', icon: FileCheck, title: 'Terms & Privacy', checked: cb4, set: setCb4,
      summary: 'Agree to the Terms of Service and Privacy Policy.',
      details: (
        <p>
          I have read and agree to the{' '}
          <Link to="/privacy-policy" target="_blank" className="text-[#FF8A6B] font-semibold underline underline-offset-2">Privacy Policy</Link>
          {' '}and{' '}
          <Link to="/terms" target="_blank" className="text-[#FF8A6B] font-semibold underline underline-offset-2">Terms of Service</Link>
          , and consent to the collection of the device information needed to secure my account.
        </p>
      ),
    },
  ];
  const acceptedCount = items.filter((i) => i.checked).length;

  const Check = ({ checked }: { checked: boolean }) => (
    <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#ef4523]' : 'border-2 border-white/30'}`} aria-hidden="true">
      {checked && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
    </span>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-[#1B2A42] text-white flex flex-col landscape:flex-row">
      {/* Hero */}
      <div className="relative shrink-0 h-[168px] landscape:h-full landscape:w-[38%] landscape:max-w-[440px] overflow-hidden">
        <img src={permissionsBackground} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: 'center 35%' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B2A42]/30 via-[#1B2A42]/60 to-[#1B2A42] landscape:bg-gradient-to-r landscape:from-[#1B2A42]/40 landscape:via-[#1B2A42]/70 landscape:to-[#1B2A42]" />
        <div className="relative h-full flex flex-col justify-end landscape:justify-center px-5 pb-4 pt-[max(12px,env(safe-area-inset-top))] landscape:px-8">
          <img src={darkLogo} alt="RIDE CLUB" className="h-10 w-auto self-start object-contain mb-auto landscape:mb-6" />
          <h1 className="text-[26px] landscape:text-[30px] font-extrabold leading-tight tracking-tight">Before your first ride</h1>
          <p className="text-[14px] text-[#C9D1DC] mt-1 leading-snug max-w-sm">A few permissions keep you and your group safe. You can change any of them later in Settings.</p>
        </div>
      </div>

      {/* Consents */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar px-4 landscape:px-6 pt-3 pb-4">
          <div className="max-w-xl mx-auto">
            <div className="flex items-center justify-between gap-3 py-2">
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#C9D1DC] tabular-nums">{acceptedCount} of {items.length} accepted</p>
                <div className="h-1.5 rounded-full bg-white/10 mt-1.5 overflow-hidden">
                  <div className="h-full bg-[#ef4523] rounded-full transition-[width] duration-300" style={{ width: `${(acceptedCount / items.length) * 100}%` }} />
                </div>
              </div>
              <button
                onClick={() => handleAgreeAll(!agreedAll)}
                className="h-11 px-4 rounded-xl border border-white/20 text-[14px] font-semibold flex items-center gap-2 active:scale-[0.98] transition-transform"
                aria-pressed={agreedAll}
              >
                <Check checked={agreedAll} /> Accept all
              </button>
            </div>

            <ul className="mt-2 rounded-2xl border border-white/10 bg-white/[0.04] divide-y divide-white/10 overflow-hidden">
              {items.map((it) => {
                const open = openItem === it.id;
                const Icon = it.icon;
                return (
                  <li key={it.id}>
                    <div className="flex items-stretch">
                      <button
                        onClick={() => it.set(!it.checked)}
                        className="flex-1 min-w-0 flex items-center gap-3.5 pl-4 pr-2 py-3.5 text-left active:bg-white/[0.04]"
                        role="checkbox"
                        aria-checked={it.checked}
                      >
                        <span className="w-11 h-11 rounded-xl bg-[#ef4523]/15 text-[#FF8A6B] flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2">
                            <span className="text-[15px] font-semibold text-white">{it.title}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[#FFB39E] bg-[#ef4523]/15 px-1.5 py-0.5 rounded">Required</span>
                          </span>
                          <span className="block text-[13px] text-[#C9D1DC] leading-snug mt-0.5">{it.summary}</span>
                        </span>
                        <Check checked={it.checked} />
                      </button>
                      <button
                        onClick={() => setOpenItem(open ? null : it.id)}
                        className="w-12 shrink-0 flex items-center justify-center text-[#C9D1DC] active:bg-white/[0.04]"
                        aria-expanded={open}
                        aria-label={`${open ? 'Hide' : 'Show'} details for ${it.title}`}
                      >
                        <ChevronDown className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {open && (
                      <div className="px-4 pb-4 -mt-1 pl-[74px] text-[13px] text-[#C9D1DC] leading-relaxed space-y-2">
                        {typeof it.details === 'string' ? <p>{it.details}</p> : it.details}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            <p className="flex items-start gap-2.5 text-[12px] text-[#9AA6B8] leading-relaxed mt-4 px-1">
              <Lock className="w-4 h-4 mt-0.5 shrink-0" />
              We never sell your data. Your location is shared only with your ride group and, in an emergency, with your emergency contacts.
            </p>
          </div>
        </div>

        {/* Action bar */}
        <div className="shrink-0 border-t border-white/10 bg-[#1B2A42] px-4 landscape:px-6 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="max-w-xl mx-auto">
            <button
              onClick={handleAccept}
              disabled={!isFormValid || isSubmitting}
              className="w-full h-14 rounded-xl font-bold text-[16px] flex items-center justify-center gap-2 transition-colors bg-[#ef4523] text-white disabled:bg-white/10 disabled:text-white/50 active:scale-[0.99]"
            >
              {isSubmitting ? 'Setting up permissions…' : isFormValid ? <>Agree and continue <ArrowRight className="w-5 h-5" /></> : `Accept all ${items.length} to continue`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyAcceptance;
