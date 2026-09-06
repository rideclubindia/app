import React from 'react';
import { Link } from 'react-router-dom';
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
      {/* WEBFLOW DEVELOPER SUBPAGE HERO */}
      <section className="dev-subpage-hero">
        <div className="dev-subpage-badge">
          <span>GLOBAL MOTORCYCLE SYNDICATES & CLUSTERS</span>
        </div>
        <h1 className="dev-subpage-title">
          Find Your <br />
          <span className="gradient-accent">Riding Tribe</span>
        </h1>
        <p className="dev-subpage-subtitle">
          Over 1,800 active motorcycle clubs and chapters ride together on Ride Club. Form custom squads, organize Sunday canyon runs, and broadcast live squad locations without losing pack members.
        </p>
      </section>

      {/* STATS BANNER */}
      <section className="dev-section pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {communityStats.map((stat) => (
            <div key={stat.id} className="dev-feature-panel text-center">
              <div className="text-3xl md:text-4xl font-extrabold text-white font-mono mb-2">
                {stat.value}
              </div>
              <div className="text-xs text-orange-500 uppercase tracking-widest font-mono font-bold">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* MOTORCYCLE COLLECTIVES */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Featured Chapters</div>
          <h2 className="dev-section-title">Explore Active Motorcycle Groups</h2>
          <p className="dev-section-desc">
            Connect with local weekend morning packs, long-distance adventure tourers, and track day groups.
          </p>
        </div>

        <div className="dev-card-grid">
          {popularGroups.map((group) => {
            const Icon = group.icon;
            return (
              <div key={group.id} className="dev-feature-panel">
                <div className="w-10 h-10 rounded-md bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-6">
                  <Icon size={20} />
                </div>
                <h3 className="text-xl font-bold mb-2 tracking-tight">{group.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">{group.description}</p>
                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono text-zinc-500">
                  <span>PACK VERIFIED</span>
                  <Link to="/login" className="text-orange-500 hover:text-white transition-colors">
                    Join Squad &rarr;
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* UPCOMING RALLIES */}
      <section className="dev-section pt-0">
        <div className="dev-section-header">
          <div className="dev-section-tag">Events Calendar</div>
          <h2 className="dev-section-title">Upcoming Group Rallies & Expeditions</h2>
          <p className="dev-section-desc">
            Verified weekend group rides, sunrise breakfast runs, and long-range expeditions.
          </p>
        </div>

        <div className="space-y-4">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="dev-feature-panel flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-6">
                <div className="font-mono text-center shrink-0 w-16 p-2 rounded bg-zinc-900 border border-zinc-800">
                  <div className="text-xs text-orange-500 font-bold">{event.date.split(' ')[0]}</div>
                  <div className="text-xl font-black text-white">{event.date.split(' ')[1]}</div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{event.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 font-mono">
                    <span className="flex items-center gap-1.5"><MapPin size={13} /> {event.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <span className="font-mono text-xs text-zinc-400 flex items-center gap-1.5">
                  <Users size={14} className="text-orange-500" />
                  {event.attendees} Registered
                </span>
                <Link to="/login" className="dev-btn-secondary text-xs py-1.5 px-3">
                  RSVP Spot
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>
    </WebsitePage>
  );
};

export default Community;
