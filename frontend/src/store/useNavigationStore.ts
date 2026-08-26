import { create } from 'zustand';

export type NavigationStateStatus = 'INIT' | 'ONLINE' | 'OFFLINE' | 'SYNCHRONIZE';

export interface NavigationState {
  status: NavigationStateStatus;
  isOnline: boolean;
  init: () => void;
  setOnline: () => void;
  setOffline: () => void;
  synchronize: () => Promise<void>;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  status: 'INIT',
  isOnline: navigator.onLine,
  
  init: () => {
    const isOnline = navigator.onLine;
    set({ 
      isOnline, 
      status: isOnline ? 'ONLINE' : 'OFFLINE' 
    });

    const handleOnline = () => {
      set({ isOnline: true });
      get().synchronize();
    };

    const handleOffline = () => {
      set({ isOnline: false, status: 'OFFLINE' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  },

  setOnline: () => set({ status: 'ONLINE', isOnline: true }),
  
  setOffline: () => set({ status: 'OFFLINE', isOnline: false }),

  synchronize: async () => {
    // Transition to SYNCHRONIZE state
    set({ status: 'SYNCHRONIZE' });
    
    try {
      // RealtimeManager handles the actual offline sync in the background
      // We just simulate a short delay for the UI to show the 'Syncing' state
      await new Promise(resolve => setTimeout(resolve, 1500));
      set({ status: 'ONLINE' });
    } catch (err) {
      console.error('Synchronization failed', err);
      set({ status: 'ONLINE' });
    }
  }
}));
