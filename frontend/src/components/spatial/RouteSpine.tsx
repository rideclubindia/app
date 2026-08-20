import React from 'react';
import { MapPin, Navigation2, Flag } from 'lucide-react';

export interface RouteNode {
  id: string;
  type: 'origin' | 'checkpoint' | 'destination';
  label: string;
  sublabel?: string;
  isActive?: boolean;
}

interface RouteSpineProps {
  nodes: RouteNode[];
  onNodeClick?: (node: RouteNode) => void;
  className?: string;
}

export const RouteSpine: React.FC<RouteSpineProps> = ({ nodes, onNodeClick, className = '' }) => {
  return (
    <div className={`flex flex-col relative ${className}`}>
      {/* The Spine Line */}
      <div className="absolute top-6 bottom-6 left-[15px] w-[2px] bg-gradient-to-b from-[var(--color-hmi-success)] via-[var(--color-hmi-text-muted)] to-[var(--color-hmi-critical)] opacity-50" />
      
      {nodes.map((node, index) => {
        const isFirst = index === 0;
        const isLast = index === nodes.length - 1;
        
        let Icon = MapPin;
        let colorClass = 'text-[var(--color-hmi-text-secondary)] border-[var(--color-hmi-text-muted)]';
        
        if (node.type === 'origin') {
          Icon = Navigation2;
          colorClass = 'text-[var(--color-hmi-success)] border-[var(--color-hmi-success)]';
        } else if (node.type === 'destination') {
          Icon = Flag;
          colorClass = 'text-[var(--color-hmi-critical)] border-[var(--color-hmi-critical)]';
        } else if (node.isActive) {
          colorClass = 'text-[var(--color-hmi-accent)] border-[var(--color-hmi-accent)]';
        }

        return (
          <div 
            key={node.id} 
            className={`flex items-start gap-4 p-2 rounded-xl transition-all ${onNodeClick ? 'cursor-pointer hover:bg-white/5 active:scale-[0.98]' : ''} ${node.isActive ? 'bg-[var(--color-hmi-accent)]/5' : ''}`}
            onClick={() => onNodeClick && onNodeClick(node)}
          >
            {/* Node Icon Container */}
            <div className={`relative z-10 w-8 h-8 rounded-full border-2 bg-[var(--color-hmi-bg)] flex items-center justify-center shrink-0 ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
            
            {/* Node Content */}
            <div className="flex flex-col justify-center min-h-[32px] pt-1">
              <span className={`font-bold tracking-wide ${node.isActive ? 'text-[var(--color-hmi-text-primary)] text-[16px]' : 'text-[var(--color-hmi-text-secondary)] text-[14px]'}`}>
                {node.label}
              </span>
              {node.sublabel && (
                <span className="text-[12px] text-[var(--color-hmi-text-muted)] mt-0.5 uppercase tracking-wider font-semibold">
                  {node.sublabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
