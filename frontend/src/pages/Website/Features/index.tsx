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
      {/* SUBPAGE HERO */}
      <section className="subpage-hero">
        <GradientMesh palette="orange" />
        <div className="overlay"></div>
        <motion.div
          className="subpage-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Capabilities</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>Engineered for the <br/><span style={{ color: 'var(--orange)' }}>Open Road</span></motion.h1>
        </motion.div>
      </section>

      {/* APPLE-STYLE ALTERNATING SECTIONS */}
      {featuresData.map((feature, index) => {
        const isReversed = index % 2 !== 0;
        const Icon = feature.icon;
        const palette = PALETTES[index % PALETTES.length];

        return (
          <section key={feature.id} className={`apple-section ${isReversed ? 'reversed' : ''}`} style={{ gridTemplateColumns: isReversed ? '1.2fr 0.8fr' : '0.8fr 1.2fr', minHeight: '600px' }}>
            {isReversed ? (
              <>
                <motion.div className="apple-image" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
                  <GradientMesh palette={palette} />
                  <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={80} color="#fff" strokeWidth={1.5} />
                  </div>
                </motion.div>
                <motion.div className="apple-content" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
                  <Icon size={48} color="var(--orange)" style={{ marginBottom: '32px' }} />
                  <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#111', marginBottom: '24px', letterSpacing: '-1px', lineHeight: 1.1 }}>{feature.title}</h2>
                  <p style={{ fontSize: '18px', color: '#555', lineHeight: 1.6, maxWidth: '500px' }}>{feature.description}</p>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div className="apple-content" style={{ paddingLeft: '10%' }} initial="hidden" whileInView="visible" viewport={viewport} variants={slideInLeft}>
                  <Icon size={48} color="var(--orange)" style={{ marginBottom: '32px' }} />
                  <h2 style={{ fontSize: '42px', fontWeight: 800, color: '#111', marginBottom: '24px', letterSpacing: '-1px', lineHeight: 1.1 }}>{feature.title}</h2>
                  <p style={{ fontSize: '18px', color: '#555', lineHeight: 1.6, maxWidth: '500px' }}>{feature.description}</p>
                </motion.div>
                <motion.div className="apple-image" initial="hidden" whileInView="visible" viewport={viewport} variants={slideInRight}>
                  <GradientMesh palette={palette} />
                  <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={80} color="#fff" strokeWidth={1.5} />
                  </div>
                </motion.div>
              </>
            )}
          </section>
        );
      })}

      {/* DEEP DIVE SECTION */}
      <section style={{ padding: '120px 40px', background: 'var(--dark)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '48px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Deep Dive Analytics</h2>
          <p style={{ fontSize: '20px', color: '#a1a1aa', maxWidth: '600px', margin: '20px auto 0' }}>For riders who demand absolute precision from their instruments.</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', maxWidth: '1200px', margin: '0 auto' }}
        >
          {deepDiveFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div key={feature.id} variants={fadeInUp} {...magneticHover} style={{ background: '#1a1a1a', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ position: 'relative', height: '300px' }}>
                  <GradientMesh palette={PALETTES[(index + 2) % PALETTES.length]} />
                  <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={64} color="#fff" strokeWidth={1.5} />
                  </div>
                </div>
                <div style={{ padding: '40px' }}>
                  <Icon size={32} color="var(--orange)" style={{ marginBottom: '20px' }} />
                  <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>{feature.title}</h3>
                  <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: 1.6 }}>{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

    </WebsitePage>
  );
};

export default Features;
