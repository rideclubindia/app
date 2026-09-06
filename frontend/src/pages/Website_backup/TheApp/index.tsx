import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { appFeatures } from './data';
import '../../Website.css';
import { fadeInUp, scaleIn, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

import { InstallPWA } from '../../../components/InstallPWA';
import { Link } from 'react-router-dom';

const TheApp: React.FC = () => {
  return (
    <WebsitePage title="The App" subtitle="Experience the native app in your browser" fullWidth={true}>
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>PROGRESSIVE WEB ARCHITECTURE</span>
        </div>
        <h1 className="dev-subpage-title">
          Zero Bloatware. <br />
          <span className="gradient-accent">No App Store Required.</span>
        </h1>
        <p className="dev-subpage-subtitle">
          Engineered as a high-performance Progressive Web App (PWA). Launches instantly from your mobile home screen with offline map caching, Bluetooth IMU sync, and sub-30ms touch responsiveness.
        </p>
      </section>

      {/* SPEC SHEET GRID */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">PWA Capabilities</div>
          <h2 className="dev-section-title">Technical Architecture & Specs</h2>
          <p className="dev-section-desc">
            Direct access to device sensors, hardware acceleration, and full offline persistence.
          </p>
        </div>

        <div className="dev-card-grid">
          {appFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="dev-feature-panel">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="dev-section pt-0">
        <div className="p-8 md:p-12 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 text-center max-w-2xl mx-auto">
          <div className="dev-section-tag mb-2">Instant Launch</div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Ready for the Open Road?</h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
            Install the Ride Club PWA directly from your mobile browser in under 5 seconds with zero download barriers.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <InstallPWA variant="button" className="dev-btn-primary" />
            <Link to="/login" className="dev-btn-secondary">
              Launch in Browser
            </Link>
          </div>
        </div>
      </section>
    </WebsitePage>
  );
};

export default TheApp;
