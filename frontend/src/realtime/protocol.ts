/**
 * Wire protocol for the RideClub real-time platform.
 * Mirrors backend/realtime/protocol.py - keep both in sync.
 */

export const PROTOCOL_VERSION = 1;

// Client -> server
export const EV_LOC_PUSH = 'loc:p';
export const EV_RIDE_JOIN = 'ride:join';
export const EV_RIDE_LEAVE = 'ride:leave';
export const EV_RIDE_SYNC = 'ride:sync';
export const EV_PINS_SUB = 'pins:sub';
export const EV_PINS_UNSUB = 'pins:unsub';
export const EV_EVENT_ACK = 'ev:ack';
export const EV_AUTH_REFRESH = 'auth:refresh';
export const EV_ECHO = 'echo';

// Server -> client
export const EV_LOC = 'loc';
export const EV_RIDE_EVENT = 'ride:event';
export const EV_RIDE_SNAPSHOT = 'ride:snap';
export const EV_PINS_NEW = 'pins:new';
export const EV_SERVER = 'server';
export const EV_ERR = 'err';

export const ERR_AUTH = 'AUTH_FAILED';
export const ERR_AUTH_EXPIRED = 'TOKEN_EXPIRED';
export const ERR_FORBIDDEN = 'FORBIDDEN';
export const ERR_RATE_LIMITED = 'RATE_LIMITED';
export const ERR_SERVER_DRAINING = 'SERVER_DRAINING';

/** Server envelope: { v, type, ts, eventId?, seq?, corrId?, p } */
export interface Envelope<P = unknown> {
  v: number;
  type: string;
  ts: number;
  eventId?: string;
  seq?: number;
  corrId?: string;
  p: P;
}

/** Compact positional location: [memberId, lat, lng, speedKph, headingDeg, unixMs] */
export type LocationTuple = [string, number, number, number, number, number];

export interface LocPayload {
  ride: string;
  u: LocationTuple[];
}

export interface RideEventPayload {
  ride: string;
  eventType: string;
  by: string;
  data: Record<string, unknown>;
}

export interface AckResult {
  ok: boolean;
  code: string;
  ts: number;
  accepted?: number;
  role?: string;
  rideStatus?: string;
  replayed?: number;
  message?: string;
}

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';
