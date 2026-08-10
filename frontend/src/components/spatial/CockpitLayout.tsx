import React from 'react';

interface CockpitLayoutProps {
  children: React.ReactNode;
  mapChildren: React.ReactNode;
}

export const CockpitLayout: React.FC<CockpitLayoutProps> = ({ children, mapChildren }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-[#FAFAF9] flex font-sans">
      
      {/* MAP CANVAS (Right 70% in Landscape, Full in Portrait) */}
      <div className="absolute inset-0 z-0 w-full h-full landscape:left-[30%] landscape:w-[70%]">
        {mapChildren}
      </div>

      {/* COCKPIT (Left 30% in Landscape, floating / bottom in Portrait) */}
      <div className="absolute inset-y-0 left-0 w-[100%] h-full z-10 landscape:w-[30%] pointer-events-none">
        <div className="w-full h-full relative pointer-events-auto flex flex-col justify-end landscape:justify-start">
           {children}
        </div>
      </div>
      
    </div>
  );
};
