import React from 'react';

interface SpatialMembraneProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'solid' | 'glow';
  radius?: 'sm' | 'lg';
}

export const SpatialMembrane: React.FC<SpatialMembraneProps> = ({ 
  children, 
  className = '', 
  variant = 'solid', 
  radius = 'lg',
  ...props 
}) => {
  const baseStyle = "bg-[rgba(255,255,255,0.82)] backdrop-blur-[12px] border border-white/20";
  const glowStyle = variant === 'glow' ? "shadow-[inset_0_0_20px_rgba(249,115,22,0.4)]" : "shadow-sm";
  const radiusStyle = radius === 'sm' ? "rounded-[2px]" : "rounded-[20px]";
  
  return (
    <div 
      className={`${baseStyle} ${glowStyle} ${radiusStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
