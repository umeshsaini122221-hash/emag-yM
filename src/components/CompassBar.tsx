import React from 'react';

interface CompassBarProps {
  heading: number; // degrees 0-360
}

export const CompassBar: React.FC<CompassBarProps> = ({ heading }) => {
  // Cardinal markers
  const markers = [
    { deg: 0, label: 'N' },
    { deg: 45, label: 'NE' },
    { deg: 90, label: 'E' },
    { deg: 135, label: 'SE' },
    { deg: 180, label: 'S' },
    { deg: 225, label: 'SW' },
    { deg: 270, label: 'W' },
    { deg: 315, label: 'NW' },
  ];

  const currentDeg = Math.round(heading) % 360;

  return (
    <div className="relative w-64 md:w-80 h-9 bg-slate-950/75 backdrop-blur-md border border-slate-700/60 rounded-md overflow-hidden flex items-center justify-center select-none shadow-lg">
      {/* Center reticle indicator */}
      <div className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-10 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
      <div className="absolute -top-1 w-2 h-2 border-l border-b border-cyan-400 rotate-45 z-10" />

      {/* Degrees readout */}
      <div className="absolute top-0.5 right-2 text-[10px] font-mono text-cyan-400/90 font-semibold tracking-wider">
        {currentDeg.toString().padStart(3, '0')}°
      </div>

      {/* Ticking tape */}
      <div
        className="flex items-center space-x-12 absolute transition-transform duration-75"
        style={{
          transform: `translateX(${-((heading % 360) * 2.2)}px)`,
        }}
      >
        {/* Render repeated marks to support 360 wrapping */}
        {[-360, 0, 360, 720].flatMap((offset) =>
          markers.map((m) => {
            const isCardinal = ['N', 'E', 'S', 'W'].includes(m.label);
            return (
              <div
                key={`${offset}-${m.deg}`}
                className="flex flex-col items-center justify-center min-w-8"
              >
                <span
                  className={`text-[11px] font-bold tracking-wider ${
                    isCardinal ? 'text-amber-400' : 'text-slate-300'
                  }`}
                >
                  {m.label}
                </span>
                <span className="text-[9px] text-slate-500 font-mono">
                  {m.deg}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
