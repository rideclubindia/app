import { Smartphone, Zap, CloudOff, Lock, Code, Database } from 'lucide-react';

export const appFeatures = [
  {
    id: 'pwa',
    title: 'Progressive Web App (PWA)',
    description: 'Ride Club runs natively on your device without needing an App Store. This means zero bloatware, instant updates the moment you open the app, and taking up less than 10MB of your precious phone storage.',
    icon: Smartphone
  },
  {
    id: 'offline',
    title: 'Offline-First Architecture',
    description: 'Built on advanced service workers and IndexedDB, our app caches all critical routing and map data. Even if you lose 5G deep in the forest, the app continues to function flawlessly.',
    icon: CloudOff
  },
  {
    id: 'battery',
    title: 'Extreme Battery Optimization',
    description: 'Traditional GPS apps drain your battery in hours. We utilize intelligent location polling that adjusts based on your speed and heading, extending your screen-on time by up to 40% on long rides.',
    icon: Zap
  },
  {
    id: 'security',
    title: 'End-to-End Encryption',
    description: 'Your location data is yours. Live pack syncing uses military-grade AES-256 encryption. Once a ride ends, your live tracking tokens self-destruct to ensure absolute privacy.',
    icon: Lock
  },
  {
    id: 'ui',
    title: 'Glove-Friendly Interface',
    description: 'Every button, slider, and map control is designed with a massive touch-target radius. You can operate the entire Ride Club interface while wearing thick winter riding gloves.',
    icon: Code
  },
  {
    id: 'sync',
    title: 'Cross-Device Sync',
    description: 'Start planning a multi-day route on your desktop browser with a mouse, and instantly see it synced to your phone mounted on your handlebars. Completely seamless data flow.',
    icon: Database
  }
];
