import React from 'react';
import { PageShell, CtaBand } from '../rideclub/PageShell';
import { TabsSection, Zigzag } from '../rideclub/Sections';
import { featuresData, deepDiveFeatures } from './data';
import heroImg from '../../../assets/webflow_cockpit_hero.jpg';
import radarImg from '../../../assets/webflow_mesh_radar.jpg';
import nightImg from '../../../assets/rideclub/riders_night.jpg';

const deepImgs = [radarImg, nightImg];

const Features: React.FC = () => (
  <PageShell
    eyebrow="Features"
    title={<>Built for <em>the open road.</em></>}
    intro="Every screen, alert and map is tuned for two wheels — readable in full sun, easy to use with gloves on, and focused on keeping the pack together."
    image={heroImg}
    imageAlt="Motorcycle dashboard showing lean angle, speed and a route map"
  >
    <TabsSection
      eyebrow="Core features"
      title="Everything a ride needs."
      lead="Plan the route, bring the pack, and stay safe — without juggling three different apps."
      items={featuresData.map((f) => ({ icon: f.icon, title: f.title, desc: f.description }))}
      tint
    />
    <Zigzag
      eyebrow="Deep dives"
      title="Review every ride. Hear every turn."
      lead="Ride analytics after you park, and audio directions while you ride."
      items={deepDiveFeatures.map((f, i) => ({ title: f.title, desc: f.description, icon: f.icon, img: deepImgs[i % deepImgs.length] }))}
    />
    <CtaBand eyebrow="Get started" title="Ready for your next ride?" text="Open RideClub in your browser, plan a route and invite your pack in a couple of minutes." />
  </PageShell>
);

export default Features;
