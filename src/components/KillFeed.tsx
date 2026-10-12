import React from 'react';
import { Skull, Crosshair, Zap, ShieldAlert, Award, Flame } from 'lucide-react';
import { KillFeedItem } from '../game/types';

interface KillFeedProps {
  feedItems: KillFeedItem[];
  playerKillBanner: {
    victimName: string;
    weapon: string;
    isHeadshot?: boolean;
    streak: number;
  } | null;
}

export const KillFeed: React.FC<KillFeedProps> = ({ feedItems, playerKillBanner }) => {
  return (
    <>
      {/* 1. TOP-RIGHT BATTLE ROYALE KILL FEED LIST */}
      <div className="absolute top-24 right-2 sm:right-4 z-20 flex flex-col items-end gap-1.5 pointer-events-none select-none max-w-[280px] sm:max-w-[340px]">
        {feedItems.slice(0, 5).map((item) => {
          const isPlayer = item.isPlayerKiller;
          const isVictimPlayer = item.isPlayerVictim;

          return (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono shadow-md backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-right-4 ${
                isPlayer
                  ? 'bg-amber-950/90 border border-amber-400/80 text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                  : isVictimPlayer
                  ? 'bg-rose-950/90 border border-rose-500/80 text-rose-200'
                  : 'bg-slate-950/80 border border-slate-700/60 text-slate-300'
              }`}
            >
              {/* Killer Name */}
              <span
                className={`font-bold truncate max-w-[90px] ${
                  isPlayer ? 'text-amber-300 font-black tracking-wide' : 'text-slate-200'
                }`}
              >
                {item.killerName}
              </span>

              {/* Elimination Action Icon / Weapon */}
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-white/10 text-[9px]">
                {item.isHeadshot ? (
                  <Crosshair className="w-3 h-3 text-amber-400 shrink-0" />
                ) : isPlayer ? (
                  <Skull className="w-3 h-3 text-amber-400 shrink-0" />
                ) : (
                  <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                )}
                <span className="font-semibold uppercase tracking-wider text-slate-300">
                  {item.weapon}
                </span>
                {item.isHeadshot && (
                  <span className="text-[8px] font-bold text-amber-400 bg-amber-950/80 px-1 rounded">
                    CRIT
                  </span>
                )}
              </div>

              {/* Victim Name */}
              <span
                className={`truncate max-w-[90px] ${
                  isVictimPlayer ? 'text-rose-400 font-bold' : 'text-slate-400'
                }`}
              >
                {item.victimName}
              </span>
            </div>
          );
        })}
      </div>

      {/* 2. CENTER-UPPER PLAYER KILL CONFIRMATION / BOOYAH BANNER */}
      {playerKillBanner && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none select-none flex flex-col items-center animate-in zoom-in-95 fade-in duration-200">
          <div className="relative flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/90 shadow-[0_0_35px_rgba(245,158,11,0.6)] backdrop-blur-md">
            {/* Pulsing Skull Trophy Icon */}
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/80 flex items-center justify-center text-amber-300 shadow-inner">
              <Skull className="w-6 h-6 animate-pulse" />
            </div>

            {/* Typography */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                <Award className="w-3.5 h-3.5" />
                <span>ELIMINATION CONFIRMED</span>
                {playerKillBanner.streak > 1 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                    STREAK x{playerKillBanner.streak}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-black font-mono tracking-wide text-white drop-shadow">
                  {playerKillBanner.victimName}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 font-bold">
                  {playerKillBanner.weapon}
                </span>
                {playerKillBanner.isHeadshot && (
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-rose-950/90 border border-rose-500 text-rose-300 font-bold">
                    HEADSHOT
                  </span>
                )}
              </div>

              <div className="text-[9px] font-mono text-amber-300/80 tracking-wider">
                +100 EXP · RANK PROGRESS VERIFIED
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
