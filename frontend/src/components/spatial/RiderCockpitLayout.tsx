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
  variant?: 'dark' | 'light';
}

export const RiderCockpitLayout: React.FC<RiderCockpitLayoutProps> = ({
  mainContent,
  mapChildren,
  leftPanel,
  bottomBar,
  topRail,
  leftPanelWidth = '32%',
  variant = 'dark'
}) => {
  let widthClass = 'w-[40%] max-w-[400px]';
  if (leftPanelWidth === '50%') widthClass = 'w-[50%] max-w-[550px]';
  if (leftPanelWidth === '60%') widthClass = 'w-[60%] max-w-[650px]';
  if (leftPanelWidth === '100%') widthClass = 'w-full';

  const isLight = variant === 'light';

  return (
    <div
      className={`w-full h-full flex flex-col font-sans overflow-hidden sm: gap-3 ${
        isLight ? 'bg-[#F5F6F8] text-[#111827]' : 'bg-black text-white'
      }`}
    >
      {topRail && (
        <div className="w-full shrink-0 z-50">
          {topRail}
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 w-full max-w-[1400px] mx-auto relative flex flex-row overflow-hidden gap-1 min-h-0">

        {/* LEFT PANEL */}
        {leftPanel && (
          <div
            className={`relative ${widthClass} flex-shrink-0 flex flex-col overflow-hidden z-10 ${
              isLight
                ? 'bg-white border border-[#E9ECF0] rounded-[0px] shadow-[0_2px_16px_rgba(17,24,39,0.05)]'
                : 'bg-[#0D121F] border border-[#2A3040] rounded-[8px] shadow-2xl'
            }`}
          >
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
              {leftPanel}
            </div>
          </div>
        )}

        {/* RIGHT AREA (Main Content) */}
        {leftPanelWidth !== '100%' && (
          <div
            className={`flex-1 flex flex-col relative z-0 min-h-0 overflow-hidden ${
              isLight
                ? 'bg-white border border-[#E9ECF0] rounded-[20px] shadow-[0_2px_16px_rgba(17,24,39,0.05)]'
                : 'bg-[#0D121F] border border-[#2A3040] rounded-[8px] shadow-2xl'
            }`}
          >
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
