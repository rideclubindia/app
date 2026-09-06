import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { featuresData, deepDiveFeatures } from './data';
import '../../Website.css';
import { fadeInUp, slideInLeft, slideInRight, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const PALETTES = ['orange', 'violet', 'ember', 'dark'] as const;

const Features: React.FC = () => {
  return (
    <WebsitePage title="Features" fullWidth={true}>
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>COCKPIT CAPABILITIES & SPECS</span>
        </div>
        <h1 className="dev-subpage-title">
          Engineered for <br />
          <span className="gradient-accent">The Open Road</span>
        </h1>
        <p className="dev-subpage-subtitle">
          Every screen, gauge, and safety protocol is tuned for two wheels. High-contrast readability in glaring sunlight, tactile large touch targets, and millisecond telemetry precision.
        </p>
      </section>

      {/* CORE CAPABILITY ROWS (Webflow Developer Style) */}
      <div className="py-8">
        {featuresData.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div key={feature.id} className="dev-feature-row">
              <div className="dev-feature-panel">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <Icon size={24} />
                  </div>
                  <span className="font-mono text-xs text-orange-500 uppercase tracking-wider font-bold">
                    Feature 0{index + 1}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">
                  {feature.title}
                </h2>
                <p className="text-base text-zinc-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              <div className="dev-feature-panel flex flex-col justify-center min-h-[260px] font-mono text-xs border-dashed">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-zinc-400">
                  <span>TELEMETRY SUBSYSTEM</span>
                  <span className="text-emerald-400">STATUS: ACTIVE</span>
                </div>
                <div className="py-4 space-y-2 text-zinc-400">
                  <div>├── Pipeline: Vector Engine v2.4</div>
                  <div>├── Sensitivity: High-G Calibration</div>
                  <div>└── Protocol: Realtime Low-Latency Mesh</div>
                </div>
                <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-center justify-between">
                  <span>LATENCY: &lt;15ms</span>
                  <span className="text-orange-500">VERIFIED COMPLIANT</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* DEEP DIVE ANALYTICS GRID */}
      <section className="dev-section pt-12">
        <div className="dev-section-header">
          <div className="dev-section-tag">Deep Dives</div>
          <h2 className="dev-section-title">High-Precision Instruments</h2>
          <p className="dev-section-desc">
            Advanced rider telemetrics and safety routines designed to protect and inform without distraction.
          </p>
        </div>

        <div className="dev-card-grid">
          {deepDiveFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.id} className="dev-feature-panel">
                <div className="w-10 h-10 rounded-md bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-orange-500 mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </WebsitePage>
  );
};

export default Features;
