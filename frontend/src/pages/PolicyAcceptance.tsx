import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLocationStore } from '../store/useLocationStore';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { ShieldCheck, ChevronDown, ChevronUp, MapPin, Bell, Camera, FileCheck, Lock, ArrowRight, CheckCheck } from 'lucide-react';
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

  const [expanded, setExpanded] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(true);

  const [agreedAll, setAgreedAll] = useState(false);
  const [cb1, setCb1] = useState(false);
  const [cb2, setCb2] = useState(false);
  const [cb3, setCb3] = useState(false);
  const [cb4, setCb4] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleAgreeAll = (checked: boolean) => {
    setAgreedAll(checked);
    setCb1(checked);
    setCb2(checked);
    setCb3(checked);
    setCb4(checked);
  };

  useEffect(() => {
    if (cb1 && cb2 && cb3 && cb4) {
      setAgreedAll(true);
    } else {
      setAgreedAll(false);
    }
  }, [cb1, cb2, cb3, cb4]);

  const isFormValid = cb1 && cb2 && cb3 && cb4;

  const handleAccept = async () => {
    const user = auth.currentUser;
    if (!user || !isFormValid) return;
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
    } catch (permissionError) {
      console.warn('Native permission request failed', permissionError);
    }

    try {
      const userId = getDeterministicUuid(user.uid);
      
      // Save locally to avoid asking again on this device
      localStorage.setItem(`policy_accepted_${userId}`, 'true');

      try {
        const updates: any = {
          policy_accepted_at: new Date().toISOString(),
          device_info: navigator.userAgent,
          accepted_privacy_version: 1,
          accepted_terms_version: 1
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

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#273a5a]"><div className="w-8 h-8 border-4 border-[#ef4523] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  // Custom checkbox component
  const OrangeCheck = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 ${checked ? 'bg-[#ef4523] shadow-[0_0_12px_rgba(255,106,0,0.4)]' : 'bg-white/5 border border-white/15'}`}
    >
      {checked && (
        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );

  // Permission icon wrapper
  const PermIcon = ({ children }: { children: React.ReactNode }) => (
    <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-[#273a5a] text-white overflow-hidden">
      
      {/* ====== Background Image ====== */}
      <div className="absolute inset-0 z-0">
        <img 
          src={permissionsBackground}
          alt=""
          className="w-full h-full object-cover"
          style={{ objectPosition: 'center 35%' }}
        />
        {/* Bottom-heavy fade — bikes visible in upper half */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(5,5,5,1) 0%, rgba(5,5,5,0.95) 25%, rgba(5,5,5,0.6) 50%, rgba(5,5,5,0.3) 70%, rgba(5,5,5,0.4) 100%)' }}></div>
        {/* Side gradient for text readability */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,5,5,0.7) 0%, rgba(5,5,5,0.35) 45%, rgba(5,5,5,0.1) 100%)' }}></div>
      </div>

      {/* ====== Content Wrapper ====== */}
      <div className="relative z-10 flex-1 flex flex-col overflow-hidden pb-[140px]">
        
        {/* Logo */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <img src={darkLogo} alt="RIDE CLUB" className="h-16 w-auto object-left object-contain" />
          </div>
        </div>

        {/* Hero Headline */}
        <div className="px-6 pb-4 shrink-0">
          <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight mb-3">
            Your safety<br/>
            <span className="text-[#ef4523]">is our priority</span>
          </h1>

          {/* 3-step indicator */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 bg-[#ef4523] rounded-full"></div>
            <div className="w-2 h-2 bg-white/15 rounded-full"></div>
            <div className="w-2 h-2 bg-white/15 rounded-full"></div>
          </div>
        </div>

        {/* ====== MAIN GLASS CARD ====== */}
        <div className="px-4 pb-4 shrink-0">
          <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[28px] p-5 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#ef4523]/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-start gap-4 relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#ef4523] to-[#ef4523] flex items-center justify-center shrink-0 shadow-[0_4px_16px_rgba(255,106,0,0.3)]">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[18px] font-bold text-white mb-1.5">App Permissions Access</h2>
                <p className="text-[13px] text-[#8B919D] leading-relaxed">
                  Ride Club requires the following permissions to ensure safety and real-time alerts. You have the right to revoke access at any time in settings.
                </p>
              </div>
            </div>

            {/* 3D Illustration Placeholder */}
            <div className="absolute top-3 right-3 w-20 h-20 flex items-center justify-center opacity-50">
              <div className="relative">
                <div className="w-10 h-10 bg-[#ef4523]/20 rounded-xl rotate-12 absolute -top-1 -right-1"></div>
                <MapPin className="w-8 h-8 text-[#ef4523] relative z-10" />
                <div className="absolute -bottom-3 -right-3 w-6 h-6 bg-white/5 rounded-full border border-white/10 flex items-center justify-center">
                  <CheckCheck className="w-3 h-3 text-[#ef4523]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ====== PERMISSIONS ACCORDION ====== */}
        <div className="px-4 pb-4 flex-1 min-h-0 flex flex-col">
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-[24px] flex flex-col h-full overflow-hidden">
            
            {/* Agree to All Header */}
            <div 
              className="flex items-center justify-between px-5 py-4 cursor-pointer active:bg-white/[0.02] transition-colors shrink-0"
              onClick={() => setShowDetails(!showDetails)}
            >
              <div className="flex items-center gap-3.5">
                <OrangeCheck checked={agreedAll} onChange={handleAgreeAll} />
                <span className="text-[16px] font-bold text-white">I agree to all</span>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${showDetails ? 'rotate-180' : ''}`} />
            </div>

            {/* Permission Items */}
            {showDetails && (
              <div className="flex-1 overflow-y-auto hide-scrollbar animate-in fade-in slide-in-from-top-1 duration-300">
                
                {/* Permission 1: Location */}
                <div className="mx-3 mb-3">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-[20px] p-4">
                    <div className="flex items-start gap-3.5">
                      <PermIcon>
                        <MapPin className="w-5 h-5 text-[#ef4523]" />
                      </PermIcon>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-bold text-white">Location Access</span>
                          <OrangeCheck checked={cb1} onChange={setCb1} />
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-relaxed">
                          I hereby consent and agree to allow Ride Club to access my real-time GPS location in the background and foreground to provide accurate navigation and route alerts.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permission 2: Notifications */}
                <div className="mx-3 mb-3">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-[20px] p-4">
                    <div className="flex items-start gap-3.5">
                      <PermIcon>
                        <Bell className="w-5 h-5 text-[#ef4523]" />
                      </PermIcon>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-bold text-white">Notifications</span>
                          <OrangeCheck checked={cb2} onChange={setCb2} />
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-relaxed">
                          I hereby consent to receive push notifications and alerts regarding critical road hazards, accidents, and group messages.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permission 3: Camera & Photos */}
                <div className="mx-3 mb-3">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-[20px] p-4">
                    <div className="flex items-start gap-3.5">
                      <PermIcon>
                        <Camera className="w-5 h-5 text-[#ef4523]" />
                      </PermIcon>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-bold text-white">Camera & Photos</span>
                          <OrangeCheck checked={cb3} onChange={setCb3} />
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-relaxed">
                          I hereby agree to grant camera and photo library access when reporting incidents, enabling me to securely attach and upload evidence to the community.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Permission 4: Terms & Privacy */}
                <div className="mx-3 mb-4">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-[20px] p-4">
                    <div className="flex items-start gap-3.5">
                      <PermIcon>
                        <FileCheck className="w-5 h-5 text-[#ef4523]" />
                      </PermIcon>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[14px] font-bold text-white">Terms & Privacy</span>
                          <OrangeCheck checked={cb4} onChange={setCb4} />
                        </div>
                        <p className="text-[12px] text-[#6B7280] leading-relaxed">
                          I confirm that I have read and agree to the{' '}
                          <Link to="/privacy-policy" target="_blank" className="text-[#ef4523] font-medium hover:underline">Privacy Policy</Link>
                          {' '}and{' '}
                          <Link to="/terms" target="_blank" className="text-[#ef4523] font-medium hover:underline">Terms of Service</Link>
                          , and consent to the collection of necessary device information to secure my account.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* ====== FIXED BOTTOM CTA ====== */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-[#273a5a] via-[#273a5a]/95 to-transparent pt-6 pb-2 px-4">
        <button 
          onClick={handleAccept}
          disabled={!isFormValid || isSubmitting}
          className={`w-full h-[64px] rounded-[24px] font-bold text-[17px] transition-all flex items-center justify-between px-7 ${
            isFormValid 
              ? 'text-white active:scale-[0.97] shadow-[0_8px_32px_rgba(255,90,31,0.35)]' 
              : 'bg-white/[0.04] text-white/30 cursor-not-allowed border border-white/[0.06]'
          }`}
          style={isFormValid ? { background: 'linear-gradient(135deg, #ef4523 0%, #ef4523 100%)' } : undefined}
        >
          <span>{isSubmitting ? 'Processing...' : 'Agree and Continue'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>

        {/* Trust Message */}
        <div className="px-2 pt-3 pb-4">
          <div className="flex items-start gap-3">
            <Lock className="w-4 h-4 text-gray-600 mt-0.5 shrink-0" />
            <p className="text-[12px] text-gray-600 leading-relaxed">
              We respect your privacy. Your data is safe with us and will never be shared with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyAcceptance;
