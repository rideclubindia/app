import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { auth } from '../lib/firebase';
import { getAppUser, getDeterministicUuid } from '../lib/user';

// A new deploy removes old code chunks; a page still running the previous version must reload once to pick up the new one
const isStaleChunk = (e: Error) => /dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk/i.test(String(e?.message || e));

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[RideClub] uncaught render error:', error, errorInfo);
    if (isStaleChunk(error)) {
      let last = 0;
      try { last = Number(sessionStorage.getItem('rc_chunk_reload') || 0); } catch { /* storage blocked */ }
      if (Date.now() - last > 60000) {
        try { sessionStorage.setItem('rc_chunk_reload', String(Date.now())); } catch { /* storage blocked */ }
        window.location.reload();
        return;
      }
    }
    
    try {
      const user = getAppUser(auth.currentUser);
      const uid = user ? (user.uid.length === 36 ? user.uid : getDeterministicUuid(user.uid)) : null;
      
      await supabase.from('error_logs').insert([{
        user_id: uid,
        error_message: error.message || error.toString(),
        error_stack: errorInfo.componentStack || error.stack,
        route: window.location.pathname
      }]);
    } catch (e) {
      console.error('Failed to log error to Supabase:', e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6 text-red-500">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-semibold text-dark mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-4 max-w-md">
            We encountered an unexpected error. Our team has been notified. 
            Please try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white font-semibold py-3 px-8 rounded-full flex items-center gap-2 active:scale-95 transition-all"
          >
            <RefreshCw className="w-5 h-5" /> Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
