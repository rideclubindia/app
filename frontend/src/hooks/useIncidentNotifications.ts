import { useEffect, useRef, useCallback } from 'react';

/**
 * Haversine formula to calculate distance in km between two coordinates.
 */
const getDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Hook that watches new incidents and fires browser push notifications when:
 *   1. The incident is within `radiusKm` of the user's location, OR
 *   2. The incident belongs to a group the user is a member of.
 *
 * It de-duplicates so the same incident is never notified twice per session.
 */
export function useIncidentNotifications(
  incidents: any[],
  userLocation: { lat: number; lng: number } | null,
  userGroupIds: string[],
  radiusKm: number = 20
) {
  // Keep a set of incident IDs that have already been notified
  const notifiedRef = useRef<Set<string>>(new Set());

  const notify = useCallback((title: string, body: string, tag: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    try {
      new Notification(title, {
        body,
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag, // prevents duplicate browser notifications for same tag
        requireInteraction: false,
      });
    } catch {
      // Safari / some browsers don't support Notification constructor from page context
      // Fallback: do nothing — the in-app toast is the main UX
    }
  }, []);

  useEffect(() => {
    if (!incidents || incidents.length === 0) return;

    for (const incident of incidents) {
      if (!incident.id) continue;
      if (notifiedRef.current.has(incident.id)) continue;

      // Check: is this incident within the user's radius?
      let isNearby = false;
      if (userLocation && incident.latitude && incident.longitude) {
        const dist = getDistanceKm(
          userLocation.lat,
          userLocation.lng,
          incident.latitude,
          incident.longitude
        );
        isNearby = dist <= radiusKm;
      }

      // Check: does this incident belong to one of the user's groups?
      const isGroupIncident = incident.group_id && userGroupIds.includes(incident.group_id);

      if (isNearby || isGroupIncident) {
        // Mark as notified immediately to prevent duplicates
        notifiedRef.current.add(incident.id);

        const category = incident.category?.split(':')[0] || 'Alert';
        const distText = userLocation && incident.latitude && incident.longitude
          ? `${getDistanceKm(userLocation.lat, userLocation.lng, incident.latitude, incident.longitude).toFixed(1)} km away`
          : '';

        const title = isGroupIncident
          ? `🚨 Group Alert: ${category}`
          : `⚠️ Nearby: ${category}`;
        
        const body = [
          incident.description || `A ${category.toLowerCase()} has been reported`,
          distText,
        ].filter(Boolean).join(' • ');

        notify(title, body, `incident-${incident.id}`);
      }
    }
  }, [incidents, userLocation, userGroupIds, radiusKm, notify]);
}
