import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingScreenProps {
  onLoadComplete: () => void;
}

const GAMEPLAY_TIPS = [
  'Bot attacks can reduce your health, but BOT PROTECTION clamps damage to a minimum of 1 HP!',
  'Look for green medical crates scattered across the island to restore +35 HP.',
  'Toggle ADS Aim for tighter bullet spread and precision over-the-shoulder zoom.',
  'Explore India (Heritage Island) to battle through the Marble Citadel and ancient fort ramparts.',
  'In Rajasthan (Desert Kingdom), take high ground on the Amber Palace to control the dunes.',
  'Eliminating bots completes daily missions and awards Aegis Credits to unlock new outfits in the Store.',
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadComplete }) => {
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Initializing WebGL 2 Shader Pipeline...');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Rotating tips
    const tipInterval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % GAMEPLAY_TIPS.length);
    }, 2800);
    return () => clearInterval(tipInterval);
  }, []);

  useEffect(() => {
    // Realistic progressive loading sequence
    const checkpoints = [
      { pct: 28, text: 'Compiling PBR Shaders & Atmosphere...' },
      { pct: 52, text: 'Building 3D Island Biomes & Collision Meshes...' },
      { pct: 75, text: 'Loading Tactical Operator Rig & Weapon Systems...' },
      { pct: 92, text: 'Calibrating Hostile AI Bot Matrices...' },
      { pct: 100, text: 'Match Ready — Initializing Tactical Lobby...' },
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < checkpoints.length) {
        const step = checkpoints[currentStep];
        setProgress(step.pct);
        setStatusText(step.text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          onLoadComplete();
        }, 600);
      }
    }, 550);

    return () => clearInterval(interval);
  }, [onLoadComplete]);

  const handleRetry = () => {
    setHasError(false);
    setProgress(15);
    setStatusText('Reconnecting to Tactical Grid...');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-between p-6 select-none overflow-hidden text-slate-100">
      {/* Subtle Animated Background Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#082f4915_1px,transparent_1px),linear-gradient(to_bottom,#082f4915_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* TOP: Game Identity */}
      <div className="relative z-10 pt-6 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 text-xs font-mono tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
          <Shield className="w-3.5 h-3.5" />
          <span>Vanguard Protocol // Tactical Mobile BR</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-[0.25em] uppercase font-mono bg-gradient-to-r from-white via-cyan-200 to-amber-300 bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
          AEGIS HORIZON
        </h1>
        <p className="text-xs sm:text-sm font-mono text-slate-400 tracking-widest uppercase mt-1">
          Next-Gen 3D Battle Royale Mobile
        </p>
      </div>

      {/* CENTER: Radar Sweep & Map Teaser */}
      <div className="relative z-10 flex flex-col items-center my-auto">
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-cyan-500/40 bg-cyan-950/20 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.25)]">
          {/* Concentric rings */}
          <div className="w-3/4 h-3/4 rounded-full border border-cyan-500/30 absolute" />
          <div className="w-1/2 h-1/2 rounded-full border border-cyan-500/40 absolute" />
          <div className="w-1/4 h-1/4 rounded-full border border-cyan-500/50 absolute" />

          {/* Sweeping radar arm */}
          <div className="absolute inset-0 rounded-full overflow-hidden animate-spin [animation-duration:3s]">
            <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 to-transparent origin-bottom-right" />
          </div>

          <Shield className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.8)] relative z-10" />
        </div>

        {/* Dynamic Tip Box */}
        <div className="mt-6 max-w-md px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-center shadow-lg">
          <div className="text-[10px] font-mono uppercase font-bold text-amber-400 flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>OPERATOR BRIEFING</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans min-h-[2.5rem]">
            {GAMEPLAY_TIPS[currentTipIndex]}
          </p>
        </div>
      </div>

      {/* BOTTOM: Progress Bar & Status */}
      <div className="relative z-10 w-full max-w-md space-y-2 pb-4">
        {hasError ? (
          <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-600/60 text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-rose-400 font-mono font-bold text-xs uppercase">
              <AlertTriangle className="w-4 h-4" />
              <span>Asset Synchronization Delayed</span>
            </div>
            <p className="text-xs text-slate-300">
              Connection to local WebGL resource pipeline paused. Tap below to reinitialize.
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-2 mx-auto active:scale-95 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RETRY INITIALIZATION</span>
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-xs font-mono px-1">
              <span className="text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                {statusText}
              </span>
              <span className="text-cyan-300 font-bold">{progress}%</span>
            </div>

            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.8)] transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="text-[10px] font-mono text-center text-slate-500 tracking-wider">
              OPTIMIZED FOR ANDROID LANDSCAPE WEBGL 2 · STANDALONE CLIENT
            </div>
          </>
        )}
      </div>
    </div>
  );
};
