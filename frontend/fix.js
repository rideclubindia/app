const fs = require('fs');

// Fix HomeLandscape.tsx
let content1 = fs.readFileSync('src/components/HomeLandscape.tsx', 'utf-8');
content1 = content1.replace(
  '            <div className="absolute left-14 bg-[#111111] text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\r\n            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">',
  '            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">'
);
content1 = content1.replace(
  '            <div className="absolute left-14 bg-[#111111] text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">\n            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">',
  '            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">'
);

fs.writeFileSync('src/components/HomeLandscape.tsx', content1);

// Fix MapEngine.tsx
let content2 = fs.readFileSync('src/map/MapEngine.tsx', 'utf-8');
const searchStr =       if (mode === 'navigation') {
        map.current.easeTo({ 
          center: [userLocation.lng, userLocation.lat],
          zoom: 17,
          pitch: 60,
          bearing: initialBearingRef.current,
          duration: 1000
        });
        if (modeChanged) {;

const replaceStr =       if (mode === 'navigation') {
        if (modeChanged) {;
content2 = content2.replace(searchStr, replaceStr);
content2 = content2.replace(searchStr.replace(/\r\n/g, '\n'), replaceStr.replace(/\r\n/g, '\n'));

const searchStr2 =         // Reset bearing if exiting navigation mode
        if (map.current.getPitch() > 0) {
        if (modeChanged && map.current.getPitch() > 0) {;

const replaceStr2 =         // Reset bearing if exiting navigation mode
        if (modeChanged && map.current.getPitch() > 0) {;

content2 = content2.replace(searchStr2, replaceStr2);
content2 = content2.replace(searchStr2.replace(/\r\n/g, '\n'), replaceStr2.replace(/\r\n/g, '\n'));

fs.writeFileSync('src/map/MapEngine.tsx', content2);
console.log("Fixed files!");
