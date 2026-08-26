const fs = require('fs');
let content = fs.readFileSync('src/components/HomeLandscape.tsx', 'utf-8');

// Fix telemetry panel
content = content.replace(
  '<div className="flex flex-col w-[30%] min-w-[270px] max-w-[340px] h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-r border-gray-200">',
  '<div className="flex flex-col w-full h-[55%] md:w-[30%] landscape:w-[30%] md:min-w-[270px] md:max-w-[340px] md:h-full landscape:h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] md:border-r landscape:border-r border-t md:border-t-0 landscape:border-t-0 border-gray-200 order-2 md:order-2 landscape:order-2">'
);

// Fix map panel
content = content.replace(
  '<div className="w-[70%] h-full relative z-0 overflow-hidden shrink-0">',
  '<div className="flex-1 w-full md:w-[70%] landscape:w-[70%] md:h-full landscape:h-full relative z-0 overflow-hidden shrink-0 order-1 md:order-3 landscape:order-3">'
);

// Fix left nav rail order
content = content.replace(
  '<LeftNavigationRail />',
  '<LeftNavigationRail />'
);

fs.writeFileSync('src/components/HomeLandscape.tsx', content);
