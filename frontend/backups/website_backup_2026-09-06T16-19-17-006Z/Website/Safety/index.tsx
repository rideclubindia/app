import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { safetyPillars, incidentTimeline, safetyTestimonials } from './data';
import '../../Website.css';
import { fadeInUp, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const Safety: React.FC = () => {
  return (
    <WebsitePage title="Safety" fullWidth={true}>
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>MISSION CRITICAL SAFETY ARCHITECTURE</span>
        </div>
        <h1 className="dev-subpage-title">
          Uncompromised <br />
          <span className="gradient-accent">Rider Protection</span>
        </h1>
        <p className="dev-subpage-subtitle">
          Engineered for unexpected road incidents. The Ride Club safety daemon operates autonomously in the background, utilizing phone gyros and emergency mesh broadcasts to protect riders when seconds count.
        </p>
      </section>

      {/* PILLARS GRID */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Safety Pillars</div>
          <h2 className="dev-section-title">Autonomous Impact Sentinel</h2>
          <p className="dev-section-desc">
            Multi-tiered monitoring designed to eliminate false alarms while guaranteeing instant SOS dispatch during genuine incidents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safetyPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div key={pillar.id} className="dev-feature-panel">
                <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                  <Icon size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-3 tracking-tight">{pillar.title}</h3>
                <p className="text-base text-zinc-400 leading-relaxed">{pillar.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TIMELINE (SOS PROTOCOL) */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Countdown Protocol</div>
          <h2 className="dev-section-title">The 30-Second SOS Pipeline</h2>
          <p className="dev-section-desc">
            Precise state machine triggered upon severe G-force deceleration or abrupt rotational rollover.
          </p>
        </div>

        <div className="space-y-4 font-mono">
          {incidentTimeline.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="dev-feature-panel flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <span className="text-orange-500 font-bold text-sm bg-orange-500/10 px-3 py-1 rounded border border-orange-500/20">
                    PHASE 0{item.step}
                  </span>
                  <div className="text-lg font-bold font-sans text-white">{item.title}</div>
                </div>
                <div className="text-sm text-zinc-400 font-sans max-w-xl">
                  {item.description}
                </div>
                <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                  <Icon size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* RIDER TESTIMONIALS */}
      <section className="dev-section pt-0">
        <div className="p-8 md:p-12 rounded-xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800">
          <span className="dev-section-tag">Rider Verification</span>
          <h3 className="text-2xl font-bold text-white mb-6">Real-World Incident Reports</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {safetyTestimonials.map((t) => (
              <div key={t.id} className="space-y-4">
                <p className="text-base text-zinc-300 italic leading-relaxed">"{t.quote}"</p>
                <div className="font-mono text-xs text-orange-500">
                  — {t.author} <span className="text-zinc-500">| {t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </WebsitePage>
  );
};

export default Safety;
