import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signInWithCredential, GoogleAuthProvider, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
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

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });
    return () => unsubscribe();
  }, [navigate]);





  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      if (Capacitor.isNativePlatform()) {
        GoogleAuth.initialize({
          clientId: '990505735182-4pienpe7ibp2o9hca3vnn0fpsijcoap0.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        const googleUser = await GoogleAuth.signIn();
        if (googleUser?.authentication?.idToken) {
          const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
          const userCred = await signInWithCredential(auth, credential);
          
          // Exchange for RIE Custom Token
          const response = await apiClient.post('/api/v1/auth/firebase-login', {
            email: userCred.user.email,
            name: userCred.user.displayName || userCred.user.email?.split('@')[0],
            firebase_uid: userCred.user.uid
          });
          
          if (response.data.access_token) {
            localStorage.setItem('rie_token', response.data.access_token);
          }
          
          // Sync to Supabase profiles
          if (userCred.user) {
            await supabase.from('profiles').upsert({
              id: userCred.user.uid,
              full_name: userCred.user.displayName || userCred.user.email?.split('@')[0],
              email: userCred.user.email,
              avatar_url: userCred.user.photoURL,
              status: 'active'
            }, { onConflict: 'id' }).select();
          }
          
          navigate('/home', { replace: true });
        } else {
          throw new Error("No ID Token found from Google.");
        }
      } else {
        const userCred = await signInWithPopup(auth, googleProvider);
        
        // Exchange for RIE Custom Token
        const response = await apiClient.post('/api/v1/auth/firebase-login', {
          email: userCred.user.email,
          name: userCred.user.displayName || userCred.user.email?.split('@')[0],
          firebase_uid: userCred.user.uid
        });
        
        if (response.data.access_token) {
          localStorage.setItem('rie_token', response.data.access_token);
        }
        
        // Sync to Supabase profiles
        if (userCred.user) {
          await supabase.from('profiles').upsert({
            id: userCred.user.uid,
            full_name: userCred.user.displayName || userCred.user.email?.split('@')[0],
            email: userCred.user.email,
            avatar_url: userCred.user.photoURL,
            status: 'active'
          }, { onConflict: 'id' }).select();
        }
        
        navigate('/home', { replace: true });
      }
    } catch (error: any) {
      const isCancelled = error.code === 'auth/popup-closed-by-user' || 
                          error.code === 'auth/cancelled-popup-request' || 
                          error.type === 'userCancelled' ||
                          String(error).toLowerCase().includes('cancel');
                          
      if (isCancelled) {
        showToast("Login cancelled. Please try again.", "error");
      } else {
        showToast("Login Failed: " + (error.message || error), 'error');
      }
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
              <p className="text-white text-[15px] font-bold">10K+ riders</p>
              <p className="text-gray-400 text-[13px]">already with us</p>
            </div>
          </div>
          <div className="w-10 h-[3px] bg-[#ef4523] rounded-full"></div>
        </div>

        {/* Spacer to push features down naturally */}
        {/* <div className="flex-1 min-h-[10px]"></div> */}

        {/* Feature Cards Row */}
        <div className="px-6 pb-6 shrink-0">
          <div className="grid grid-cols-3 gap-3">
            {/* Find Rides */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
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
                <p className="text-white text-[13px] font-bold">Find Rides</p>
                <p className="text-gray-500 text-[11px]">Near you</p>
              </div>
            </div>
            {/* Ride Together */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#ef4523]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-[13px] font-bold">Ride Together</p>
                <p className="text-gray-500 text-[11px]">Build connections</p>
              </div>
            </div>
            {/* Explore More */}
            <div className="flex flex-col items-center text-center gap-2.5 py-3">
              <div className="w-14 h-14 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                <svg className="w-7 h-7 text-[#ef4523]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                  <path d="M12 2v2"/>
                </svg>
              </div>
              <div>
                <p className="text-white text-[13px] font-bold">Explore More</p>
                <p className="text-gray-500 text-[11px]">New places</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== AUTH BUTTONS ====== */}
        <div className="px-6 pb-2 shrink-0 space-y-3">
          
          {/* Primary CTA: Continue with Google */}
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="relative w-full flex items-center justify-center h-[54px] rounded-xl font-bold text-[15px] text-white active:scale-[0.97] transition-all shadow-[0_8px_24px_rgba(255,106,0,0.25)] disabled:opacity-70 bg-[#ef4523]"
          >
            <div className="flex items-center gap-3">
              {isLoading ? (
                <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              )}
              <span>{isLoading ? 'Signing in...' : 'Continue with Google'}</span>
            </div>
            <ArrowRight className="absolute right-5 w-5 h-5" />
          </button>

          {/* Continue with Email */}
          <button 
            className="w-full flex items-center justify-center gap-3 h-[54px] bg-[#273a5a]/40 backdrop-blur-md border border-white/10 rounded-xl font-bold text-[15px] text-white active:scale-[0.97] transition-all hover:bg-white/5"
          >
            <Mail className="w-5 h-5" />
            Continue with Email
          </button>

          {/* Apple */}
          {/* <button 
            className="w-full flex items-center justify-center gap-3 h-[54px] bg-[#273a5a]/40 backdrop-blur-md border border-white/10 rounded-xl font-bold text-[15px] text-white active:scale-[0.97] transition-all hover:bg-white/5"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Continue with Apple
          </button> */}

        </div>

        {/* Divider */}
        <div className="px-6 pb-4 shrink-0">
          <div className="flex items-center">
            <div className="flex-1 h-[1px] bg-white/10"></div>
            <span className="px-4 text-xs text-gray-500 font-medium">or continue with</span>
            <div className="flex-1 h-[1px] bg-white/10"></div>
          </div>
        </div>

        {/* Quick Login: Facebook & Phone */}
        <div className="px-6 pb-5 flex justify-center gap-4 shrink-0">
          <button className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center active:scale-95 transition-all">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
            </svg>
          </button>
          <button className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center active:scale-95 transition-all">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>

        {/* Legal */}
        <div className="px-6 pb-8 shrink-0">
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
