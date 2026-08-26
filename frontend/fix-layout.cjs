const fs = require('fs');
let content = fs.readFileSync('src/components/HomeLandscape.tsx', 'utf-8');

// Make LeftNavigationRail responsive
content = content.replace(
  '    <div className="w-[56px] h-full bg-[#111111] flex flex-col items-center py-4 gap-6 shrink-0 z-50">',
  '    <div className="w-full h-[60px] md:w-[56px] landscape:w-[56px] landscape:h-full md:h-full bg-[#111111] flex flex-row md:flex-col landscape:flex-col items-center justify-around md:justify-start landscape:justify-start py-2 md:py-4 landscape:py-4 gap-2 md:gap-6 landscape:gap-6 shrink-0 z-50 order-last md:order-first landscape:order-first">'
);

content = content.replace(
  '      {/* Brand logo at the top */}\r\n      <div className="w-8 h-8 rounded-full bg-[#FF5A00] flex items-center justify-center mb-1 shadow-[0_0_10px_rgba(255,90,0,0.4)]">\r\n        <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>\r\n      </div>',
  '      {/* Brand logo at the top */}\r\n      <div className="hidden md:flex landscape:flex w-8 h-8 rounded-full bg-[#FF5A00] items-center justify-center mb-1 shadow-[0_0_10px_rgba(255,90,0,0.4)]">\r\n        <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>\r\n      </div>'
);
content = content.replace(
  '      {/* Brand logo at the top */}\n      <div className="w-8 h-8 rounded-full bg-[#FF5A00] flex items-center justify-center mb-1 shadow-[0_0_10px_rgba(255,90,0,0.4)]">\n        <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>\n      </div>',
  '      {/* Brand logo at the top */}\n      <div className="hidden md:flex landscape:flex w-8 h-8 rounded-full bg-[#FF5A00] items-center justify-center mb-1 shadow-[0_0_10px_rgba(255,90,0,0.4)]">\n        <span className="text-white text-[10px] font-semibold italic tracking-tighter">RC</span>\n      </div>'
);

content = content.replace(
  '            {/* Active indicator */}\r\n            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF5A00] rounded-r-full" />}',
  '            {/* Active indicator */}\r\n            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF5A00] rounded-r-full hidden md:block landscape:block" />}\r\n            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#FF5A00] rounded-t-full block md:hidden landscape:hidden" />}'
);
content = content.replace(
  '            {/* Active indicator */}\n            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF5A00] rounded-r-full" />}',
  '            {/* Active indicator */}\n            {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#FF5A00] rounded-r-full hidden md:block landscape:block" />}\n            {isActive && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-[#FF5A00] rounded-t-full block md:hidden landscape:hidden" />}'
);

content = content.replace(
  '            {/* Tooltip on hover */}\r\n            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\r\n              {item.label}\r\n            </div>',
  '            {/* Tooltip on hover */}\r\n            <div className="hidden md:block landscape:block absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\r\n              {item.label}\r\n            </div>'
);
content = content.replace(
  '            {/* Tooltip on hover */}\n            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\n              {item.label}\n            </div>',
  '            {/* Tooltip on hover */}\n            <div className="hidden md:block landscape:block absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\n              {item.label}\n            </div>'
);

// Make main layout responsive
content = content.replace(
  '  return (\r\n    <div className="w-full  bg-[#E8F1F2] overflow-hidden flex flex-row" style={{ height: \'100dvh\' }}>',
  '  return (\r\n    <div className="w-full bg-[#E8F1F2] overflow-hidden flex flex-col md:flex-row landscape:flex-row" style={{ height: \'100dvh\' }}>'
);
content = content.replace(
  '  return (\n    <div className="w-full  bg-[#E8F1F2] overflow-hidden flex flex-row" style={{ height: \'100dvh\' }}>',
  '  return (\n    <div className="w-full bg-[#E8F1F2] overflow-hidden flex flex-col md:flex-row landscape:flex-row" style={{ height: \'100dvh\' }}>'
);

content = content.replace(
  '      {/* 2. Left Telemetry Panel - COMPACT MODE */}\r\n      <div className="flex flex-col w-[35%] min-w-[320px] max-w-[340px] h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-r border-gray-200">',
  '      {/* 2. Left Telemetry Panel - COMPACT MODE */}\r\n      <div className="flex flex-col w-full h-[45%] md:w-[35%] landscape:w-[35%] md:min-w-[320px] md:max-w-[340px] md:h-full landscape:h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] md:border-r landscape:border-r border-t md:border-t-0 landscape:border-t-0 border-gray-200 order-2 md:order-2 landscape:order-2">'
);
content = content.replace(
  '      {/* 2. Left Telemetry Panel - COMPACT MODE */}\n      <div className="flex flex-col w-[35%] min-w-[320px] max-w-[340px] h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] border-r border-gray-200">',
  '      {/* 2. Left Telemetry Panel - COMPACT MODE */}\n      <div className="flex flex-col w-full h-[45%] md:w-[35%] landscape:w-[35%] md:min-w-[320px] md:max-w-[340px] md:h-full landscape:h-full bg-[#F7F8FA] shrink-0 z-10 shadow-[4px_0_15px_rgba(0,0,0,0.05)] md:border-r landscape:border-r border-t md:border-t-0 landscape:border-t-0 border-gray-200 order-2 md:order-2 landscape:order-2">'
);

content = content.replace(
  '      {/* 3. Right Map Area - EXACTLY 55% */}\r\n      <div className="w-[55%] h-full relative z-0 overflow-hidden shrink-0">',
  '      {/* 3. Right Map Area - EXACTLY 55% */}\r\n      <div className="flex-1 w-full md:w-[55%] landscape:w-[55%] md:h-full landscape:h-full relative z-0 overflow-hidden shrink-0 order-1 md:order-3 landscape:order-3">'
);
content = content.replace(
  '      {/* 3. Right Map Area - EXACTLY 55% */}\n      <div className="w-[55%] h-full relative z-0 overflow-hidden shrink-0">',
  '      {/* 3. Right Map Area - EXACTLY 55% */}\n      <div className="flex-1 w-full md:w-[55%] landscape:w-[55%] md:h-full landscape:h-full relative z-0 overflow-hidden shrink-0 order-1 md:order-3 landscape:order-3">'
);

fs.writeFileSync('src/components/HomeLandscape.tsx', content);
console.log("HomeLandscape made responsive!");
