import React from 'react';
import whiteLogo from '../assets/Logos/Logo for White Backgrounds 2.svg';

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
