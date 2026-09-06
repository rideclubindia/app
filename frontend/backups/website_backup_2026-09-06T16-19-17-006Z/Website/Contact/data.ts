import { Mail, MapPin, Phone, Globe, Camera, Video, Users } from 'lucide-react';

export const contactMethods = [
  {
    id: 'email',
    title: 'Priority Email Support',
    description: 'Our rider support team operates 24/7. Whether you found a bug in the routing engine or have a billing question, we aim to respond within 2 hours.',
    action: 'support@rideclub.in',
    link: 'mailto:support@rideclub.in',
    icon: Mail
  },
  {
    id: 'headquarters',
    title: 'Ride Club Headquarters',
    description: 'We are proudly building the future of motorcycling right from the heart of India\'s technology capital. Drop by if you\'re in the area (we have great coffee and dedicated motorcycle parking).',
    action: 'Hitech City, Hyderabad, India',
    link: '#',
    icon: MapPin
  },
  {
    id: 'phone',
    title: 'Business & Event Partnerships',
    description: 'Hosting a massive rally? Want to sponsor a ride? Or are you a local municipality looking to integrate our SOS dispatch API into your 911 centers? Give our business line a call.',
    action: '+91 800 123 4567',
    link: 'tel:+918001234567',
    icon: Phone
  }
];

export const socialLinks = [
  {
    id: 'twitter',
    name: 'Twitter Support',
    icon: Globe,
    handle: '@RideClubApp'
  },
  {
    id: 'instagram',
    name: 'Instagram Community',
    icon: Camera,
    handle: '@RideClub'
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    icon: Video,
    handle: 'Ride Club TV'
  },
  {
    id: 'facebook',
    name: 'Facebook Group',
    icon: Users,
    handle: 'Ride Club Official'
  }
];
