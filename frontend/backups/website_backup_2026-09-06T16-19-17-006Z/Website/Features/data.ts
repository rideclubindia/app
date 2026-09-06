import { Navigation, Users, Shield, Map, Activity, Wrench, Smartphone, Heart, CloudLightning, LineChart, Bluetooth } from 'lucide-react';

export const featuresData = [
  {
    id: 'advanced-routing',
    title: 'Curated Motorcycle Routing',
    description: 'Forget straight highways. Our engine specifically prioritizes twisty roads, scenic byways, and rider-approved routes. Plan multi-stop road trips with built-in POIs specifically curated for motorcyclists.',
    icon: Navigation
  },
  {
    id: 'live-tracking',
    title: 'Live Pack Sync',
    description: 'Riding in a group? See every pack member\'s live location on your map. Pack Sync automatically calculates distance gaps and warns you if someone falls too far behind.',
    icon: Users
  },
  {
    id: 'sos-alerts',
    title: 'Automated Crash Detection',
    description: 'Our proprietary algorithm uses your phone\'s gyroscope and accelerometer to detect sudden impacts or abnormal lean angles, automatically dispatching an SOS to your emergency contacts.',
    icon: Shield
  },
  {
    id: 'offline-maps',
    title: 'Zero-Signal Navigation',
    description: 'Download entire states or countries for completely offline routing. We guarantee you will never lose your map, even in the deepest canyons or most remote mountain passes.',
    icon: Map
  },
  {
    id: 'garage',
    title: 'Digital Garage Log',
    description: 'Store your entire stable in one place. Track tire mileage, oil change intervals, suspension setups, and generate PDF service histories for maximum resale value.',
    icon: Wrench
  },
  {
    id: 'weather',
    title: 'Micro-Climate Weather Radar',
    description: 'Mountains have their own weather. Get real-time Doppler radar overlays directly on your route, with smart warnings to reroute if severe storms are detected ahead.',
    icon: CloudLightning
  }
];

export const deepDiveFeatures = [
  {
    id: 'telemetrics',
    title: 'Precision Ride Analytics',
    description: 'Every twist of the throttle is recorded. Review your rides with a complete breakdown of top speeds, maximum lean angles, elevation changes, and cornering G-forces. Export your ride data telemetry perfectly synced to your GoPro footage.',
    icon: LineChart
  },
  {
    id: 'intercom',
    title: 'Bluetooth Intercom Integration',
    description: 'Ride Club communicates directly with your Sena, Cardo, or generic helmet comms system. Receive turn-by-turn audio directions, pack gap warnings, and weather alerts directly in your ears without ever looking down at your phone.',
    icon: Bluetooth,
    image: 'https://images.pexels.com/photos/2413089/pexels-photo-2413089.jpeg?auto=compress&cs=tinysrgb&w=1200'
  }
];
