import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PageShell, CtaBand } from '../rideclub/PageShell';
import { Bento } from '../rideclub/Sections';
import { appFeatures } from './data';
import { InstallPWA } from '../../../components/InstallPWA';
import heroImg from '../../../assets/webflow_mesh_radar.jpg';

const TheApp: React.FC = () => (
  <PageShell
    eyebrow="The app"
    title={<>No app store. <em>No bloat.</em></>}
    intro="RideClub installs straight from your browser, opens instantly from your home screen, and keeps working when the signal drops."
    image={heroImg}
    imageAlt="RideClub group ride map showing every rider's position"
  >
    <Bento
      eyebrow="How it's built"
      title="Light on your phone. Solid on the road."
      lead="An installable web app with offline maps, long battery life and controls you can use with gloves on."
      items={appFeatures.map((f) => ({ icon: f.icon, title: f.title, desc: f.description }))}
      tint
    />

    <CtaBand
      eyebrow="Install"
      title="Add RideClub to your home screen."
      text="Install from your mobile browser in a few seconds — nothing to download from a store."
      actions={
        <>
          <InstallPWA variant="button" className="rc-btn rc-btn-primary" />
          <Link to="/login" className="rc-btn rc-btn-glass"><span>Open in browser</span><ArrowRight size={16} /></Link>
        </>
      }
    />
  </PageShell>
);

export default TheApp;
