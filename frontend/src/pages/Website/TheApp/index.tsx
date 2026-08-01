import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { appFeatures } from './data';
import '../../Website.css';
import { fadeInUp, scaleIn, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const TheApp: React.FC = () => {
  return (
    <WebsitePage title="The App" subtitle="Experience the native app in your browser" fullWidth={true}>

      {/* SUBPAGE HERO */}
      <section className="subpage-hero">
        <GradientMesh palette="dark" />
        <div className="overlay"></div>
        <motion.div
          className="subpage-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Native Experience</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>No App Store <br/><span style={{ color: 'var(--orange)' }}>Required</span></motion.h1>
        </motion.div>
      </section>

      {/* SPEC SHEET GRID */}
      <section style={{ padding: '80px 20px', background: '#f8fafc' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#111', letterSpacing: '-1px' }}>Technical Architecture</h2>
          <p style={{ fontSize: '18px', color: '#555', maxWidth: '600px', margin: '16px auto 0' }}>Built as a Progressive Web App (PWA) to ensure maximum performance and absolute zero bloatware.</p>
        </motion.div>

        <motion.div className="spec-sheet-grid" initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}>
          {appFeatures.map(feature => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.id} className="spec-item" variants={fadeInUp} {...magneticHover}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'rgba(239, 69, 35, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={24} color="var(--orange)" />
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', margin: 0 }}>{feature.title}</h3>
                </div>
                <p style={{ fontSize: '16px', color: '#555', lineHeight: 1.6, margin: 0 }}>{feature.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CTA BANNER */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={scaleIn}
        style={{ padding: '100px 20px', background: 'var(--dark)', textAlign: 'center' }}
      >
        <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', marginBottom: '24px' }}>Ready to Ride?</h2>
        <p style={{ fontSize: '18px', color: '#a1a1aa', maxWidth: '600px', margin: '0 auto 40px auto' }}>Install the Ride Club PWA directly from your browser in under 5 seconds.</p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-orange"
          style={{ padding: '16px 40px', fontSize: '18px' }}
          onClick={() => alert("Tap the Share icon and select 'Add to Home Screen'")}
        >Install App Now</motion.button>
      </motion.section>

    </WebsitePage>
  );
};

export default TheApp;
