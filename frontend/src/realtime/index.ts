/**
 * RideClub real-time platform (client side).
 *
 * One shared Socket.IO connection managed by RealtimeManager. Import from
 * here everywhere - never create sockets directly in components.
 */
export * from './protocol';
export * from './store';
export { RealtimeManager, getRealtime } from './RealtimeManager';
export { useRealtimeEvent, useRealtimeStatus } from './hooks';
