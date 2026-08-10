import React from 'react';

export const HomeShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="w-full h-[100dvh] relative overflow-hidden bg-[#FAFAF9] font-sans">
      {children}
    </div>
  );
};
