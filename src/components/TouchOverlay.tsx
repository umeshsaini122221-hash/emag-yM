import React, { useState } from 'react';
import { TouchJoystickState } from '../game/controls/TouchInputManager';
import { PlayerStance, WeaponType } from '../game/types';
import {
  ArrowUp,
  ShieldAlert,
  Zap,
  RefreshCw,
  Crosshair,
  Flame,
  PlusCircle,
  Eye,
  RotateCcw,
  Car,
} from 'lucide-react';

interface TouchOverlayProps {
  joystickState: TouchJoystickState;
  stance: PlayerStance;
  isSprinting: boolean;
  equippedWeapon: WeaponType;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  medkitsCount: number;
  isAiming: boolean;
  isReloading: boolean;
  hitMarkerActive: boolean;
  nearbyVehicle?: { id: string; name: string; distance: number } | null;
  isDriving?: boolean;
  onEnterVehicle?: () => void;
  onJump: () => void;
  onToggleCrouch: () => void;
  onToggleSprint: () => void;
  onStartFire: () => void;
  onStopFire: () => void;
  onToggleAim: () => void;
  onReload: () => void;
  onSwitchWeapon: () => void;
  onHeal: () => void;
  onRespawn: () => void;
}

export const TouchOverlay: React.FC<TouchOverlayProps> = ({
  joystickState,
  stance,
  isSprinting,
  equippedWeapon,
  ammo,
  maxAmmo,
  reserveAmmo,
  medkitsCount,
  isAiming,
  isReloading,
  hitMarkerActive,
  nearbyVehicle,
  isDriving = false,
  onEnterVehicle,
  onJump,
  onToggleCrouch,
  onToggleSprint,
  onStartFire,
  onStopFire,
  onToggleAim,
  onReload,
  onSwitchWeapon,
  onHeal,
  onRespawn,
}) => {
  const [isFiringButtonDown, setIsFiringButtonDown] = useState(false);

  // Dynamic crosshair spread: tighter when aiming or crouching, wider when sprinting/moving
  const spreadSize = isAiming
    ? 12
    : stance === 'crouching'
    ? 16
    : isSprinting
    ? 34
    : joystickState.active
    ? 26
    : 20;

  // When driving, on-foot weapons and reticle are hidden (VehicleHUD handles vehicle cockpit)
  if (isDriving) {
    return (
      <div className="absolute inset-0 pointer-events-none select-none z-20">
        {/* Dynamic Mobile Steering Touch Joystick */}
        {joystickState.active && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              left: `${joystickState.baseX}px`,
              top: `${joystickState.baseY}px`,
            }}
          >
            <div className="relative w-28 h-28 rounded-full border-2 border-cyan-400/40 bg-cyan-950/20 backdrop-blur-xs flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
              <div className="absolute w-12 h-12 rounded-full bg-cyan-400/80 border-2 border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none"
                style={{
                  transform: `translate(${joystickState.currentX - joystickState.baseX}px, ${
                    joystickState.currentY - joystickState.baseY
                  }px)`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-20">
      {/* VEHICLE PROXIMITY INTERACTION PROMPT */}
      {nearbyVehicle && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 pointer-events-auto z-30">
          <button
            onClick={onEnterVehicle}
            onTouchStart={(e) => {
              e.stopPropagation();
              onEnterVehicle?.();
            }}
            data-interactive="true"
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 text-slate-950 font-mono font-black text-xs md:text-sm tracking-wider uppercase border-2 border-white shadow-[0_0_25px_rgba(245,158,11,0.95)] flex items-center gap-2.5 active:scale-95 cursor-pointer transition-all hover:scale-105"
          >
            <Car className="w-5 h-5 stroke-[2.5]" />
            <span>ENTER {nearbyVehicle.name}</span>
            <span className="bg-slate-950/80 text-cyan-300 px-2 py-0.5 rounded text-[10px] font-mono">
              [F / TAP]
            </span>
          </button>
        </div>
      )}

      {/* 1. CENTER SCREEN CROSSHAIR */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        {/* Center Target Dot */}
        <div
          className={`w-1.5 h-1.5 rounded-full ${
            hitMarkerActive ? 'bg-rose-500 scale-150' : isAiming ? 'bg-cyan-300' : 'bg-white/80'
          } shadow-sm transition-transform`}
        />

        {/* Reticle Lines */}
        <div
          className="absolute w-0.5 bg-white/70 rounded-full transition-all duration-100"
          style={{ height: '8px', top: `-${spreadSize + 8}px` }}
        />
        <div
          className="absolute w-0.5 bg-white/70 rounded-full transition-all duration-100"
          style={{ height: '8px', bottom: `-${spreadSize + 8}px` }}
        />
        <div
          className="absolute h-0.5 bg-white/70 rounded-full transition-all duration-100"
          style={{ width: '8px', left: `-${spreadSize + 8}px` }}
        />
        <div
          className="absolute h-0.5 bg-white/70 rounded-full transition-all duration-100"
          style={{ width: '8px', right: `-${spreadSize + 8}px` }}
        />

        {/* HIT MARKER (X) WHEN HITTING ENEMY BOTS */}
        {hitMarkerActive && (
          <div className="absolute w-6 h-6 pointer-events-none animate-ping">
            <div className="absolute inset-0 border-t-2 border-r-2 border-rose-500 rotate-45" />
            <div className="absolute inset-0 border-b-2 border-l-2 border-rose-500 rotate-45" />
          </div>
        )}
      </div>

      {/* 2. DYNAMIC VIRTUAL JOYSTICK (LEFT THUMB) */}
      {joystickState.active && (
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-150"
          style={{
            left: `${joystickState.baseX}px`,
            top: `${joystickState.baseY}px`,
          }}
        >
          <div className="relative w-28 h-28 rounded-full border-2 border-cyan-400/40 bg-cyan-950/20 backdrop-blur-xs flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <div className="absolute top-1 w-1 h-2 bg-cyan-400/60" />
            <div className="absolute bottom-1 w-1 h-2 bg-cyan-400/60" />
            <div className="absolute left-1 w-2 h-1 bg-cyan-400/60" />
            <div className="absolute right-1 w-2 h-1 bg-cyan-400/60" />

            {/* Centered thumb knob that moves with touch delta */}
            <div
              className="absolute w-12 h-12 rounded-full bg-cyan-400/80 border-2 border-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.8)] pointer-events-none"
              style={{
                transform: `translate(${joystickState.currentX - joystickState.baseX}px, ${
                  joystickState.currentY - joystickState.baseY
                }px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Static Left Guide Hint when joystick is idle */}
      {!joystickState.active && (
        <div className="absolute bottom-8 left-8 flex flex-col items-center pointer-events-none opacity-30">
          <div className="w-20 h-20 rounded-full border border-dashed border-slate-500/60 flex items-center justify-center">
            <span className="text-[10px] font-mono text-slate-400 text-center uppercase tracking-wider">
              Move
              <br />
              Joystick
            </span>
          </div>
        </div>
      )}

      {/* 3. SHOOTER COMBAT CONTROLS (RIGHT THUMB ZONE) */}
      <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2.5 pointer-events-auto">
        {/* TOP ROW: Switch Weapon, Reload, Heal */}
        <div className="flex items-center gap-2">
          {/* Heal Item Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onHeal();
            }}
            onClick={onHeal}
            data-interactive="true"
            className={`px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              medkitsCount > 0
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300'
                : 'bg-slate-900/60 border-slate-700/50 text-slate-500 opacity-60'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono font-bold uppercase">
              Heal ({medkitsCount})
            </span>
          </button>

          {/* Switch Weapon Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onSwitchWeapon();
            }}
            onClick={onSwitchWeapon}
            data-interactive="true"
            className="px-3 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-cyan-500/60 text-cyan-300 flex items-center gap-1.5 shadow-lg active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="text-[10px] font-mono font-bold uppercase">
              {equippedWeapon === 'rifle' ? 'AR-M4' : 'Shotgun'}
            </span>
          </button>

          {/* Reload Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onReload();
            }}
            onClick={onReload}
            data-interactive="true"
            className={`px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              isReloading
                ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse'
                : 'bg-slate-900/80 border-slate-700 text-slate-300'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? 'animate-spin' : ''}`} />
            <span className="text-[10px] font-mono font-bold">
              {isReloading ? 'Reloading...' : `${ammo}/${reserveAmmo}`}
            </span>
          </button>
        </div>

        {/* MIDDLE ROW: ADS Aim, Sprint, Respawn */}
        <div className="flex items-center gap-2.5">
          {/* Aim (ADS) Toggle Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleAim();
            }}
            onClick={onToggleAim}
            data-interactive="true"
            title="Aim Down Sights (ADS)"
            className={`w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
              isAiming
                ? 'bg-cyan-500 border-cyan-200 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.8)]'
                : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            <span className="text-[8px] font-mono font-bold uppercase mt-0.5">AIM</span>
          </button>

          {/* Sprint Toggle */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleSprint();
            }}
            onClick={onToggleSprint}
            data-interactive="true"
            title="Sprint Toggle"
            className={`w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
              isSprinting
                ? 'bg-amber-500 border-amber-200 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.6)]'
                : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="text-[8px] font-mono font-bold uppercase mt-0.5">RUN</span>
          </button>

          {/* Crouch Button */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onToggleCrouch();
            }}
            onClick={onToggleCrouch}
            data-interactive="true"
            title="Toggle Crouch"
            className={`w-12 h-12 rounded-full backdrop-blur-md border flex flex-col items-center justify-center shadow-lg transition-all active:scale-95 ${
              stance === 'crouching'
                ? 'bg-cyan-500 border-cyan-200 text-slate-950 font-bold shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                : 'bg-slate-900/85 border-slate-700/80 text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span className="text-[8px] font-mono font-bold uppercase mt-0.5">
              {stance === 'crouching' ? 'LOW' : 'CROUCH'}
            </span>
          </button>
        </div>

        {/* PRIMARY ACTION ROW: JUMP & FIRE */}
        <div className="flex items-center gap-3 mt-0.5">
          {/* REAL JUMP BUTTON (Guaranteed Touch Response) */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              onJump();
            }}
            onClick={onJump}
            data-interactive="true"
            title="Jump"
            className="w-15 h-15 rounded-full bg-cyan-600/95 hover:bg-cyan-500 active:bg-cyan-400 backdrop-blur-md border-2 border-cyan-300 text-white flex flex-col items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] transition-transform active:scale-90 cursor-pointer"
          >
            <ArrowUp className="w-6 h-6 stroke-[3]" />
            <span className="text-[9px] font-mono font-bold tracking-wider uppercase mt-0.5">
              JUMP
            </span>
          </button>

          {/* PRIMARY FIRE BUTTON (Large Red/Amber Tactical Trigger) */}
          <button
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsFiringButtonDown(true);
              onStartFire();
            }}
            onTouchEnd={(e) => {
              e.stopPropagation();
              setIsFiringButtonDown(false);
              onStopFire();
            }}
            onMouseDown={() => {
              setIsFiringButtonDown(true);
              onStartFire();
            }}
            onMouseUp={() => {
              setIsFiringButtonDown(false);
              onStopFire();
            }}
            data-interactive="true"
            title="Fire Weapon"
            className={`w-20 h-20 rounded-full backdrop-blur-md border-2 text-white flex flex-col items-center justify-center shadow-2xl transition-all cursor-pointer ${
              isFiringButtonDown
                ? 'bg-rose-500 border-white scale-95 shadow-[0_0_30px_rgba(244,63,94,0.9)]'
                : 'bg-gradient-to-br from-rose-600 to-amber-600 border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.6)]'
            }`}
          >
            <Crosshair className="w-8 h-8 stroke-[2.5]" />
            <span className="text-[10px] font-mono font-black tracking-widest uppercase mt-0.5 drop-shadow">
              FIRE
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
