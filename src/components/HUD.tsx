import React, { useState, useEffect, useRef } from 'react';
import { CompassBar } from './CompassBar';
import { Minimap } from './Minimap';
import { GraphicsPreset, LandmarkInfo, PerformanceStats, PlayerStats, VehicleMapMarker } from '../game/types';
import {
  Maximize2,
  Volume2,
  VolumeX,
  Code2,
  Sliders,
  Shield,
  Heart,
  Gauge,
  Activity,
  MapPin,
  Skull,
  RefreshCw,
  AlertOctagon,
  Flame,
  Home,
} from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  perf: PerformanceStats;
  landmarks: LandmarkInfo[];
  islandRadius: number;
  graphicsPreset: GraphicsPreset;
  isMuted: boolean;
  sensitivity: number;
  vehicleMarkers?: VehicleMapMarker[];
  onSetPreset: (preset: GraphicsPreset) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onOpenDevGuide: () => void;
  onSensitivityChange: (val: number) => void;
  onTeleport: (x: number, z: number) => void;
  onTakeDamage?: (amount: number) => void;
  onRestartMatch?: () => void;
  onReturnToLobby?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  stats,
  perf,
  landmarks,
  islandRadius,
  graphicsPreset,
  isMuted,
  sensitivity,
  vehicleMarkers = [],
  onSetPreset,
  onToggleMute,
  onToggleFullscreen,
  onOpenDevGuide,
  onSensitivityChange,
  onTeleport,
  onTakeDamage,
  onRestartMatch,
  onReturnToLobby,
}) => {
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [respawnCountdown, setRespawnCountdown] = useState<number>(5);

  const onRestartMatchRef = useRef(onRestartMatch);
  onRestartMatchRef.current = onRestartMatch;

  const isEliminated = stats.health <= 0;

  // Countdown timer when player health drops to zero
  useEffect(() => {
    if (!isEliminated) {
      setRespawnCountdown(5);
      return;
    }

    setRespawnCountdown(5);
    const interval = setInterval(() => {
      setRespawnCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-restart / respawn match
          if (onRestartMatchRef.current) {
            onRestartMatchRef.current();
          } else {
            onTeleport(0, 15);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isEliminated, onTeleport]);

  const handleRestartClick = () => {
    if (onRestartMatch) {
      onRestartMatch();
    } else {
      onTeleport(0, 15);
    }
  };

  return (
    <>
      <div className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-2.5 sm:p-4 z-10">
        {/* TOP BAR */}
        <div className="flex items-start justify-between gap-2">
          {/* Top Left: Game Info & Quick Controls */}
          <div className="flex flex-col gap-1 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2.5 py-1 rounded-lg shadow-lg">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-300">
                Aegis Horizon
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-[10px] text-slate-400 font-mono">Battle Royale</span>
            </div>

            {/* Battle Royale Live Status Counters */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-800/80 text-rose-300 text-[10px] font-mono flex items-center gap-1 shadow-md">
                <Skull className="w-3 h-3 text-rose-400" />
                <span className="font-bold">KILLS: {stats.kills}</span>
              </div>
              <div className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[10px] font-mono flex items-center gap-1 shadow-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-bold">BOTS: {stats.aliveBots}/{stats.totalBots}</span>
              </div>
            </div>

            {/* Utility Buttons Row */}
            <div className="flex items-center gap-1.5 mt-0.5">
              {onReturnToLobby && (
                <button
                  onClick={onReturnToLobby}
                  title="Return to Main Lobby"
                  className="px-2 py-1 rounded-md bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 text-amber-300 text-[10px] font-mono flex items-center gap-1 shadow-md transition-colors"
                >
                  <Home className="w-3 h-3 text-amber-400" />
                  <span>Lobby</span>
                </button>
              )}

              <button
                onClick={onOpenDevGuide}
                title="Open Architecture & PlayCanvas Blueprint"
                className="px-2 py-1 rounded-md bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 text-[10px] font-mono flex items-center gap-1 shadow-md transition-colors"
              >
                <Code2 className="w-3 h-3" />
                <span>Blueprint</span>
              </button>

              <button
                onClick={onToggleFullscreen}
                title="Toggle Fullscreen for Android Chrome"
                className="p-1 rounded-md bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-md transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={onToggleMute}
                title="Toggle Procedural Audio"
                className="p-1 rounded-md bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-md transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
              </button>

              <button
                onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
                title="Settings & Presets"
                className="p-1 rounded-md bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 text-slate-300 shadow-md transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Settings & Combat Simulation Drawer */}
            {showSettingsDrawer && (
              <div className="mt-1.5 p-3 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-700/80 text-xs w-64 shadow-xl space-y-2.5 pointer-events-auto">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Graphics Preset</span>
                  <div className="flex items-center gap-1">
                    {(['low', 'medium', 'high'] as GraphicsPreset[]).map((p) => (
                      <button
                        key={p}
                        onClick={() => onSetPreset(p)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold transition-colors ${
                          graphicsPreset === p
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Look Sensitivity</span>
                    <span className="font-mono text-cyan-400">{sensitivity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={sensitivity}
                    onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Health & Damage Testing Section */}
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Combat Damage QA
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onTakeDamage?.(35)}
                      className="flex-1 py-1 px-2 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-[10px] font-mono flex items-center justify-center gap-1 transition-colors"
                    >
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>-35 HP</span>
                    </button>
                    <button
                      onClick={() => onTakeDamage?.(100)}
                      className="flex-1 py-1 px-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono text-[10px] font-bold flex items-center justify-center gap-1 shadow-sm transition-colors"
                    >
                      <Skull className="w-3 h-3" />
                      <span>Eliminate</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center: Tactical Compass Bar */}
          <div className="flex flex-col items-center">
            <CompassBar heading={stats.heading} />
            <div className="text-[9px] font-mono text-slate-400 tracking-wider uppercase mt-1 drop-shadow">
              Sector: Island Perimeter // Clear
            </div>
          </div>

          {/* Top Right: Performance Telemetry & Minimap */}
          <div className="flex flex-col items-end gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-700/80 px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-300 shadow-md">
              <span className="flex items-center gap-1 text-emerald-400">
                <Activity className="w-3 h-3" />
                {perf.fps} FPS
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">{perf.frameTime}ms</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400 uppercase font-semibold">{graphicsPreset}</span>
            </div>

            <Minimap
              playerPos={stats.position}
              playerHeading={stats.heading}
              landmarks={landmarks}
              islandRadius={islandRadius}
              vehicleMarkers={vehicleMarkers}
              onTeleport={onTeleport}
            />
          </div>
        </div>

        {/* QUICK WARP DOCK */}
        <div className="self-center flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3 py-1 rounded-full pointer-events-auto shadow-lg overflow-x-auto max-w-[90vw]">
          <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1 pr-1">
            <MapPin className="w-3 h-3 text-cyan-400" /> QA Warp:
          </span>
          {landmarks.map((lm) => (
            <button
              key={lm.id}
              onClick={() => onTeleport(lm.position.x, lm.position.z)}
              className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-slate-300 hover:text-cyan-300 border border-slate-800 transition-colors whitespace-nowrap"
            >
              {lm.name.split(' ')[0]}
            </button>
          ))}
          <button
            onClick={() => onTeleport(0, 15)}
            className="px-2 py-0.5 rounded-full bg-slate-900 hover:bg-slate-800 text-[10px] font-mono text-amber-300 border border-slate-800 transition-colors whitespace-nowrap"
          >
            Center Spawn
          </button>
        </div>

        {/* BOTTOM LEFT: OPERATOR COMBAT VITALS */}
        <div className="flex flex-col gap-1.5 pointer-events-auto max-w-xs">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-cyan-300 font-bold uppercase tracking-wider">
              {stats.stance}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-slate-300 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-amber-400" />
              {stats.speed.toFixed(1)} m/s
            </span>
            {stats.isGrounded ? (
              <span className="text-emerald-400">GROUNDED</span>
            ) : (
              <span className="text-amber-400">AIRBORNE</span>
            )}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-xl space-y-1.5">
            {/* Health Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-emerald-400" /> HEALTH
                </span>
                <span className={`font-semibold ${stats.health <= 25 ? 'text-rose-400 animate-pulse' : 'text-slate-300'}`}>
                  {stats.health} / {stats.maxHealth}
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-150 ${
                    stats.health <= 25
                      ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                  }`}
                  style={{ width: `${Math.max(0, (stats.health / stats.maxHealth) * 100)}%` }}
                />
              </div>
            </div>

            {/* Tactical Shield Bar */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono mb-0.5">
                <span className="text-cyan-400 font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3 fill-cyan-400" /> TACTICAL SHIELD
                </span>
                <span className="text-slate-300">
                  {stats.armor} / {stats.maxArmor}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] transition-all duration-150"
                  style={{ width: `${Math.max(0, (stats.armor / stats.maxArmor) * 100)}%` }}
                />
              </div>
            </div>

            {/* Weapon & Medkits Status */}
            <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-1 text-cyan-300 font-bold">
                <span className="px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-800 uppercase text-[9px]">
                  {stats.equippedWeapon === 'rifle' ? 'AR-M4' : 'Shotgun'}
                </span>
                <span>
                  {stats.ammo} / {stats.reserveAmmo}
                </span>
              </div>
              <div className="flex items-center gap-1 text-emerald-400 font-medium">
                <span>MEDKITS:</span>
                <span className="font-bold text-emerald-300">{stats.medkitsCount}</span>
              </div>
            </div>

            {/* BOT DAMAGE PROTECTION & LOW HEALTH WARNING */}
            {(stats.botProtectionActive || stats.health <= 1) && (
              <div className="pt-1.5 border-t border-rose-900/60 flex items-start gap-1.5 text-[10px] font-mono text-rose-300 bg-rose-950/60 p-1.5 rounded-lg border border-rose-500/80 animate-pulse">
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-tight">
                  <strong className="text-white block font-black">BOT PROTECTION ACTIVE (1 HP)</strong>
                  Bot attacks clamped health to 1 HP. Tap <strong>HEAL</strong> to restore health!
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ELIMINATED FULLSCREEN OVERLAY */}
      {isEliminated && (
        <div className="fixed inset-0 z-50 bg-slate-950/88 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center select-none pointer-events-auto animate-in fade-in duration-200">
          {/* Crimson Warning Glow Vignette */}
          <div className="absolute inset-0 bg-radial from-rose-950/30 via-transparent to-rose-950/60 pointer-events-none" />

          {/* Central Modal Content */}
          <div className="relative z-10 w-full max-w-md flex flex-col items-center space-y-4">
            {/* Elimination Icon */}
            <div className="w-20 h-20 rounded-2xl bg-rose-950/70 border-2 border-rose-500/80 flex items-center justify-center text-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.5)] animate-pulse">
              <Skull className="w-10 h-10" />
            </div>

            {/* Typography Header */}
            <div>
              <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-rose-400 uppercase tracking-widest mb-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Critical Vitals Depleted</span>
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-rose-500 tracking-[0.25em] uppercase font-mono drop-shadow-[0_0_20px_rgba(244,63,94,0.7)]">
                ELIMINATED
              </h1>
              <p className="text-xs font-mono text-slate-400 tracking-wider mt-1 uppercase">
                Combat Signal Terminated // Match Over
              </p>
            </div>

            {/* Match Telemetry Recap */}
            <div className="w-full bg-slate-900/90 border border-rose-900/50 rounded-xl p-3 shadow-lg grid grid-cols-3 gap-2 text-center font-mono">
              <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[9px] text-slate-500 uppercase">Bots Eliminated</div>
                <div className="text-xs font-bold text-rose-400">
                  {stats.kills} KILLS
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[9px] text-slate-500 uppercase">Hostiles Left</div>
                <div className="text-xs font-bold text-amber-300">
                  {stats.aliveBots} / {stats.totalBots}
                </div>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="text-[9px] text-slate-500 uppercase">Sector</div>
                <div className="text-xs font-bold text-cyan-300">
                  {Math.round(stats.position.x)}, {Math.round(stats.position.z)}
                </div>
              </div>
            </div>

            {/* Countdown Display & Progress Bar */}
            <div className="w-full space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono px-1">
                <span className="text-slate-400 uppercase tracking-wider">
                  Auto Redeploy in:
                </span>
                <span className="text-amber-400 font-bold text-base">
                  {respawnCountdown}s
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)] transition-all duration-1000 ease-linear"
                  style={{ width: `${(respawnCountdown / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Action Buttons: Respawn & Return to Lobby */}
            <div className="flex gap-2.5 w-full">
              <button
                onClick={handleRestartClick}
                className="flex-1 py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-400 text-white font-mono font-bold tracking-wider text-xs uppercase shadow-[0_0_25px_rgba(244,63,94,0.6)] flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
                <span>RESPAWN</span>
              </button>
              {onReturnToLobby && (
                <button
                  onClick={onReturnToLobby}
                  className="flex-1 py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-amber-300 border border-amber-500/60 font-mono font-bold tracking-wider text-xs uppercase shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                >
                  <Home className="w-4 h-4 text-amber-400" />
                  <span>MAIN LOBBY</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
