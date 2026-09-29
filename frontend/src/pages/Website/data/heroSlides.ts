import cockpitHeroImg from '../../../assets/webflow_cockpit_hero.jpg';
import crashSentinelImg from '../../../assets/webflow_crash_sentinel.jpg';
import meshRadarImg from '../../../assets/webflow_mesh_radar.jpg';
import routeHeroImg from '../../../assets/hero.png';

export interface HeroSlide {
  id: string;
  badge: string;
  eyebrow: string;
  headline: string;
  description: string;
  ctaLabel: string;
  ctaLink: string;
  image: string;
  theme: 'dark' | 'light' | 'accent';
}

export const heroSlides: HeroSlide[] = [
  {
    id: 'cockpit-hud',
    badge: 'Live Telemetry',
    eyebrow: 'Live group tracking & automatic crash SOS',
    headline: 'Ride together. Stay found if something goes wrong.',
    description:
      'High-contrast speed, lean angle, and turn-by-turn vectors right on your handlebars.',
    ctaLabel: 'Launch the app',
    ctaLink: '/login',
    image: cockpitHeroImg,
    theme: 'dark'
  },
  {
    id: 'crash-sentinel',
    badge: 'Safety Daemon',
    eyebrow: 'Safety daemon',
    headline: 'Crash Sentinel watches every ride, automatically.',
    description:
      '6-axis phone accelerometer and gyro monitoring detects falls and severe impacts, then starts a 30s emergency broadcast.',
    ctaLabel: 'See how it works',
    ctaLink: '/safety',
    image: crashSentinelImg,
    theme: 'light'
  },
  {
    id: 'pack-radar',
    badge: 'Multi-Rider Mesh',
    eyebrow: 'Multi-rider mesh',
    headline: 'See your whole pack on one shared tactical radar.',
    description:
      'Formation tracking and pack gap warnings keep group rides of up to 50 riders connected through patchy mountain signal.',
    ctaLabel: 'Explore community',
    ctaLink: '/community',
    image: meshRadarImg,
    theme: 'dark'
  },
  {
    id: 'route-planner',
    badge: 'Scenic Vector GPS',
    eyebrow: 'Scenic vector GPS',
    headline: 'Find the roads worth riding, then never lose them offline.',
    description:
      'Curated twisties and mountain passes, cached as offline vector tiles for zero-signal riding.',
    ctaLabel: 'View features',
    ctaLink: '/features',
    image: routeHeroImg,
    theme: 'accent'
  }
];
