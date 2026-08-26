import { useEffect, useRef } from 'react';
import { getRealtime } from './RealtimeManager';
import { useRealtimeStore } from './store';
import type { Envelope } from './protocol';

/**
 * Subscribe a component to a realtime event type without opening sockets.
 *
 * The handler ref is kept current so re-renders never re-subscribe, and the
 * subscription is always cleaned up on unmount.
 *
 *   useRealtimeEvent(EV_LOC, (env) => { ... });
 */
export function useRealtimeEvent(type: string, handler: (envelope: Envelope) => void) {
  const rt = getRealtime();
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const off = rt.on(type, (env) => handlerRef.current(env));
    return off;
  }, [type, rt]);
}

/** Reactive connection status for banners/indicators. */
export function useRealtimeStatus() {
  return useRealtimeStore();
}

export { getRealtime } from './RealtimeManager';
