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

      {/* SUBPAGE HERO */}
      <section className="subpage-hero">
        <GradientMesh palette="ember" />
        <div className="overlay"></div>
        <motion.div
          className="subpage-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Mission Critical</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>Uncompromised <br/><span style={{ color: 'var(--orange)' }}>Protection</span></motion.h1>
        </motion.div>
      </section>

      {/* PILLARS GRID */}
      <section style={{ background: '#0a0a0a', padding: '100px 40px' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
          style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}
        >
          {safetyPillars.map(pillar => {
            const Icon = pillar.icon;
            return (
              <motion.div key={pillar.id} variants={fadeInUp} {...magneticHover} style={{ background: '#141414', padding: '50px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <Icon size={40} color="var(--orange)" style={{ marginBottom: '24px' }} />
                <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>{pillar.title}</h3>
                <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: 1.7 }}>{pillar.description}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* TIMELINE */}
      <section className="timeline-section" style={{ background: 'var(--dark)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>The SOS Protocol</h2>
          <p style={{ fontSize: '18px', color: '#a1a1aa', maxWidth: '600px', margin: '20px auto 0' }}>What happens in the vital seconds after a crash is detected.</p>
        </motion.div>

        <motion.div className="timeline-container" initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer}>
          {incidentTimeline.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.step} className="timeline-item" variants={fadeInUp}>
                <div className="timeline-dot">
                  <Icon size={14} color="#fff" />
                </div>
                <div style={{ background: '#1a1a1a', padding: '40px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ color: 'var(--orange)', fontSize: '14px', fontWeight: 800, marginBottom: '8px', letterSpacing: '1px' }}>STEP {item.step}</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>{item.title}</h3>
                  <p style={{ fontSize: '16px', color: '#a1a1aa', lineHeight: 1.6, margin: 0 }}>{item.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* TESTIMONIALS */}
      <section style={{ padding: '120px 40px', background: '#0a0a0a' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
          style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '60px' }}
        >
          {safetyTestimonials.map(t => (
            <motion.div key={t.id} variants={fadeInUp} style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
              <div style={{ fontSize: '120px', color: 'rgba(239, 69, 35, 0.1)', lineHeight: 0, marginTop: '40px' }}>"</div>
              <div>
                <p style={{ fontSize: '24px', color: '#fff', fontStyle: 'italic', lineHeight: 1.5, marginBottom: '24px', fontWeight: 300 }}>{t.quote}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '40px', height: '2px', background: 'var(--orange)' }}></div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>{t.author}</div>
                    <div style={{ fontSize: '14px', color: '#a1a1aa' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

    </WebsitePage>
  );
};

export default Safety;
