import React from 'react';
import { Link } from 'react-router-dom';
import { PageShell, CtaBand } from '../rideclub/PageShell';
import { StatBand, IndexRows, DateRows } from '../rideclub/Sections';
import { communityStats, popularGroups, upcomingEvents } from './data';
import heroImg from '../../../assets/rideclub/riders_night.jpg';

const Community: React.FC = () => (
  <PageShell
    eyebrow="Community"
    title={<>Find your <em>riding crew.</em></>}
    intro="Form a squad, organise a Sunday run, and keep everyone on one live map — whether it's four friends or a whole club."
    image={heroImg}
    imageAlt="Motorcyclists riding together on a coastal road at dusk"
    variant="flip"
  >
    <StatBand eyebrow="The network" stats={communityStats} />
    <IndexRows
      eyebrow="Featured groups"
      title="Ride with people who ride like you."
      lead="Weekend morning packs, long-distance adventure tourers and track-day regulars."
      items={popularGroups.map((g) => ({ title: g.title, desc: g.description, meta: <Link to="/login">Join the group →</Link> }))}
      tint
    />
    <DateRows
      eyebrow="Events"
      title="Upcoming rides and rallies."
      lead="Group rides, breakfast runs and longer expeditions you can join."
      events={upcomingEvents}
    />
    <CtaBand eyebrow="Start a squad" title="Bring your crew onto one map." text="Create a group, share one link, and every rider joins the same live route." />
  </PageShell>
);

export default Community;
