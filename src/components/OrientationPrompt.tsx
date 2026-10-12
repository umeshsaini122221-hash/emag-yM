import React from 'react';
import { Smartphone, Maximize2 } from 'lucide-react';

interface OrientationPromptProps {
  onDismiss: () => void;
  onRequestFullscreen: () => void;
}

export const OrientationPrompt: React.FC<OrientationPromptProps> = ({
  onDismiss,
  onRequestFullscreen,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/92 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 flex items-center justify-center mb-6 text-cyan-400 animate-pulse">
        <Smartphone className="w-8 h-8 rotate-90" />
      </div>

      <h2 className="text-xl font-bold text-white tracking-wide uppercase mb-2">
        Rotate Device to Landscape
      </h2>
      <p className="text-xs text-slate-400 max-w-xs mb-8 leading-relaxed">
        Aegis Horizon is optimized for Android landscape orientation. Rotate your phone and enable auto-rotate for full dual-thumb combat controls.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={onRequestFullscreen}
          className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
        >
          <Maximize2 className="w-4 h-4" />
          Enter Landscape Fullscreen
        </button>

        <button
          onClick={onDismiss}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-xs tracking-wider uppercase hover:bg-slate-800 active:scale-95 transition-all"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
};
