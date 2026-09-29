import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_EMAIL } from '../App';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/apiClient';
import { useToast } from '../components/ToastContext';
import { ArrowRight, Mail } from 'lucide-react';
import loginBackground from '../assets/Login.jpg';
import loginLandscape from '../assets/landscape.png';
import darkLogo from '../assets/Logos/Logo for Dark Backgrounds 2.svg';
import img17 from '../assets/WebsiteImages/img17.jpg';
import img18 from '../assets/WebsiteImages/img18.jpg';
import img19 from '../assets/WebsiteImages/img19.jpg';

interface AuthFormProps {
  step: 'email' | 'otp';
  email: string;
  otpInput: string;
  isLoading: boolean;
  setEmail: (v: string) => void;
  setOtpInput: (v: string) => void;
  setStep: (s: 'email' | 'otp') => void;
  onSendOtp: (e: React.FormEvent) => void;
  onVerifyOtp: (e: React.FormEvent) => void;
}

const AuthForm = ({ step, email, otpInput, isLoading, setEmail, setOtpInput, setStep, onSendOtp, onVerifyOtp }: AuthFormProps) => (
  <div className="bg-white/15 backdrop-blur-xl rounded-[24px] p-5 flex flex-col gap-4 shadow-[0_2px_4px_rgba(184,88,20,0.08),0_16px_36px_-14px_rgba(184,88,20,0.28)]">
    {step === 'email' ? (
      <form onSubmit={onSendOtp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[13px] font-medium text-white/80">Enter your Email Address</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-4 w-5 h-5 text-[#8a4a1f]" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="rider@example.com"
              className="w-full h-[54px] bg-white/85 rounded-xl pl-12 pr-4 text-[#3a2416] placeholder-[#a98a72] focus:outline-none focus:ring-2 focus:ring-[var(--rc-primary)] transition-all"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="relative w-full flex items-center justify-center h-[54px] rounded-xl font-semibold text-[15px] text-white active:scale-[0.97] transition-all hover:brightness-110 disabled:opacity-70"
          style={{ background: 'var(--rc-gradient-brand)' }}
        >
          <div className="flex items-center gap-3">
            {isLoading ? (
              <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Send Magic Code</span>
            )}
          </div>
          {!isLoading && <ArrowRight className="absolute right-5 w-5 h-5" />}
        </button>
      </form>
    ) : (
      <form onSubmit={onVerifyOtp} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[13px] font-medium text-white/80">Verification Code</label>
          <p className="text-xs text-white/60 mb-2">We sent a 6-digit code to {email}</p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpInput}
            onChange={(e) => setOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="------"
            className="w-full h-[54px] bg-white/85 rounded-xl px-4 text-center text-2xl tracking-widest text-[#3a2416] placeholder-[#a98a72] focus:outline-none focus:ring-2 focus:ring-[var(--rc-primary)] transition-all"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || otpInput.length < 6}
          className="relative w-full flex items-center justify-center h-[54px] rounded-xl font-semibold text-[15px] text-white active:scale-[0.97] transition-all hover:brightness-110 disabled:opacity-70"
          style={{ background: 'var(--rc-gradient-brand)' }}
        >
          <div className="flex items-center gap-3">
            {isLoading ? (
              <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>Verify & Login</span>
            )}
          </div>
        </button>
        <button
          type="button"
          onClick={() => setStep('email')}
          className="text-xs text-white/70 hover:text-white transition-colors"
        >
          Used wrong email? Go back
        </button>
      </form>
    )}
  </div>
);

