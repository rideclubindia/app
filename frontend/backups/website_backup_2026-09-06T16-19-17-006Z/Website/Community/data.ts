import { Map, Zap, Compass } from 'lucide-react';

export const communityStats = [
  { id: '1', label: 'Active Riders Worldwide', value: '1.2M+' },
  { id: '2', label: 'Miles Tracked Annually', value: '450M+' },
  { id: '3', label: 'Registered Motorcycle Clubs', value: '8,500+' },
  { id: '4', label: 'Local Events Hosted', value: '25K+' }
];

export const popularGroups = [
  {
    id: 'adventure',
    title: 'Global ADV Syndicate',
    description: 'For riders who believe the real journey begins where the pavement ends. Share rugged trail maps, BDR routes, and off-grid camping locations.',
    icon: Map
  },
  {
    id: 'sport',
    title: 'Apex Hunters & Track Day Fans',
    description: 'Dedicated to the pursuit of the perfect corner. Discuss suspension tuning, track day schedules, and advanced knee-dragging techniques.',
    icon: Zap
  },
  {
    id: 'cruiser',
    title: 'Heavy Iron Cruisers',
    description: 'V-Twin enthusiasts celebrating the open highway. From custom choppers to cross-country baggers, join the ride for weekend group cruises and charity rallies.',
    icon: Compass
  }
];

export const upcomingEvents = [
  {
    id: '1',
    date: 'AUG 12',
    title: 'Sturgis Motorcycle Rally 2026',
    location: 'Sturgis, South Dakota',
    attendees: '150,000+'
  },
  {
    id: '2',
    date: 'SEP 04',
    title: 'European Alps Pass Mastery Tour',
    location: 'Innsbruck, Austria',
    attendees: '450'
  },
  {
    id: '3',
    date: 'OCT 15',
    title: 'California Coast 500 Run',
    location: 'San Francisco, CA',
    attendees: '1,200'
  }
];
