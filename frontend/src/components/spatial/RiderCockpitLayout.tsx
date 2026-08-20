import React from 'react';

interface RiderCockpitLayoutProps {
  mainContent?: React.ReactNode;
  mapChildren?: React.ReactNode; // For backwards compatibility
  leftPanel?: React.ReactNode;
  bottomDock?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomBar?: React.ReactNode;
  topRail?: React.ReactNode; // For backwards compatibility
  leftPanelWidth?: '32%' | '50%' | '60%' | '100%';
}

export const RiderCockpitLayout: React.FC<RiderCockpitLayoutProps> = ({ 
  mainContent,
  mapChildren, 
  leftPanel,
  bottomBar,
  topRail,
  leftPanelWidth = '32%'
}) => {
  let widthClass = 'w-[32%] max-w-[400px]';
  if (leftPanelWidth === '50%') widthClass = 'w-[50%] max-w-[550px]';
  if (leftPanelWidth === '60%') widthClass = 'w-[60%] max-w-[650px]';
  if (leftPanelWidth === '100%') widthClass = 'w-full';

  return (
    <div className="w-full h-screen bg-black flex flex-col font-sans text-white overflow-hidden p-2 sm:p-6 gap-4">
      {topRail && (
        <div className="w-full shrink-0 z-50">
          {topRail}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto relative flex flex-row overflow-hidden gap-4 min-h-0">
        
        {/* LEFT PANEL */}
        {leftPanel && (
          <div className={`relative ${widthClass} flex-shrink-0 bg-[#0D121F] border border-[#2A3040] rounded-[24px] flex flex-col overflow-hidden z-10 shadow-2xl`}>
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
              {leftPanel}
            </div>
          </div>
        )}

        {/* RIGHT AREA (Main Content) */}
        {leftPanelWidth !== '100%' && (
          <div className="flex-1 flex flex-col relative z-0 min-h-0 bg-[#0D121F] border border-[#2A3040] rounded-[24px] overflow-hidden shadow-2xl">
             {mainContent || mapChildren}
          </div>
        )}
      </div>

      {bottomBar && (
        <div className="flex-shrink-0 z-50">
          {bottomBar}
        </div>
      )}
    </div>
  );
};
