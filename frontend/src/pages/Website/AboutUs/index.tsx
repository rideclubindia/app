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
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Our Story</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>Built By Riders, <br/><span style={{ color: 'var(--orange)' }}>For Riders</span></motion.h1>
        </motion.div>
      </section>

      {/* MANIFESTO */}
      <motion.section
        className="manifesto-section"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={fadeIn}
      >
        <p className="manifesto-text">
          "We started Ride Club because we were tired of using generic navigation apps that didn't understand the difference between a highway commute and a canyon carving session. We believe motorcycling isn't just a mode of transport—it's a pursuit of freedom, and your software should reflect that passion."
        </p>
        <div style={{ marginTop: '40px', width: '60px', height: '4px', background: 'var(--orange)', margin: '40px auto 0' }}></div>
      </motion.section>

      {/* CORE VALUES */}
      <section style={{ padding: '100px 40px', background: 'var(--dark)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeInUp}
            style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', textAlign: 'center', marginBottom: '80px' }}
          >Our Core Values</motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}
          >
            {coreValues.map(value => {
              const Icon = value.icon;
              return (
                <motion.div key={value.id} variants={fadeInUp} {...magneticHover} style={{ padding: '40px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Icon size={32} color="var(--orange)" style={{ marginBottom: '24px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', marginBottom: '16px' }}>{value.title}</h3>
                  <p style={{ fontSize: '15px', color: '#a1a1aa', lineHeight: 1.6 }}>{value.description}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* TEAM GRID */}
      <section style={{ padding: '120px 40px', background: '#fff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <motion.h2
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={fadeInUp}
            style={{ fontSize: '42px', fontWeight: 900, color: '#111', letterSpacing: '-1px', marginBottom: '80px' }}
          >The Core Team</motion.h2>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={staggerContainer}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '30px' }}
          >
            {teamMembers.map((member, index) => {
              const initials = member.name.split(' ').map(n => n[0]).join('');
              const palettes = ['orange', 'violet', 'ember', 'dark'] as const;
              return (
                <motion.div key={member.id} variants={fadeInUp} {...magneticHover} style={{ textAlign: 'left' }}>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden', borderRadius: '16px', marginBottom: '20px' }}>
                    <GradientMesh palette={palettes[index % palettes.length]} />
                    <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '1px' }}>
                      {initials}
                    </div>
                  </div>
                  <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111', margin: '0 0 8px 0' }}>{member.name}</h3>
                  <p style={{ fontSize: '14px', color: 'var(--orange)', fontWeight: 700, margin: 0 }}>{member.role}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

    </WebsitePage>
  );
};

export default AboutUs;
