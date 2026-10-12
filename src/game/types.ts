export type GraphicsPreset = 'low' | 'medium' | 'high';
export type PlayerStance = 'standing' | 'crouching' | 'jumping' | 'sprinting';
export type WeaponType = 'rifle' | 'shotgun';
export type MapId = 'frontier' | 'india' | 'rajasthan';
export type GameMode = 'solo_practice' | 'ranked_online' | 'clash_squad';
export type RankTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Legend';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface LandmarkInfo {
  id: string;
  name: string;
  type: 'radar' | 'bunker' | 'outpost' | 'crash' | 'citadel' | 'fort' | 'palace' | 'stepwell' | 'market';
  position: Vector3D;
  description: string;
}

export interface BotInfo {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  isAlive: boolean;
  position: Vector3D;
  distanceToPlayer: number;
}

export interface PickupInfo {
  id: string;
  type: 'health' | 'ammo';
  position: Vector3D;
  active: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  armor: number;
  maxArmor: number;
  speed: number;
  stance: PlayerStance;
  position: Vector3D;
  heading: number; // degrees 0-360
  groundHeight: number;
  isGrounded: boolean;
  equippedWeapon: WeaponType;
  ammo: number;
  maxAmmo: number;
  reserveAmmo: number;
  kills: number;
  aliveBots: number;
  totalBots: number;
  medkitsCount: number;
  isAiming: boolean;
  isReloading: boolean;
  botProtectionActive: boolean;
  selectedMap: MapId;
  rank: RankTier;
  rankPoints: number;
  credits: number;
  diamonds: number;
}

export interface GameSettings {
  graphicsPreset: GraphicsPreset;
  cameraSensitivity: number; // 0.5 to 2.5
  soundVolume: number;
  showFps: boolean;
  invertPitch: boolean;
}

export interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
}

export interface KillFeedItem {
  id: string;
  killerName: string;
  isPlayerKiller: boolean;
  victimName: string;
  isPlayerVictim: boolean;
  weapon: string;
  isHeadshot?: boolean;
  timestamp: number;
}

export interface IncomingDamageIndicator {
  id: string;
  angle: number; // in degrees: 0 = directly ahead, 90 = right, 180 = behind, 270 = left
  damage: number;
  timestamp: number;
}

export interface FloatingHitDamage {
  id: string;
  damage: number;
  isHeadshot: boolean;
  isElimination: boolean;
  offsetX: number;
  offsetY: number;
  timestamp: number;
}

export interface VehicleStats {
  id: string;
  name: string;
  speedKmh: number;
  health: number;
  maxHealth: number;
  boostAmount: number; // 0 - 100
  isBoosting: boolean;
  isBraking: boolean;
  gear: 'R' | 'N' | 'D' | 'B';
  rpm: number; // 0 - 1
  steerAngle: number;
  isOccupied: boolean;
}

export interface VehicleMapMarker {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  heading: number;
  isOccupied: boolean;
}

