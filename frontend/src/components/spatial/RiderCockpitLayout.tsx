import React from 'react';

interface RiderCockpitLayoutProps {
  mainContent?: React.ReactNode;
  mapChildren?: React.ReactNode; // For backwards compatibility
  leftPanel?: React.ReactNode;
  bottomDock?: React.ReactNode;
  rightPanel?: React.ReactNode;
  bottomBar?: React.ReactNode;
  topRail?: React.ReactNode; // For backwards compatibility
  leftPanelWidth?: '0%' | '32%' | '35%' | '50%' | '60%' | '100%';
  variant?: 'dark' | 'light';
  /**
   * Keep the portrait layout no matter how wide the window actually is.
   * Only the Ride and Navigation screens are allowed to reflow for a
   * landscape window (see lib/orientationRoutes) — everywhere else the
   * `landscape:` variants are dropped entirely, since an OS rotation lock
   * can't stop CSS from reacting to a landscape-shaped desktop window.
   */
  forcePortrait?: boolean;
  /**
   * True full-bleed: no rounded/bordered "card" around the map area, no
   * max-width/gap around the main content row, and no gap before
   * bottomDock/bottomBar. Distinct from leftPanelWidth === '100%' (which
   * is for pure single-column pages and doesn't render mapChildren at
   * all) — this is for a map-plus-floating-overlays screen like
   * Navigation, where the map itself must span edge to edge with nothing
   * boxing it in, while overlays (search, controls, a docked panel) still
   * render on top of it via mapChildren.
   */
  edgeToEdge?: boolean;
}

export const RiderCockpitLayout: React.FC<RiderCockpitLayoutProps> = ({
  mainContent,
  mapChildren,
  leftPanel,
  bottomDock,
  bottomBar,
  topRail,
  leftPanelWidth = '35%',
  variant = 'light',
  forcePortrait = false,
  edgeToEdge = false
}) => {
  let widthClass = forcePortrait
    ? 'w-full'
    : 'portrait:w-full landscape:w-[40%] landscape:max-w-[400px]'; // default fallback
  // Used while picking an incident's location: the map should fill the
  // portrait screen instead of splitting it with the (mostly empty at that
  // point) panel. Landscape already shows both side by side, so it keeps its
  // normal narrow width there.
  if (leftPanelWidth === '0%') widthClass = forcePortrait
    ? 'w-full h-0 overflow-hidden'
    : 'portrait:w-full portrait:h-0 portrait:overflow-hidden landscape:w-[35%] landscape:min-w-[270px] landscape:max-w-[340px]';
  if (leftPanelWidth === '35%') widthClass = forcePortrait
    ? 'w-full h-[50%]'
    : 'portrait:w-full portrait:h-[50%] landscape:w-[35%] landscape:min-w-[270px] landscape:max-w-[340px]';
  if (leftPanelWidth === '32%') widthClass = forcePortrait
    ? 'w-full'
    : 'portrait:w-full landscape:w-[32%] landscape:max-w-[400px]';
  if (leftPanelWidth === '50%') widthClass = forcePortrait
    ? 'w-full'
    : 'portrait:w-full landscape:w-[50%] landscape:max-w-[550px]';
  if (leftPanelWidth === '60%') widthClass = forcePortrait
    ? 'w-full'
    : 'portrait:w-full landscape:w-[60%] landscape:max-w-[650px]';
  if (leftPanelWidth === '100%') widthClass = 'w-full';

  const isLight = variant === 'light';
  // Full-page routes (Home, Profile, Explore, Groups, Ride+, ...) render their
  // own edge-to-edge screen with its own background/scroll handling — they
  // must NOT be boxed into the bordered/rounded/shadowed cockpit card below,
  // which was built for the split-panel HMI view. Boxing them caused a stray
  // gray page background, a floating "card" look, and a second scroll
  // container fighting each page's own overflow-y-auto (the missing-scroll bug).
  const isFullBleed = leftPanelWidth === '100%';

  return (
    <div
      className={`w-full h-full flex flex-col font-sans overflow-hidden ${edgeToEdge ? '' : 'gap-3'} ${
        isFullBleed || edgeToEdge ? '' : isLight ? 'bg-[#F5F6F8] text-[#111827]' : 'bg-black text-white'
      }`}
    >

      {/* MAIN CONTENT AREA */}
      <div className={`flex-1 relative flex ${forcePortrait ? 'flex-col' : 'portrait:flex-col landscape:flex-row'} overflow-hidden min-h-0 ${isFullBleed || edgeToEdge ? 'w-full' : 'w-full max-w-[1400px] mx-auto gap-1'}`}>

        {/* LEFT PANEL */}
        {leftPanel && (
          isFullBleed ? (
            <div className="relative w-full h-full flex flex-col overflow-hidden z-10">
              {leftPanel}
            </div>
          ) : (
          <div
            className={`relative ${widthClass} flex-shrink-0 flex flex-col overflow-hidden z-10 ${
              isLight
                ? 'bg-white border border-gray-200/80 rounded-2xl shadow-sm'
                : 'bg-[#0D121F] border border-[#2A3040] rounded-[8px] shadow-2xl'
            }`}
          >
            <div className="flex-1 overflow-y-auto hide-scrollbar flex flex-col">
              {leftPanel}
            </div>
          </div>
          )
        )}

        {/* RIGHT AREA (Main Content) — edgeToEdge drops the rounded/bordered
            "card" look entirely so the map spans truly edge to edge with
            nothing boxing it in; overlays on top of it (search, controls,
            a docked panel) come from mapChildren itself, not from this
            wrapper's styling. */}
        {leftPanelWidth !== '100%' && (
          <div
            className={`flex-1 flex flex-col relative z-0 min-h-0 overflow-hidden ${
              edgeToEdge ? '' : isLight
                ? 'bg-white border border-gray-200/80 rounded-2xl shadow-sm'
                : 'bg-[#0D121F] border border-[#2A3040] rounded-[8px] shadow-2xl'
            }`}
          >
             {mainContent || mapChildren}
          </div>
        )}
      </div>

      {/* bottomDock — only Navigation.tsx passes this. It used to be
          silently dropped (declared in the prop type, never rendered),
          which meant the End Ride / SOS / Group dock never appeared on the
          nav screen at all. */}
      {/* CommandDock now sizes itself to its buttons (inline-flex) instead
          of stretching full width — this wrapper just gives it breathing
          room instead of gluing it to the corner. Without this the dock's
          own dark background used to stretch across the whole bottom row,
          leaving a large empty dark strip next to the buttons. */}
      {bottomDock && (
        <div className="flex-shrink-0 z-50 p-4">
          {bottomDock}
        </div>
      )}

      {bottomBar && (
        <div className="flex-shrink-0 z-50">
          {bottomBar}
        </div>
      )}
    </div>
  );
};
