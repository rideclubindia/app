import React from 'react';

export const MiniMap: React.FC = () => {
  return (
    <div className="relative w-full h-full min-h-[300px] flex items-center justify-center overflow-hidden opacity-40">
      {/* Abstract dark map background pattern */}
      <svg width="100%" height="100%" className="absolute inset-0" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="city-blocks" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M10 10 h 30 v 40 h -30 z" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M50 10 h 40 v 20 h -40 z" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M50 40 h 20 v 50 h -20 z" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M80 40 h 10 v 50 h -10 z" fill="none" stroke="#333" strokeWidth="2" />
            <path d="M10 60 h 30 v 30 h -30 z" fill="none" stroke="#333" strokeWidth="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#city-blocks)" />
      </svg>
      
      {/* Glowing Blue Dot */}
      <div className="absolute z-10 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)] border-2 border-white transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-50"></div>
      </div>
    </div>
  );
};
