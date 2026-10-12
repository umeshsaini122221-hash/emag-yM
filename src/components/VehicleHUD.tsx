import React, { useState } from 'react';
import { VehicleStats } from '../game/types';
import {
  LogOut,
  Zap,
  Volume2,
  Shield,
  Gauge,
  ArrowUp,
  ArrowDown,
  Navigation,
} from 'lucide-react';

interface VehicleHUDProps {
  stats: VehicleStats;
  onExit: () => void;
  onHonk: () => void;
  onBoostStart: () => void;
  onBoostStop: () => void;
  onThrottleStart: (direction: number) => void;
  onThrottleStop: () => void;
  onHandbrakeStart: () => void;
  onHandbrakeStop: () => void;
}

export const VehicleHUD: React.FC<VehicleHUDProps> = ({
  stats,
  onExit,
  onHonk,
  onBoostStart,
  onBoostStop,
  onThrottleStart,
  onThrottleStop,
  onHandbrakeStart,
  onHandbrakeStop,
}) => {
  const [gasActive, setGasActive] = useState(false);
  const [brakeActive, setBrakeActive] = useState(false);
  const [driftActive, setDriftActive] = useState(false);
  const [boostActive, setBoostActive] = useState(false);

  const speedRatio = Math.min(1.0, stats.speedKmh / 105);
  const healthPercent = Math.max(0, Math.min(100, (stats.health / stats.maxHealth) * 100));

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex flex-col justify-between p-3 md:p-6">
      {/* 1. TOP CENTER: VEHICLE TACTICAL TELEMETRY CLUSTER */}
      <div className="self-center flex flex-col items-center">
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/30 rounded-2xl px-5 py-2.5 shadow-[0_0_25px_rgba(6,182,212,0.25)] flex items-center gap-6">
          {/* Speedometer Circle & Digital Display */}
          <div className="flex items-baseline gap-1.5">
            <span
              className={`text-4xl md:text-5xl font-mono font-black tracking-tight ${
                stats.isBoosting
                  ? 'text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                  : stats.speedKmh > 70
                  ? 'text-amber-400'
                  : 'text-white'
              }`}
            >
              {stats.speedKmh}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono font-bold text-slate-400">KM/H</span>
              <span
                className={`text-xs font-mono font-black ${
                  stats.gear === 'B'
                    ? 'text-cyan-400'
                    : stats.gear === 'R'
                    ? 'text-rose-400'
                    : stats.gear === 'D'
                    ? 'text-emerald-400'
                    : 'text-slate-500'
                }`}
              >
                GEAR {stats.gear}
              </span>
            </div>
          </div>

          {/* Vehicle Health & Name */}
          <div className="flex flex-col gap-1 min-w-[140px]">
            <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
              <span className="text-cyan-400 truncate max-w-[110px]">{stats.name}</span>
              <span className="text-slate-400">{Math.round(stats.health)} HP</span>
            </div>

            {/* Health Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
              <div
                className={`h-full transition-all duration-150 ${
                  healthPercent > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-cyan-500'
                    : healthPercent > 25
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                    : 'bg-gradient-to-r from-rose-600 to-red-500 animate-pulse'
                }`}
                style={{ width: `${healthPercent}%` }}
              />
            </div>

            {/* Boost Meter */}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3 h-3 text-cyan-400" />
              <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden border border-cyan-500/20">
                <div
                  className={`h-full transition-all duration-100 ${
                    stats.isBoosting
                      ? 'bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,1)]'
                      : 'bg-cyan-500'
                  }`}
                  style={{ width: `${stats.boostAmount}%` }}
                />
              </div>
              <span className="text-[9px] font-mono font-bold text-cyan-400">
                {stats.boostAmount}%
              </span>
            </div>
          </div>
        </div>

        {/* Desktop driving help strip */}
        <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-slate-400 bg-slate-950/70 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-800 mt-1.5">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">W</kbd> /{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">S</kbd> Gas/Brake
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">A</kbd> /{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">D</kbd> Steer
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">SPACE</kbd> Drift
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">SHIFT</kbd> Turbo
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">H</kbd> Horn
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300">F</kbd> Exit
          </span>
        </div>
      </div>

      {/* 2. BOTTOM ACTION ROW FOR MOBILE DRIVING */}
      <div className="w-full flex items-end justify-between pointer-events-auto">
        {/* LEFT CLUSTER: Horn & Handbrake */}
        <div className="flex items-center gap-3">
          {/* Tactical Horn Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onHonk();
            }}
            onClick={onHonk}
            data-interactive="true"
            title="Honk Horn [H]"
            className="w-14 h-14 rounded-full bg-slate-900/90 hover:bg-slate-800 active:bg-cyan-600/60 border border-slate-700 active:scale-95 text-slate-200 flex flex-col items-center justify-center shadow-lg transition-transform cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
            <span className="text-[8px] font-mono font-bold uppercase mt-0.5">HORN</span>
          </button>

          {/* Handbrake / Drift Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              setDriftActive(true);
              onHandbrakeStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setDriftActive(false);
              onHandbrakeStop();
            }}
            onMouseDown={() => {
              setDriftActive(true);
              onHandbrakeStart();
            }}
            onMouseUp={() => {
              setDriftActive(false);
              onHandbrakeStop();
            }}
            data-interactive="true"
            title="Handbrake Drift [SPACE]"
            className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
              driftActive
                ? 'bg-amber-500 border-amber-200 text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                : 'bg-slate-900/90 border-slate-700 text-slate-300'
            }`}
          >
            <Navigation className="w-5 h-5 rotate-45" />
            <span className="text-[8px] font-mono font-bold uppercase mt-0.5">DRIFT</span>
          </button>
        </div>

        {/* CENTER BOTTOM: LARGE EXIT VEHICLE BUTTON */}
        <button
          onTouchStart={(e) => {
            e.stopPropagation();
            onExit();
          }}
          onClick={onExit}
          data-interactive="true"
          title="Exit Vehicle [F]"
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 active:scale-95 text-white font-mono font-bold text-sm tracking-wider uppercase border-2 border-rose-300 shadow-[0_0_25px_rgba(244,63,94,0.6)] flex items-center gap-2 cursor-pointer transition-all"
        >
          <LogOut className="w-5 h-5 stroke-[2.5]" />
          <span>EXIT VEHICLE</span>
          <span className="text-[10px] bg-black/40 px-1.5 py-0.5 rounded font-mono">[F]</span>
        </button>

        {/* RIGHT CLUSTER: Nitro Boost, Gas & Brake Pedals */}
        <div className="flex items-end gap-3">
          {/* Turbo Boost Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              setBoostActive(true);
              onBoostStart();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setBoostActive(false);
              onBoostStop();
            }}
            onMouseDown={() => {
              setBoostActive(true);
              onBoostStart();
            }}
            onMouseUp={() => {
              setBoostActive(false);
              onBoostStop();
            }}
            data-interactive="true"
            title="Turbo Boost [SHIFT]"
            className={`w-16 h-16 rounded-full border-2 flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
              boostActive
                ? 'bg-cyan-400 border-white text-slate-950 font-black shadow-[0_0_25px_rgba(6,182,212,1)] scale-105'
                : 'bg-cyan-600/85 hover:bg-cyan-500 border-cyan-300 text-white'
            }`}
          >
            <Zap className="w-6 h-6 stroke-[2.5]" />
            <span className="text-[9px] font-mono font-black uppercase mt-0.5">NITRO</span>
          </button>

          {/* Reverse / Brake Pedal */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              setBrakeActive(true);
              onThrottleStart(-1);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setBrakeActive(false);
              onThrottleStop();
            }}
            onMouseDown={() => {
              setBrakeActive(true);
              onThrottleStart(-1);
            }}
            onMouseUp={() => {
              setBrakeActive(false);
              onThrottleStop();
            }}
            data-interactive="true"
            title="Brake / Reverse [S]"
            className={`w-15 h-20 rounded-2xl border-2 flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 cursor-pointer ${
              brakeActive
                ? 'bg-rose-600 border-white text-white font-black shadow-[0_0_20px_rgba(244,63,94,0.8)]'
                : 'bg-slate-900/90 border-slate-700 text-rose-400'
            }`}
          >
            <ArrowDown className="w-6 h-6 stroke-[3]" />
            <span className="text-[9px] font-mono font-bold uppercase mt-1">BRAKE</span>
          </button>

          {/* Accelerate / Gas Pedal (Tall & Prominent) */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              setGasActive(true);
              onThrottleStart(1);
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setGasActive(false);
              onThrottleStop();
            }}
            onMouseDown={() => {
              setGasActive(true);
              onThrottleStart(1);
            }}
            onMouseUp={() => {
              setGasActive(false);
              onThrottleStop();
            }}
            data-interactive="true"
            title="Accelerate [W]"
            className={`w-18 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl transition-transform active:scale-95 cursor-pointer ${
              gasActive
                ? 'bg-emerald-500 border-white text-slate-950 font-black shadow-[0_0_25px_rgba(16,185,129,0.9)] scale-102'
                : 'bg-gradient-to-t from-emerald-600 to-emerald-500 border-emerald-300 text-white'
            }`}
          >
            <ArrowUp className="w-8 h-8 stroke-[3]" />
            <span className="text-[10px] font-mono font-black tracking-wider uppercase mt-1">
              GAS
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
