import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { coreValues, teamMembers } from './data';
import '../../Website.css';
import { fadeInUp, fadeIn, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const AboutUs: React.FC = () => {
  return (
    <WebsitePage title="About Us" fullWidth={true}>
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>ORIGIN MANIFESTO & SYSTEM SPECS</span>
        </div>
        <h1 className="dev-subpage-title">
          Built By Riders, <br />
          <span className="gradient-accent">For Riders</span>
        </h1>
        <p className="dev-subpage-subtitle">
          "We started Ride Club because generic navigation maps didn't understand the difference between a highway commute and a canyon carving session. Motorcycling isn't just transport—it's a pursuit of freedom, and our cockpit software reflects that passion."
        </p>
      </section>

      {/* CORE VALUES (Webflow Developer Cards) */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Engineering Ethos</div>
          <h2 className="dev-section-title">Our Guiding Core Values</h2>
          <p className="dev-section-desc">
            The principles that guide our development of low-latency, mission-critical motorcycle software.
          </p>
        </div>

        <div className="dev-card-grid">
          {coreValues.map((value) => {
            const Icon = value.icon;
            return (
              <div key={value.id} className="dev-feature-panel">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{value.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* LEADERSHIP & CORE TEAM */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Founding Team</div>
          <h2 className="dev-section-title">The Engineering & Ride Leads</h2>
          <p className="dev-section-desc">
            Passionate motorcyclists combining embedded systems engineering with real open-road experience.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {teamMembers.map((member) => {
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .join('');
            return (
              <div key={member.id} className="dev-feature-panel text-center">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-lg font-black text-white mx-auto mb-4 font-mono">
                  {initials}
                </div>
                <h3 className="text-lg font-bold text-white mb-1 tracking-tight">{member.name}</h3>
                <p className="text-xs font-mono text-orange-500 font-semibold">{member.role}</p>
              </div>
            );
          })}
        </div>
      </section>
    </WebsitePage>
  );
};

export default AboutUs;
