import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshamride',
  appName: 'Laksham Ride',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '990505735182-4pienpe7ibp2o9hca3vnn0fpsijcoap0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
