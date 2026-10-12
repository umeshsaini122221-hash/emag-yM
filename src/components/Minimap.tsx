import React from 'react';
import { LandmarkInfo, Vector3D, VehicleMapMarker } from '../game/types';

interface MinimapProps {
  playerPos: Vector3D;
  playerHeading: number; // degrees
  landmarks: LandmarkInfo[];
  islandRadius: number;
  vehicleMarkers?: VehicleMapMarker[];
  onTeleport?: (x: number, z: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  playerPos,
  playerHeading,
  landmarks,
  islandRadius,
  vehicleMarkers = [],
  onTeleport,
}) => {
  const mapSize = 130; // px
  const scale = (mapSize * 0.44) / islandRadius; // scale from world meters to pixels

  // Convert world coordinate (X, Z) to minimap canvas relative pixels
  const worldToMap = (x: number, z: number) => {
    return {
      x: mapSize / 2 + x * scale,
      y: mapSize / 2 + z * scale,
    };
  };

  const playerDot = worldToMap(playerPos.x, playerPos.z);

  return (
    <div className="relative group bg-slate-950/85 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 shadow-xl select-none">
      {/* Top title and coordinates */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
        <span className="font-semibold text-slate-200 uppercase tracking-wider">Tactical Radar</span>
        <span className="text-cyan-400">
          {Math.round(playerPos.x)}, {Math.round(playerPos.z)}
        </span>
      </div>

      {/* Radar display circle */}
      <div
        className="relative overflow-hidden rounded-full border border-cyan-500/30 bg-slate-900/90 shadow-inner"
        style={{ width: `${mapSize}px`, height: `${mapSize}px` }}
      >
        {/* Radar concentric range rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full rounded-full border border-cyan-500/15" />
          <div className="w-2/3 h-2/3 rounded-full border border-cyan-500/20 absolute" />
          <div className="w-1/3 h-1/3 rounded-full border border-cyan-500/25 absolute" />
          <div className="w-full h-px bg-cyan-500/15 absolute" />
          <div className="h-full w-px bg-cyan-500/15 absolute" />
        </div>

        {/* Island Landmass shape visualization */}
        <div
          className="absolute rounded-full bg-emerald-950/40 border border-emerald-500/30 pointer-events-none"
          style={{
            left: mapSize / 2 - islandRadius * scale,
            top: mapSize / 2 - islandRadius * scale,
            width: islandRadius * 2 * scale,
            height: islandRadius * 2 * scale,
          }}
        />

        {/* Landmark blips */}
        {landmarks.map((lm) => {
          const pt = worldToMap(lm.position.x, lm.position.z);
          return (
            <button
              key={lm.id}
              onClick={() => onTeleport?.(lm.position.x, lm.position.z)}
              title={`${lm.name} - Tap to warp`}
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform hover:scale-125 z-10"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div className="w-2 h-2 rounded-sm bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.9)] border border-amber-200" />
            </button>
          );
        })}

        {/* Vehicle markers across the island */}
        {vehicleMarkers.map((vm) => {
          const pt = worldToMap(vm.position.x, vm.position.z);
          return (
            <div
              key={vm.id}
              title={`${vm.name} ${vm.isOccupied ? '(Driven)' : '(Parked)'}`}
              className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-15 pointer-events-none"
              style={{ left: `${pt.x}px`, top: `${pt.y}px` }}
            >
              <div
                className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center ${
                  vm.isOccupied
                    ? 'bg-cyan-400 border-white shadow-[0_0_8px_rgba(6,182,212,1)] scale-110'
                    : 'bg-emerald-400 border-emerald-100 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                }`}
              >
                <div className="w-1 h-1 bg-slate-950 rounded-xs" />
              </div>
            </div>
          );
        })}

        {/* Player blip & vision cone */}
        <div
          className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none transition-all duration-75"
          style={{ left: `${playerDot.x}px`, top: `${playerDot.y}px` }}
        >
          {/* Heading pointer */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ transform: `rotate(${playerHeading}deg)` }}
          >
            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[9px] border-b-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] -mt-1" />
          </div>
          {/* Player core dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-300 ring-2 ring-cyan-500/80" />
        </div>
      </div>

      {/* Altitude indicator */}
      <div className="text-[9px] font-mono text-center text-slate-400 mt-1">
        ALT: <span className="text-slate-200">{playerPos.y.toFixed(1)}m</span> | RAD:{' '}
        <span className="text-slate-200">{islandRadius}m</span>
      </div>
    </div>
  );
};
