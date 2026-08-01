import React from 'react';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

const PALETTES: Record<string, [string, string, string]> = {
  orange: ['#ef4523', '#ff6b4a', '#1a0a06'],
  dark: ['#2a2a2a', '#0a0a0a', '#000000'],
  violet: ['#ef4523', '#6b21a8', '#0a0a0a'],
  ember: ['#ff8a3d', '#ef4523', '#1a0505'],
};

interface MeshProps {
  palette?: keyof typeof PALETTES;
  className?: string;
  style?: React.CSSProperties;
}

// Abstract animated gradient-mesh background used in place of stock photography.
export const GradientMesh: React.FC<MeshProps> = ({ palette = 'orange', className, style }) => {
  const [c1, c2, c3] = PALETTES[palette];
  return (
    <div className={className} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: c3, ...style }}>
      <motion.div
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '70%', borderRadius: '50%', background: c1, filter: 'blur(90px)', opacity: 0.55 }}
      />
      <motion.div
        animate={{ x: [0, -30, 30, 0], y: [0, 30, -20, 0] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', bottom: '-25%', right: '-15%', width: '65%', height: '65%', borderRadius: '50%', background: c2, filter: 'blur(100px)', opacity: 0.45 }}
      />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
    </div>
  );
};

interface PhoneMockupProps {
  icon: LucideIcon;
  label: string;
  palette?: keyof typeof PALETTES;
  accent?: string;
}

// Lightweight device-frame mockup with a gradient "screen" and a headline icon —
// stands in for real app-screen photography.
export const PhoneMockup: React.FC<PhoneMockupProps> = ({ icon: Icon, label, palette = 'orange', accent }) => {
  const [c1, c2] = PALETTES[palette];
  return (
    <div style={{ position: 'relative', width: '260px', maxWidth: '80%', aspectRatio: '9/19', borderRadius: '40px', background: '#111', padding: '10px', boxShadow: '0 30px 80px rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', width: '70px', height: '18px', borderRadius: '10px', background: '#000', zIndex: 3 }} />
      <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '30px', overflow: 'hidden', background: `linear-gradient(160deg, ${c1}, ${c2})` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '20px', textAlign: 'center' }}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={30} color={accent || '#fff'} />
          </div>
          <div style={{ color: '#fff', fontSize: '14px', fontWeight: 800, letterSpacing: '0.5px' }}>{label}</div>
        </motion.div>
      </div>
    </div>
  );
};
