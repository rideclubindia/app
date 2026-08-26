import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { apiClient } from '../lib/apiClient';
import { useToast } from '../components/ToastContext';
import { ArrowRight, Mail } from 'lucide-react';
import loginBackground from '../assets/Login.jpg';
import darkLogo from '../assets/Logos/Logo for Dark Backgrounds 2.svg';

const LoginScreen = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/home', { replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      showToast("Please enter a valid email.", "error");
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true
        }
      });
      
      if (error) throw error;
      
      setStep('otp');
      showToast(`Verification code sent to ${email}`, 'success');
    } catch (error: any) {
      showToast("Failed to send code: " + (error.message || error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      showToast("Please enter the 6-digit code.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });
      
      if (error) throw error;
      if (!data.session) throw new Error("No session created");
      
      // Exchange Supabase token for RIE custom backend token
      const response = await apiClient.post('/api/v1/auth/supabase-login', {
        access_token: data.session.access_token,
        name: email.split('@')[0]
      });
      
      if (response.data.access_token) {
        localStorage.setItem('rie_token', response.data.access_token);
      }
      
      // Sync to Supabase profiles
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email,
          status: 'active'
        }, { onConflict: 'id' }).select();
      }
      
      showToast("Successfully logged in!", 'success');
      navigate('/home', { replace: true });
      
    } catch (error: any) {
      showToast("Verification Failed: " + (error.message || error), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="w-full h-[100dvh] text-white flex flex-col relative overflow-hidden font-sans"
      style={{
        backgroundImage: `url(${loginBackground})`,
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

      {/* ====== SCROLLABLE CONTENT ====== */}
      <div className="relative z-10 flex-1 flex flex-col overflow-y-auto hide-scrollbar">
        
        {/* Logo */}
        <div className="px-6 pt-4 pb-2 shrink-0">
          <img src={darkLogo} alt="Ride Club" className="h-32 w-auto drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] object-left object-contain" />
        </div>

        {/* Hero Section */}
        <div className="px-6 pt-3 pb-3 shrink-0">
          <h1 className="text-[42px] font-extrabold leading-[1.05] tracking-tight mb-4">
            Two Wheels,<br/>
            <span className="text-[#ef4523]">One Soul</span>
          </h1>
          
          <p className="text-[#B7BDC8] text-[16px] leading-relaxed mb-4">
            Discover rides. Meet riders.<br/>
            Create unforgettable journeys.
          </p>

          {/* Community Avatars */}
          <div className="flex items-center gap-4 mb-3">
            <div className="flex -space-x-3">
              <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop&crop=faces" alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
              <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces" alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
              <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100&h=100&fit=crop&crop=faces" alt="" className="w-12 h-12 rounded-full border-[2.5px] border-[#273a5a]/60 object-cover" />
            </div>
            <div>
              <p className="text-white text-[15px] font-semibold">10K+ riders</p>
              <p className="text-gray-400 text-[13px]">already with us</p>
            </div>
          </div>
          <div className="w-10 h-[3px] bg-[#ef4523] rounded-full"></div>
        </div>

        {/* Feature Cards Row */}
        <div className="px-6 pb-6 shrink-0 mt-4">
          <div className="grid grid-cols-3 gap-3">
            {/* Find Rides */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#ef4523]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="7" cy="17" r="3"/>
                  <circle cx="17" cy="17" r="3"/>
                  <path d="M10 17h4"/>
                  <path d="M5.5 14.5L8 8h5l3 5"/>
                  <path d="M13 8l3-3"/>
                  <path d="M16 5h2v2"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold">Find Rides</p>
                <p className="text-gray-500 text-[11px]">Near you</p>
              </div>
            </div>
            {/* Ride Together */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#ef4523]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold">Ride Together</p>
                <p className="text-gray-500 text-[11px]">Build connections</p>
              </div>
            </div>
            {/* Explore More */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#ef4523]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2v2"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-[13px] font-semibold">Explore More</p>
                <p className="text-gray-500 text-[11px]">New places</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== AUTH FORM ====== */}
        <div className="px-6 pb-2 shrink-0 space-y-4">
          
          <div className="bg-[#1e293b]/70 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl">
            
            {step === 'email' ? (
              <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-400 ml-1">Email Address</label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-4 w-5 h-5 text-gray-400" />
                    <input 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="rider@example.com"
                      className="w-full h-[54px] bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading}
                  className="relative w-full flex items-center justify-center h-[54px] rounded-xl font-semibold text-[15px] text-white active:scale-[0.97] transition-all shadow-[0_8px_24px_rgba(255,106,0,0.25)] disabled:opacity-70 bg-[#ef4523]"
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
              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-gray-400 ml-1">Verification Code</label>
                  <p className="text-xs text-gray-500 mb-2 ml-1">We sent a 6-digit code to {email}</p>
                  <input 
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="------"
                    className="w-full h-[54px] bg-white/5 border border-white/10 rounded-xl px-4 text-center text-2xl tracking-widest text-white placeholder-gray-500 focus:outline-none focus:border-[#ef4523] focus:ring-1 focus:ring-[#ef4523] transition-all"
                    required
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || otp.length < 6}
                  className="relative w-full flex items-center justify-center h-[54px] rounded-xl font-semibold text-[15px] text-white active:scale-[0.97] transition-all shadow-[0_8px_24px_rgba(255,106,0,0.25)] disabled:opacity-70 bg-[#ef4523]"
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
                  className="text-xs text-gray-400 mt-2 hover:text-white transition-colors"
                >
                  Used wrong email? Go back
                </button>
              </form>
            )}

          </div>

        </div>

        {/* Legal */}
        <div className="px-6 pb-8 shrink-0 mt-4">
          <p className="text-center text-xs text-gray-500 leading-relaxed">
            By continuing, you agree to our{' '}
            <button onClick={() => navigate('/terms')} className="text-[#ef4523] font-medium">Terms of Service</button>
            {' '}and{' '}
            <button onClick={() => navigate('/privacy-policy')} className="text-[#ef4523] font-medium">Privacy Policy</button>.
          </p>
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;
