import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';
import { supabase } from '../../lib/supabase';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../../components/ToastContext';
import darkLogo from '../../assets/Logos/Logo for Dark Backgrounds 2.svg';
import { ArrowRight, ShieldAlert } from 'lucide-react';
import { ADMIN_EMAIL } from '../../App';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        if (user.email?.toLowerCase() === ADMIN_EMAIL) {
          navigate('/', { replace: true });
        } else {
          showToast('Unauthorized. Admin access only.', 'error');
          auth.signOut();
        }
      }
    });
    return () => unsubscribe();
  }, [navigate, showToast]);

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const userCred = await signInWithPopup(auth, googleProvider);
      
      if (userCred.user.email?.toLowerCase() !== ADMIN_EMAIL) {
        await auth.signOut();
        showToast('Access denied. You must use the Admin Google account.', 'error');
        setIsLoading(false);
        return;
      }

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
      
      navigate('/', { replace: true });
    } catch (err: any) {
      const isCancelled = err.code === 'auth/popup-closed-by-user' || 
                          err.code === 'auth/cancelled-popup-request' || 
                          err.type === 'userCancelled' ||
                          String(err).toLowerCase().includes('cancel');
                          
      if (isCancelled) {
        showToast("Login cancelled. Please try again.", "error");
      } else {
        showToast(err.message || 'Login failed', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center bg-dark p-4 rounded-xl w-fit mx-auto mb-6">
          <img className="h-12 w-auto" src={darkLogo} alt="Ride Club" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
          Admin Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to manage Ride Club operations
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-gray-100">
          
          <div className="rounded-md bg-blue-50 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ShieldAlert className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Restricted Access</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>This portal is restricted to authorized Ride Club administrators only.</p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 transition-colors"
          >
            {isLoading ? (
              'Authenticating...'
            ) : (
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Sign in with Google
              </div>
            )}
          </button>
          
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
