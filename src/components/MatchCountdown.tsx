import React, { useState, useEffect } from 'react';
import { Plane, Shield, Users, MapPin } from 'lucide-react';
import { MapId, GameMode } from '../game/types';

interface MatchCountdownProps {
  mapId: MapId;
  mode: GameMode;
  onCountdownComplete: () => void;
}

export const MatchCountdown: React.FC<MatchCountdownProps> = ({
  mapId,
  mode,
  onCountdownComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeout(onCountdownComplete, 400);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onCountdownComplete]);

  const mapTitle =
    mapId === 'india'
      ? 'India: Heritage Island'
      : mapId === 'rajasthan'
      ? 'Rajasthan: Desert Kingdom'
      : 'Frontier Island';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none text-white animate-in fade-in duration-200">
      <div className="w-full max-w-md flex flex-col items-center space-y-5">
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono tracking-widest uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)]">
          <Plane className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>MATCHMAKING VERIFIED // AIRDROP FORMATION</span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-black font-mono tracking-widest uppercase bg-gradient-to-r from-cyan-400 to-amber-300 bg-clip-text text-transparent">
            {mapTitle}
          </h2>
          <div className="text-xs font-mono text-slate-400 mt-1 flex items-center justify-center gap-3">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-cyan-400" /> 6 Combatants (1 Operator + 5 Hostiles)
            </span>
            <span>·</span>
            <span className="flex items-center gap-1 uppercase">
              <MapPin className="w-3.5 h-3.5 text-amber-400" /> {mode.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Large Countdown Digit */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/30 animate-ping [animation-duration:1s]" />
          <div className="w-28 h-28 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.6)]">
            <span className="text-6xl font-black font-mono text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]">
              {secondsLeft > 0 ? secondsLeft : 'GO!'}
            </span>
          </div>
        </div>

        <p className="text-xs font-mono text-slate-400 tracking-wider uppercase">
          DROPPING INTO COMBAT ZONE · BOT DAMAGE PROTECTION READY
        </p>
      </div>
    </div>
  );
};
