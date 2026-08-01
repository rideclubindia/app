import React from 'react';

export type VibeIconName = 'vibe' | 'fire' | 'music' | 'coffee' | 'car' | 'camera';

export const VIBE_ICONS: VibeIconName[] = ['vibe', 'fire', 'music', 'coffee', 'car', 'camera'];

interface VibeCheckIconProps {
  icon?: VibeIconName;
  size?: number; // px
  color?: string;
  className?: string;
}

export const VibeCheckIcon: React.FC<VibeCheckIconProps> = ({ icon = 'vibe', size = 24, color = 'currentColor', className }) => {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', xmlns: 'http://www.w3.org/2000/svg', className } as any;

  switch (icon) {
    case 'vibe':
      // simple wine/bar glass (Bar wine glass)
      return (
        <svg {...common}>
          <path d="M7 2a1 1 0 00-1 1c0 3.866 3.582 7 8 7s8-3.134 8-7a1 1 0 00-1-1H7z" fill={color} />
          <path d="M12 11v7" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
          <path d="M8 18h8" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'fire':
      // fire / accident icon (replaces hazard)
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M12 2s2 2 2.5 4c.5 2-1 3-1 5 0 3-2 5-2 5s-2-2-2-5c0-2-1.5-3-1-5C9.5 4 12 2 12 2z" fill={color} />
          <path d="M12 22v-4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );

    case 'music':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M9 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" fill={color} />
          <path d="M9 17V7l8-2v10" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );

    case 'coffee':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 8h14v6a4 4 0 01-4 4H7a4 4 0 01-4-4V8z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <path d="M19 10a3 3 0 010 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    case 'car':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d="M3 13l1.5-4.5A2 2 0 016.3 7h11.4a2 2 0 011.8 1.5L21 13" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <circle cx="7.5" cy="17.5" r="1" fill={color} />
          <circle cx="16.5" cy="17.5" r="1" fill={color} />
        </svg>
      );

    case 'camera':
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke={color} strokeWidth="1.2" fill="none" />
          <circle cx="12" cy="12" r="3" fill={color} />
          <path d="M7 5l1.5-2h7L17 5" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      );

    default:
      return null;
  }
};

export default VibeCheckIcon;
