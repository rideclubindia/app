import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshamride',
  appName: 'Ride Club',
  webDir: 'dist',
  // Serve the bundled app as https://app.rideclub.in so its API requests come from an origin the backend already allows
  server: {
    hostname: 'app.rideclub.in',
    androidScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '990505735182-4pienpe7ibp2o9hca3vnn0fpsijcoap0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
