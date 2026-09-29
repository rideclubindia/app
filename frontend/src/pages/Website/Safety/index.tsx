import React from 'react';
import { PageShell, CtaBand } from '../rideclub/PageShell';
import { AccordionMedia, Timeline, QuoteBand } from '../rideclub/Sections';
import { safetyPillars, incidentTimeline, safetyTestimonials } from './data';
import heroImg from '../../../assets/webflow_dash_alert.jpg';
import pillarsImg from '../../../assets/rideclub/riders_coast_tall.jpg';
import storyImg from '../../../assets/WebsiteImages/img8.jpg';

const Safety: React.FC = () => (
  <PageShell
    eyebrow="Safety"
    title={<>If you go down, <em>help is on the way.</em></>}
    intro="RideClub watches for crashes in the background. If you don't respond within 30 seconds, it alerts your emergency contacts and riders nearby — with your exact location."
    image={heroImg}
    imageAlt="Crash detection screen counting down before sending an SOS"
    variant="banner"
  >
    <AccordionMedia
      eyebrow="Safety pillars"
      title="Four layers of protection."
      lead="Designed to catch real crashes while keeping false alarms easy to cancel."
      items={safetyPillars.map((p) => ({ icon: p.icon, title: p.title, desc: p.description }))}
      img={pillarsImg}
      imgAlt="Riders on a coastal road at sunset"
      tint
    />
    <Timeline
      eyebrow="The 30-second SOS"
      title="How a crash SOS plays out."
      lead="Three steps, no taps needed — RideClub handles it while you can't."
      steps={incidentTimeline.map((s) => ({ title: s.title, desc: s.description }))}
    />
    <QuoteBand items={safetyTestimonials} img={storyImg} tag="Rider story" />
    <CtaBand eyebrow="Ride protected" title="Turn on crash detection before your next ride." text="Add your emergency contacts once. RideClub does the rest, every ride." />
  </PageShell>
);

export default Safety;
