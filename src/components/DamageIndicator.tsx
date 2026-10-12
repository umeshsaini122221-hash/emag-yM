import React from 'react';
import { IncomingDamageIndicator, FloatingHitDamage } from '../game/types';

interface DamageIndicatorProps {
  incomingHits: IncomingDamageIndicator[];
  hitDamages: FloatingHitDamage[];
  isLowHealth?: boolean;
}

export const DamageIndicator: React.FC<DamageIndicatorProps> = ({
  incomingHits,
  hitDamages,
  isLowHealth = false,
}) => {
  const hasRecentHit = incomingHits.length > 0;

  return (
    <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-25">
      {/* 1. VIEWPORT SCREEN-EDGE RED VIGNETTE PULSE ON INCOMING DAMAGE */}
      {hasRecentHit && (
        <div
          className="absolute inset-0 bg-radial from-transparent via-rose-950/20 to-rose-600/35 transition-opacity duration-300 animate-pulse pointer-events-none"
          style={{ mixBlendMode: 'screen' }}
        />
      )}

      {/* Critical low health constant subtle vignette */}
      {isLowHealth && !hasRecentHit && (
        <div
          className="absolute inset-0 bg-radial from-transparent via-rose-950/15 to-rose-700/25 animate-pulse pointer-events-none"
          style={{ animationDuration: '1.2s' }}
        />
      )}

      {/* 2. DIRECTIONAL THREAT ARCS (RADIAL INCOMING DAMAGE INDICATOR AROUND CROSSHAIR) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 flex items-center justify-center">
        {incomingHits.map((hit) => {
          // Age calculation for smooth fadeout
          const age = Date.now() - hit.timestamp;
          const opacity = Math.max(0, 1 - age / 1200);

          return (
            <div
              key={hit.id}
              className="absolute pointer-events-none flex items-center justify-center transition-opacity"
              style={{
                transform: `rotate(${hit.angle}deg)`,
                opacity,
              }}
            >
              {/* Threat Chevron Indicator pointing outward along the angle */}
              <div
                className="flex flex-col items-center"
                style={{
                  transform: 'translateY(-130px)', // Distance from center crosshair
                }}
              >
                {/* Curved Warning Arc */}
                <svg
                  width="80"
                  height="28"
                  viewBox="0 0 80 28"
                  fill="none"
                  className="filter drop-shadow-[0_0_8px_rgba(239,68,68,0.9)]"
                >
                  <path
                    d="M6 24 C 28 6, 52 6, 74 24"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {/* Inner brighter core */}
                  <path
                    d="M16 20 C 30 10, 50 10, 64 20"
                    stroke="#fca5a5"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  {/* Directional tip arrow */}
                  <polygon points="40,2 35,9 45,9" fill="#ef4444" />
                </svg>

                {/* Optional damage numeric chip */}
                {hit.damage > 0 && (
                  <span className="text-[10px] font-black font-mono text-rose-300 drop-shadow-[0_0_4px_rgba(0,0,0,0.9)] mt-0.5">
                    -{hit.damage}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. FLOATING HIT DAMAGE NUMBERS (OUTGOING DAMAGE WHEN PLAYER HITS BOTS) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 pointer-events-none">
        {hitDamages.map((dmg) => {
          const age = Date.now() - dmg.timestamp;
          const progress = Math.min(1, age / 800); // 800ms lifespan
          const floatY = -20 - progress * 55; // Float up by 55px
          const opacity = Math.max(0, 1 - progress);
          const scale = 1.0 + (1 - progress) * 0.25;

          return (
            <div
              key={dmg.id}
              className="absolute flex items-center gap-1 font-mono font-black select-none pointer-events-none whitespace-nowrap transition-transform"
              style={{
                transform: `translate(${dmg.offsetX}px, ${dmg.offsetY + floatY}px) scale(${scale})`,
                opacity,
              }}
            >
              {dmg.isElimination ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600/90 text-white text-xs border border-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.9)]">
                  <span>💀</span>
                  <span>ELIMINATED</span>
                </div>
              ) : dmg.isHeadshot ? (
                <div className="flex items-center gap-1 text-sm sm:text-base text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.9)]">
                  <span className="text-xs bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500 text-amber-300">
                    CRIT
                  </span>
                  <span>-{dmg.damage}</span>
                </div>
              ) : (
                <div className="text-xs sm:text-sm text-white drop-shadow-[0_0_6px_rgba(244,63,94,0.8)] flex items-center gap-0.5">
                  <span className="text-rose-400 font-bold">-{dmg.damage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
