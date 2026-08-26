import * as turf from '@turf/turf';

/**
 * Snaps a raw GPS coordinate to the nearest point on the active route geometry.
 * This prevents the user's location marker from jittering off the road.
 * 
 * @param rawLat Raw GPS latitude
 * @param rawLng Raw GPS longitude
 * @param routeGeoJSON The active route as a GeoJSON LineString
 * @param maxSnapDistanceKm Maximum distance in kilometers to allow snapping (e.g., 0.05 for 50m)
 * @returns The matched coordinate or the raw coordinate if it's too far from the route
 */
export const matchToRoute = (
  rawLat: number,
  rawLng: number,
  routeGeoJSON: any,
  maxSnapDistanceKm: number = 0.05
): { lat: number; lng: number } => {
  if (!routeGeoJSON || routeGeoJSON.type !== 'LineString') {
    return { lat: rawLat, lng: rawLng };
  }

  const point = turf.point([rawLng, rawLat]);
  const line = turf.lineString(routeGeoJSON.coordinates);

  try {
    const snapped = turf.nearestPointOnLine(line, point);
    
    // Check if the snapped point is within the acceptable distance
    const distance = turf.distance(point, snapped, { units: 'kilometers' });
    
    if (distance <= maxSnapDistanceKm) {
      return {
        lat: snapped.geometry.coordinates[1],
        lng: snapped.geometry.coordinates[0]
      };
    }
  } catch (err) {
    console.warn('Map matching failed', err);
  }

  // Fallback to raw coordinates
  return { lat: rawLat, lng: rawLng };
};
