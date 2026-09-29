import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshamride',
  appName: 'Ride Club',
  webDir: 'dist',
  // Load the live web app so every web deploy reaches installed APKs; the bundled copy is the offline fallback
  server: {
    url: 'https://app.rideclub.in',
    hostname: 'app.rideclub.in',
    androidScheme: 'https',
    errorPath: 'index.html',
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
