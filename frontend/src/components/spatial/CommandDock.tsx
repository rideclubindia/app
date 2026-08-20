import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface CommandAction {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  isActive?: boolean;
}

interface CommandDockProps {
  primaryAction?: CommandAction;
  secondaryActions?: CommandAction[];
  className?: string;
}

export const CommandDock: React.FC<CommandDockProps> = ({ 
  primaryAction, 
  secondaryActions = [], 
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-3 bg-[var(--color-hmi-surface)]/80 backdrop-blur-md p-3 rounded-[24px] border border-[var(--color-hmi-text-muted)]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${className}`}>
      
      {secondaryActions.slice(0, 2).map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-90 ${
            action.isActive 
              ? 'bg-[var(--color-hmi-accent)]/20 border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]' 
              : 'bg-[var(--color-hmi-elevated)] border border-[var(--color-hmi-text-muted)]/30 text-[var(--color-hmi-text-primary)] hover:bg-[var(--color-hmi-text-muted)]/20'
          }`}
        >
          <action.icon className="w-5 h-5" />
        </button>
      ))}

      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className="h-[64px] px-8 rounded-full flex items-center justify-center gap-3 transition-all active:scale-95 bg-[var(--color-hmi-accent)] hover:bg-[#ff603a] text-white shadow-[0_0_20px_rgba(255,77,33,0.3)] border border-[#ff8c73]/30"
        >
          <primaryAction.icon className="w-6 h-6" />
          <span className="font-black uppercase tracking-wider text-[16px]">{primaryAction.label}</span>
        </button>
      )}

      {secondaryActions.slice(2).map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-all active:scale-90 ${
            action.isActive 
              ? 'bg-[var(--color-hmi-accent)]/20 border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]' 
              : 'bg-[var(--color-hmi-elevated)] border border-[var(--color-hmi-text-muted)]/30 text-[var(--color-hmi-text-primary)] hover:bg-[var(--color-hmi-text-muted)]/20'
          }`}
        >
          <action.icon className="w-5 h-5" />
        </button>
      ))}

    </div>
  );
};
