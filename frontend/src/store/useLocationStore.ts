import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface LocationState {
  coordinates: { lat: number; lng: number } | null;
  locationName: string | null;
  error: string | null;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
  fetchLocationOnce: () => Promise<{lat: number, lng: number, locationName: string | null}>;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => {
      let watchId: number | null = null;

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`);
      const data = await res.json();
      if (data.address) {
        const city = data.address.city || data.address.town || data.address.county || 'Unknown City';
        const country = data.address.country || '';
        const name = `${city}${country ? `, ${country}` : ''}`;
        set({ locationName: name });
      } else {
        set({ locationName: 'Location Unavailable' });
      }
    } catch {
      set({ locationName: 'Location Unavailable' });
    }
  };

  return {
    coordinates: null,
    locationName: null,
    error: null,
    isTracking: false,

    startTracking: () => {
      if (get().isTracking) return;
      if (!('geolocation' in navigator)) {
        set({ error: 'Geolocation not supported' });
        return;
      }

      set({ isTracking: true, error: null });
      
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const prevCoords = get().coordinates;
          
          if (!prevCoords || prevCoords.lat !== latitude || prevCoords.lng !== longitude) {
            set({ coordinates: { lat: latitude, lng: longitude } });
          }

          // Only reverse geocode if we haven't yet, or if we've moved significantly
          if (!prevCoords || 
              Math.abs(prevCoords.lat - latitude) > 0.01 || 
              Math.abs(prevCoords.lng - longitude) > 0.01) {
            reverseGeocode(latitude, longitude);
          }
        },
        (error) => {
          set({ error: error.message });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    },

    stopTracking: () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      set({ isTracking: false });
    },

    fetchLocationOnce: async (): Promise<{lat: number, lng: number, locationName: string | null}> => {
      return new Promise((resolve, reject) => {
        if (!('geolocation' in navigator)) {
          set({ error: 'Geolocation not supported' });
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            set({ coordinates: { lat: latitude, lng: longitude }, error: null });
            
            // Reverse geocode
            reverseGeocode(latitude, longitude).then(() => {
              resolve({ lat: latitude, lng: longitude, locationName: get().locationName });
            });
          },
          (error) => {
            set({ error: error.message });
            reject(error);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
        );
      });
    }
  };
},
  {
    name: 'location-storage',
    partialize: (state) => ({ 
      coordinates: state.coordinates,
      locationName: state.locationName 
    }),
  }
));
