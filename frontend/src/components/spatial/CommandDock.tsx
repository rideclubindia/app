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
  /** Smaller footprint for floating over a map (Navigation) rather than a
   * full dedicated dock row. */
  compact?: boolean;
}

export const CommandDock: React.FC<CommandDockProps> = ({
  primaryAction,
  secondaryActions = [],
  className = '',
  compact = false
}) => {
  const secondarySize = compact ? 'w-10 h-10' : 'w-[52px] h-[52px]';
  const secondaryIcon = compact ? 'w-4 h-4' : 'w-5 h-5';
  const primaryHeight = compact ? 'h-11' : 'h-[64px]';
  const primaryPadX = compact ? 'px-5' : 'px-8';
  const primaryIcon = compact ? 'w-4 h-4' : 'w-6 h-6';
  const primaryText = compact ? 'text-[13px]' : 'text-[16px]';
  const gap = compact ? 'gap-2' : 'gap-3';
  const pad = compact ? 'p-2' : 'p-3';

  return (
    <div className={`inline-flex items-center ${gap} bg-[var(--color-hmi-surface)]/80 backdrop-blur-md ${pad} rounded-[8px] border border-[var(--color-hmi-text-muted)]/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)] ${className}`}>

      {secondaryActions.slice(0, 2).map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`${secondarySize} rounded-full flex items-center justify-center transition-all active:scale-90 ${
            action.isActive
              ? 'bg-[var(--color-hmi-accent)]/20 border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]'
              : 'bg-[var(--color-hmi-elevated)] border border-[var(--color-hmi-text-muted)]/30 text-[var(--color-hmi-text-primary)] hover:bg-[var(--color-hmi-text-muted)]/20'
          }`}
        >
          <action.icon className={secondaryIcon} />
        </button>
      ))}

      {primaryAction && (
        <button
          onClick={primaryAction.onClick}
          className={`${primaryHeight} ${primaryPadX} rounded-full flex items-center justify-center ${gap} transition-all active:scale-95 bg-[var(--color-hmi-accent)] hover:bg-[#ff603a] text-white shadow-[0_0_20px_rgba(255,77,33,0.3)] border border-[#ff8c73]/30`}
        >
          <primaryAction.icon className={primaryIcon} />
          <span className={`font-semibold uppercase tracking-wider ${primaryText}`}>{primaryAction.label}</span>
        </button>
      )}

      {secondaryActions.slice(2).map(action => (
        <button
          key={action.id}
          onClick={action.onClick}
          className={`${secondarySize} rounded-full flex items-center justify-center transition-all active:scale-90 ${
            action.isActive
              ? 'bg-[var(--color-hmi-accent)]/20 border border-[var(--color-hmi-accent)] text-[var(--color-hmi-accent)]'
              : 'bg-[var(--color-hmi-elevated)] border border-[var(--color-hmi-text-muted)]/30 text-[var(--color-hmi-text-primary)] hover:bg-[var(--color-hmi-text-muted)]/20'
          }`}
        >
          <action.icon className={secondaryIcon} />
        </button>
      ))}

    </div>
  );
};
