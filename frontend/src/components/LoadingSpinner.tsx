import React from 'react';
import { Capacitor } from '@capacitor/core';
import whiteLogo from '../assets/Logos/Logo for White Backgrounds 2.svg';
import darkLogo from '../assets/Logos/Logo for Dark Backgrounds 2.svg';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  fullScreen = false, 
  message = 'Loading...', 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: { container: 'w-16 h-16', border: 'border-[3px]', img: 'w-10 h-10' },
    md: { container: 'w-24 h-24', border: 'border-4', img: 'w-16 h-16' },
    lg: { container: 'w-40 h-40', border: 'border-4', img: 'w-28 h-28' },
    xl: { container: 'w-64 h-64', border: 'border-4', img: 'w-48 h-48' }
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative flex items-center justify-center ${sizeClasses[size].container}`}>
        <div className={`absolute inset-0 rounded-full border-gray-200 border-t-primary animate-spin ${sizeClasses[size].border}`} />
        <img 
          src={whiteLogo} 
          alt="Loading..." 
          className={`${sizeClasses[size].img} object-contain`} 
        />
      </div>
      {message && <p className="text-gray-500 font-medium animate-pulse">{message}</p>}
    </div>
  );

  // Native app only: continue the orange launch splash so there is no white flash between splash and first screen
  if (fullScreen && Capacitor.isNativePlatform()) {
    return (
      <div className="fixed inset-0 z-50 bg-[#EF4523] flex flex-col items-center justify-center" role="status" aria-label="Loading">
        <img src={darkLogo} alt="Ride Club" className="w-[40vw] max-w-[220px] h-auto animate-pulse" />
        <div className="mt-8 h-1 w-24 rounded-full bg-white/25 overflow-hidden">
          <div className="h-full w-1/3 rounded-full bg-white animate-[rc-load_1.1s_ease-in-out_infinite]" />
        </div>
        <style>{'@keyframes rc-load{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}'}</style>
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="p-8 w-full flex justify-center">{spinner}</div>;
};

export default LoadingSpinner;
