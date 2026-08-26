import { create } from 'zustand';
import type { ConnectionStatus } from './protocol';

interface RealtimeState {
  status: ConnectionStatus;
  sessionId: string | null;
  nodeId: string | null;
  /** Unix ms of last successful connect (for diagnostics) */
  lastConnectedAt: number | null;
  reconnectAttempt: number;
  degraded: boolean;
  setStatus: (status: ConnectionStatus) => void;
  setSession: (sessionId: string | null, nodeId: string | null) => void;
  setReconnectAttempt: (n: number) => void;
  setDegraded: (degraded: boolean) => void;
}

/**
 * Connection state lives in its own tiny store so components that render it
 * re-render without dragging GPS/navigation state (which changes constantly)
 * into the same subscribers.
 */
export const useRealtimeStore = create<RealtimeState>((set) => ({
  status: 'idle',
  sessionId: null,
  nodeId: null,
  lastConnectedAt: null,
  reconnectAttempt: 0,
  degraded: false,
  setStatus: (status) =>
    set((s) => ({
      status,
      lastConnectedAt: status === 'connected' ? Date.now() : s.lastConnectedAt,
    })),
  setSession: (sessionId, nodeId) => set({ sessionId, nodeId }),
  setReconnectAttempt: (reconnectAttempt) => set({ reconnectAttempt }),
  setDegraded: (degraded) => set({ degraded }),
}));
