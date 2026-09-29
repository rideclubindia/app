import React from 'react';
import { Link } from 'react-router-dom';
import { Radio, ShieldAlert, Smartphone } from 'lucide-react';
import { PageShell, SplitBand, CardGrid, CtaBand } from './Website/rideclub/PageShell';
import { Reveal } from './Website/rideclub/Reveal';

interface WebsitePageProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

const pillars = [
  { icon: Radio, title: 'Live group rides', desc: 'Everyone in the pack on one live map, with a warning when someone falls behind.' },
  { icon: ShieldAlert, title: 'Crash detection & SOS', desc: 'A 30-second countdown, then your emergency contacts and nearby riders are alerted.' },
  { icon: Smartphone, title: 'No app store needed', desc: 'Install straight from your browser — offline maps included.' }
];

const WebsitePage: React.FC<WebsitePageProps> = ({ title, subtitle, children, fullWidth }) => {
  if (fullWidth) {
    return <PageShell eyebrow="RideClub" title={title} intro={subtitle}>{children}</PageShell>;
  }

  return (
    <PageShell
      eyebrow="RideClub"
      title={title}
      intro={subtitle || `Everything you need to know about ${title.toLowerCase()} at RideClub.`}
    >
      {children ? (
        <section className="rc-band">
          <div className="rc-wrap rc-halves">
          <Reveal>
            <span className="rc-eyebrow">{title}</span>
            <nav className="rc-prose-nav" aria-label="Legal pages">
              <Link to="/privacy">Privacy policy</Link>
              <Link to="/terms">Terms of service</Link>
              <Link to="/cookies">Cookie policy</Link>
              <Link to="/contact">Contact us</Link>
            </nav>
          </Reveal>
          <div className="rc-prose">{children}</div>
          </div>
        </section>
      ) : (
        <SplitBand eyebrow="What RideClub does" title="Built for riding together." tint>
          <CardGrid items={pillars} />
        </SplitBand>
      )}
      <CtaBand eyebrow="Join RideClub" title="Ready to ride? Find your people." />
    </PageShell>
  );
};

export default WebsitePage;
