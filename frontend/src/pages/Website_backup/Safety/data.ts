import { Shield, Activity, Phone, Bell, Map, Heart } from 'lucide-react';

export const safetyPillars = [
  {
    id: 'detection',
    title: 'G-Force Crash Detection',
    description: 'Ride Club continuously monitors your smartphone\'s internal accelerometer and gyroscope at 120hz. If an impact over a safe G-force threshold is detected followed by a sudden lack of motion, the emergency protocol is triggered.',
    icon: Activity
  },
  {
    id: 'dispatch',
    title: 'Automated 911 Dispatch',
    description: 'If you fail to dismiss the 30-second SOS countdown, our 24/7 monitoring center automatically contacts local emergency services with your exact GPS coordinates and vital medical information.',
    icon: Phone
  },
  {
    id: 'contacts',
    title: 'Emergency Contacts',
    description: 'Up to 5 trusted contacts receive an immediate SMS with a live-tracking link the moment a crash is suspected, allowing your loved ones to assist in coordinating your rescue.',
    icon: Shield
  },
  {
    id: 'pack',
    title: 'Nearby Rider Alerts',
    description: 'In remote areas where ambulances take hours, the closest help is often another rider. We anonymously broadcast your SOS to other Ride Club members within a 20-mile radius.',
    icon: Bell
  }
];

export const incidentTimeline = [
  {
    step: '01',
    title: 'Impact Detected',
    description: 'Algorithm detects an abnormal deceleration event or violent lean angle that matches our multi-million mile crash dataset.',
    icon: Activity
  },
  {
    step: '02',
    title: 'Countdown Initiated',
    description: 'Your phone will vibrate aggressively and flash. You have 30 seconds to tap "I AM OK" if it was just a dropped bike or a false alarm.',
    icon: Bell
  },
  {
    step: '03',
    title: 'Contacts & EMS Notified',
    description: 'If the timer expires, automated calls are dispatched to local emergency services and your pre-configured emergency contacts with your GPS location.',
    icon: Map
  }
];

export const safetyTestimonials = [
  {
    id: 't1',
    quote: 'I went off a ridge in the Colorado backcountry. No cell service, broken collarbone. Ride Club\'s offline SOS pinged a passing rider 5 miles away who had a satellite phone. Without this app, I would have spent the night in freezing temperatures.',
    author: 'James R.',
    role: 'Adventure Rider'
  },
  {
    id: 't2',
    quote: 'A car pulled out in front of me on my commute. The app detected the high-side impact instantly. My wife was notified before the ambulance even arrived at the intersection.',
    author: 'Sarah L.',
    role: 'Daily Commuter'
  }
];