// adminOnly restricts sign-in to ADMIN_EMAIL (admin and support portals); the backend still enforces admin rights.
const LoginScreen = ({ adminOnly = false, redirectTo = '/home' }: { adminOnly?: boolean; redirectTo?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const target = (location.state as { from?: string } | null)?.from || redirectTo;
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');

  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast("Please enter a valid email.", "error");
      return;
    }
    if (adminOnly && email.trim().toLowerCase() !== ADMIN_EMAIL) {
      showToast('This portal is restricted to Ride Club administrators.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // The backend generates and emails the code; the browser never sees it.
      await apiClient.post('/api/v1/auth/request-otp', { email });
      setStep('otp');
      showToast(`Verification code sent to ${email}`, 'success');
    } catch (error: any) {
      console.error(error);
      const detail = error?.response?.data?.detail;
      showToast(detail || "Failed to send verification code.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput || otpInput.length < 6) {
      showToast("Please enter the 6-digit code.", "error");
      return;
    }

    setIsLoading(true);
    try {
      // The backend is the sole authority on whether this code is correct.
      const response = await apiClient.post('/api/v1/auth/verify-otp', {
        email,
        otp: otpInput,
      });

      const accessToken = response.data?.access_token;
      const uid = response.data?.uid;
      if (!accessToken) {
        throw new Error('No session was issued by the server.');
      }
      localStorage.setItem('rie_token', accessToken);

      // Keep the Supabase profile row in sync using the server-assigned id
      // (never a client-chosen id) for websocket/profile association.
      if (uid) {
        try {
          await supabase.from('profiles').upsert({
            id: uid,
            full_name: email.split('@')[0],
            email: email,
            status: 'active'
          }, { onConflict: 'email' }).select();
        } catch (dbErr) {
          console.warn("Profile upsert notice:", dbErr);
        }
      }

      showToast("Successfully logged in!", 'success');
      navigate(target, { replace: true });

    } catch (error: any) {
      // Authentication failure must never grant access.
      const detail = error?.response?.data?.detail;
      showToast(detail || "Invalid verification code.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full h-[100dvh] text-white flex flex-col relative overflow-hidden font-sans"
      style={{
        backgroundImage: `url(${isLandscape ? loginLandscape : loginBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 55%',
      }}
    >
      {/* Light side overlay — lets bikes show through */}
      <div 
        className="absolute inset-0 z-0" 
        style={{
          background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.1) 100%)',
        }}
      ></div>
      {/* Bottom fade only — bikes visible in middle, dark at bottom for buttons */}
      <div className="absolute inset-0 z-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.2) 55%, transparent 70%)' }}></div>

      {/* ====== PORTRAIT LAYOUT ====== */}
      {!isLandscape && (
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-5 px-6 pt-[max(20px,env(safe-area-inset-top))] pb-[max(20px,env(safe-area-inset-bottom))] overflow-y-auto hide-scrollbar">
          
          {/* Logo */}
          <img src={darkLogo} alt="Ride Club" className="h-32 w-auto drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] object-left object-contain" />

          {/* Hero Section */}
          <div className="flex flex-col gap-3">
            <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight">
              Beyond
              <span className="text-[var(--rc-primary)]"> Miles</span>
            </h1>
            
            <p className="text-[#B7BDC8] text-[16px] leading-relaxed">
              Discover rides. Meet riders.<br/>
              Create unforgettable journeys.
            </p>

            {/* Community Avatars */}
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img src={img17} alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
                <img src={img18} alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
                <img src={img19} alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
              </div>
              <div className="flex flex-col">
                <p className="text-white text-[15px] font-semibold">10K+ riders</p>
                <p className="text-gray-400 text-[13px]">already with us</p>
              </div>
            </div>
            <div className="w-10 h-[3px] bg-[var(--rc-primary)] rounded-full"></div>
          </div>

          {/* The whole block is centred, so spare height splits evenly above and below instead of pooling in one gap */}
          <div className="flex flex-col gap-4">
          {/* ====== AUTH FORM ====== */}
          <AuthForm step={step} email={email} otpInput={otpInput} isLoading={isLoading} setEmail={setEmail} setOtpInput={setOtpInput} setStep={setStep} onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp} />

          {/* Feature Cards Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M10 17h4"/><path d="M5.5 14.5L8 8h5l3 5"/><path d="M13 8l3-3"/><path d="M16 5h2v2"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-white text-[13px] font-semibold">Find Rides</p>
                <p className="text-gray-500 text-[11px]">Near you</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-white text-[13px] font-semibold">Ride Together</p>
                <p className="text-gray-500 text-[11px]">Build connections</p>
              </div>
            </div>
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/><path d="M12 2v2"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <p className="text-white text-[13px] font-semibold">Explore More</p>
                <p className="text-gray-500 text-[11px]">New places</p>
              </div>
            </div>
          </div>

          {/* Legal */}
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <button onClick={() => navigate('/terms')} className="text-[var(--rc-primary)] font-medium">Terms of Service</button>
            {' '}and{' '}
            <button onClick={() => navigate('/privacy-policy')} className="text-[var(--rc-primary)] font-medium">Privacy Policy</button>.
          </p>
          </div>
        </div>
      )}

      {/* ====== LANDSCAPE LAYOUT ====== */}
      {isLandscape && (
        <div className="relative z-10 flex-1 flex flex-col overflow-hidden">
          
          {/* Middle Row — Branding Left | Form Right */}
          <div className="flex-1 flex flex-row overflow-hidden gap-8 items-center px-10">
            
            {/* Left Column — Branding + Feature Cards */}
            <div className="w-[40%] flex flex-col gap-1 shrink-0">
              <img src={darkLogo} alt="Ride Club" className="h-24 w-auto drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] object-contain object-left" />
              
              <div className="flex flex-col gap-2">
                <h1 className="text-[40px] font-extrabold leading-[1.05] tracking-tight">
                  Beyond
                  <span className="text-[var(--rc-primary)]"> Miles</span>
                </h1>
                <p className="text-[#B7BDC8] text-[14px] leading-relaxed   mb-2">
                  Discover rides. Meet riders.
                  Create unforgettable journeys.
                </p>
              </div>

              <div className="w-40 h-[3px] bg-[var(--rc-primary)] rounded-full mb-3"></div>

              {/* Feature Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="17" r="3"/><circle cx="17" cy="17" r="3"/><path d="M10 17h4"/><path d="M5.5 14.5L8 8h5l3 5"/><path d="M13 8l3-3"/><path d="M16 5h2v2"/>
                    </svg>
                  </div>
                  <p className="text-white text-[11px] font-semibold">Find Rides</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <p className="text-white text-[11px] font-semibold">Ride Together</p>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-[var(--rc-primary)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/><path d="M12 2v2"/>
                    </svg>
                  </div>
                  <p className="text-white text-[11px] font-semibold">Explore More</p>
                </div>
              </div>
            </div>

            {/* Right Column — Auth Form Only */}
            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="w-full max-w-md">
                <AuthForm step={step} email={email} otpInput={otpInput} isLoading={isLoading} setEmail={setEmail} setOtpInput={setOtpInput} setStep={setStep} onSendOtp={handleSendOtp} onVerifyOtp={handleVerifyOtp} />
              </div>
            </div>
          </div>

          {/* Bottom — Legal (full width, centered) */}
          <div className="shrink-0 pb-4">
            <p className="text-center text-[11px] text-gray-500 leading-relaxed">
              By continuing, you agree to our{' '}
              <button onClick={() => navigate('/terms')} className="text-[var(--rc-primary)] font-medium">Terms of Service</button>
              {' '}and{' '}
              <button onClick={() => navigate('/privacy-policy')} className="text-[var(--rc-primary)] font-medium">Privacy Policy</button>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginScreen;
