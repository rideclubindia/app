import React from 'react';

export interface TelemetryProps {
  label: string;
  value: string | number;
  unit?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'accent' | 'warning' | 'critical' | 'live';
  className?: string;
}

export const Telemetry: React.FC<TelemetryProps> = ({ 
  label, 
  value, 
  unit, 
  size = 'md', 
  trend,
  color = 'primary',
  className = '' 
}) => {
  const sizeMap = {
    sm: { value: 'text-[18px]', label: 'text-[10px]' },
    md: { value: 'text-[24px]', label: 'text-[11px]' },
    lg: { value: 'text-[42px]', label: 'text-[12px]' },
    xl: { value: 'text-[64px]', label: 'text-[14px]' }
  };

  const colorMap = {
    primary: 'text-[var(--color-hmi-text-primary)]',
    accent: 'text-[var(--color-hmi-accent)]',
    warning: 'text-[var(--color-hmi-warning)]',
    critical: 'text-[var(--color-hmi-critical)]',
    live: 'text-[var(--color-hmi-live)]'
  };

  return (
    <div className={`flex flex-col font-sans ${className}`}>
      <span className={`uppercase tracking-[0.1em] text-[var(--color-hmi-text-muted)] font-semibold mb-1 ${sizeMap[size].label}`}>
        {label}
      </span>
      <div className="flex items-baseline gap-1">
        <span className={`font-black tracking-tight tabular-nums leading-none ${sizeMap[size].value} ${colorMap[color]}`}>
          {value}
        </span>
        {unit && (
          <span className={`font-bold tracking-wider text-[var(--color-hmi-text-secondary)] ${size === 'xl' ? 'text-[20px]' : size === 'lg' ? 'text-[16px]' : 'text-[12px]'}`}>
            {unit}
          </span>
        )}
      </div>
      {trend && (
        <div className={`mt-1 flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider ${trend === 'up' ? 'text-[var(--color-hmi-success)]' : trend === 'down' ? 'text-[var(--color-hmi-critical)]' : 'text-[var(--color-hmi-text-muted)]'}`}>
          {trend === 'up' && '▲ INCREASE'}
          {trend === 'down' && '▼ DECREASE'}
          {trend === 'neutral' && '◆ STABLE'}
        </div>
      )}
    </div>
  );
};
