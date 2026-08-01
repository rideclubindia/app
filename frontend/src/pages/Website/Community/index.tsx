import React from 'react';
import { motion } from 'framer-motion';
import WebsitePage from '../../WebsitePage';
import { communityStats, popularGroups, upcomingEvents } from './data';
import { Calendar, MapPin, Users } from 'lucide-react';
import '../../Website.css';
import { fadeInUp, staggerContainer, viewport, magneticHover } from '../animations';
import { GradientMesh } from '../GradientArt';

const Community: React.FC = () => {
  return (
    <WebsitePage title="Community" fullWidth={true}>

      {/* SUBPAGE HERO */}
      <section className="subpage-hero">
        <GradientMesh palette="violet" />
        <div className="overlay"></div>
        <motion.div
          className="subpage-hero-content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp} className="hero-tag" style={{ fontSize: '12px', color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: '3px', fontWeight: 800, marginBottom: '20px' }}>Global Network</motion.div>
          <motion.h1 variants={fadeInUp} style={{ fontSize: '56px', fontWeight: 900, color: '#fff', letterSpacing: '-1.5px', margin: 0 }}>Find Your <br/><span style={{ color: 'var(--orange)' }}>Tribe</span></motion.h1>
        </motion.div>
      </section>

      {/* STATS BANNER */}
      <section style={{ background: 'var(--orange)', padding: '60px 20px', color: '#fff' }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={staggerContainer}
          style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '40px', textAlign: 'center' }}
        >
          {communityStats.map(stat => (
            <motion.div key={stat.id} variants={fadeInUp}>
              <div style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-1px', marginBottom: '8px' }}>{stat.value}</div>
              <div style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.9, fontWeight: 700 }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* MASONRY GROUPS */}
      <section style={{ padding: '120px 20px', background: 'var(--dark)' }}>
        <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={fadeInUp} style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ fontSize: '42px', fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>Explore Collectives</h2>
          <p style={{ fontSize: '18px', color: '#a1a1aa', maxWidth: '600px', margin: '20px auto 0' }}>Join specific syndicates tailored to your riding style and location.</p>
        </motion.div>

        <motion.div className="masonry-grid" initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {popularGroups.map((group, index) => {
            const Icon = group.icon;
            return (
              <motion.div key={group.id} className="masonry-item" variants={fadeInUp} {...magneticHover}>
                <GradientMesh palette={['violet', 'orange', 'ember'][index % 3] as any} />
                <div style={{ position: 'absolute', top: '30px', left: '30px', zIndex: 2 }}>
                  <Icon size={36} color="rgba(255,255,255,0.85)" />
                </div>
                <div className="masonry-item-overlay">
                  <h3 style={{ fontSize: '24px', fontWeight: 800, color: '#fff', marginBottom: '12px' }}>{group.title}</h3>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>{group.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* EVENTS TOUR LIST */}
      <section style={{ padding: '100px 20px', background: '#0a0a0a' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#fff', letterSpacing: '-1px', margin: 0 }}>Upcoming Rallies</h2>
            <div style={{ color: 'var(--orange)', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', textTransform: 'uppercase', cursor: 'pointer' }}>View All</div>
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={staggerContainer} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {upcomingEvents.map(event => (
              <motion.div key={event.id} variants={fadeInUp} whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }} style={{ display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: '30px', alignItems: 'center', padding: '30px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '30px' }}>
                  <div style={{ fontSize: '14px', color: 'var(--orange)', fontWeight: 800 }}>{event.date.split(' ')[0]}</div>
                  <div style={{ fontSize: '24px', color: '#fff', fontWeight: 900 }}>{event.date.split(' ')[1]}</div>
                </div>

                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>{event.title}</h3>
                  <div style={{ display: 'flex', gap: '20px', color: '#a1a1aa', fontSize: '14px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {event.location}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', fontWeight: 700, background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '20px' }}>
                    <Users size={16} color="var(--orange)" />
                    {event.attendees} Registered
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </WebsitePage>
  );
};

export default Community;
