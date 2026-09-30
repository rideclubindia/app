import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lakshamride',
  appName: 'Ride Club',
  webDir: 'dist',
  // WebView paints brand orange (not white) before the page draws
  backgroundColor: '#EF4523',
  // Plugin calls carry GPS fixes and sensor data; never echo them to Logcat
  loggingBehavior: 'none',
  // Load the live web app so every web deploy reaches installed APKs; the bundled copy is the offline fallback
  server: {
    url: 'https://app.rideclub.in',
    hostname: 'app.rideclub.in',
    androidScheme: 'https',
    errorPath: 'index.html',
  },
  plugins: {
    // Native splash stays until the page itself hides it (index.html boot script / first React render)
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#EF4523',
      showSpinner: false,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '990505735182-4pienpe7ibp2o9hca3vnn0fpsijcoap0.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    }
  }
};

export default config;
