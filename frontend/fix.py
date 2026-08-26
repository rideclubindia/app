import re

# Fix HomeLandscape.tsx
with open('src/components/HomeLandscape.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix duplicate div
content = content.replace(
'''            <div className="absolute left-14 bg-[#111111] text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">''',
'''            <div className="absolute left-14 bg-[#111111] text-white text-xs font-semibold px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">'''
)

with open('src/components/HomeLandscape.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

# Fix MapEngine.tsx
with open('src/map/MapEngine.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the big block
target = '''      if (mode === 'navigation') {
        map.current.easeTo({ 
          center: [userLocation.lng, userLocation.lat],
          zoom: 17,
          pitch: 60,
          bearing: initialBearingRef.current,
          duration: 1000
        });
        if (modeChanged) {
          map.current.easeTo({ 
            center: [userLocation.lng, userLocation.lat],
            zoom: 17,
            pitch: 60,
            bearing: initialBearingRef.current,
            duration: 1000
          });
        } else {
          // Just follow the center without forcing zoom/pitch to allow user interaction
          map.current.easeTo({ 
            center: [userLocation.lng, userLocation.lat],
            duration: 1000,
            easing: (t) => t
          });
        }
      } else {
        // Reset bearing if exiting navigation mode
        if (map.current.getPitch() > 0) {
        if (modeChanged && map.current.getPitch() > 0) {
          map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        }
      }'''

replacement = '''      if (mode === 'navigation') {
        if (modeChanged) {
          map.current.easeTo({ 
            center: [userLocation.lng, userLocation.lat],
            zoom: 17,
            pitch: 60,
            bearing: initialBearingRef.current,
            duration: 1000
          });
        } else {
          // Just follow the center without forcing zoom/pitch to allow user interaction
          map.current.easeTo({ 
            center: [userLocation.lng, userLocation.lat],
            duration: 1000,
            easing: (t) => t
          });
        }
      } else {
        // Reset bearing if exiting navigation mode
        if (modeChanged && map.current.getPitch() > 0) {
          map.current.easeTo({ pitch: 0, bearing: 0, duration: 1000 });
        }
      }'''

content = content.replace(target, replacement)

with open('src/map/MapEngine.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed files!")
