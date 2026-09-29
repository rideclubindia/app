import React from 'react';
import { PageShell, CtaBand } from '../rideclub/PageShell';
import { IndexRows, Monograms } from '../rideclub/Sections';
import { coreValues, teamMembers } from './data';
import heroImg from '../../../assets/rideclub/riders_coast_tall.jpg';

const AboutUs: React.FC = () => (
  <PageShell
    eyebrow="About us"
    title={<>Built by riders, <em>for riders.</em></>}
    intro="We started RideClub because navigation apps didn't know the difference between a highway commute and a mountain pass. Riding isn't just transport — our software is built around that."
    image={heroImg}
    imageAlt="Riders on a winding coastal road at sunset"
    variant="banner"
  >
    <IndexRows
      eyebrow="What we believe"
      title="The values behind every feature."
      lead="The principles we use to decide what to build — and what not to."
      items={coreValues.map((v) => ({ title: v.title, desc: v.description }))}
      tint
    />
    <Monograms eyebrow="The team" title="The people building RideClub." lead="Engineers and designers who ride." people={teamMembers} />
    <CtaBand eyebrow="Ride with us" title="Join the club." text="Plan your first group ride — it takes a couple of minutes." />
  </PageShell>
);

export default AboutUs;
