import React from 'react';
import { Download } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export const InstallPWA: React.FC<{ className?: string, variant?: 'button' | 'icon' }> = ({ className = '', variant = 'button' }) => {
  const { isInstallable, triggerInstall } = useInstallPrompt();

  if (!isInstallable) {
    return null;
  }

  if (variant === 'icon') {
    return (
      <button 
        onClick={triggerInstall}
        className={`flex items-center justify-center w-10 h-10 rounded-full bg-[var(--orange)] text-white hover:bg-[#ff5500] transition-colors ${className}`}
        title="Install App"
      >
        <Download size={20} />
      </button>
    );
  }

  return (
    <button
      onClick={triggerInstall}
      className={`flex items-center gap-2 px-4 py-2 bg-[var(--orange)] text-white rounded-lg font-semibold hover:bg-[#ff5500] transition-colors ${className}`}
    >
      <Download size={18} />
      Install App
    </button>
  );
};
