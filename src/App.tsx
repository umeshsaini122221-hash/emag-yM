/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { SceneManager } from './game/engine/SceneManager';
import { IslandWorld } from './game/engine/IslandWorld';
import { CharacterController } from './game/engine/CharacterController';
import { ThirdPersonCamera } from './game/engine/ThirdPersonCamera';
import { AudioManager } from './game/engine/AudioManager';
import { WeaponSystem } from './game/engine/WeaponSystem';
import { BotManager } from './game/engine/BotManager';
import { PickupManager } from './game/engine/PickupManager';
import { VehicleManager } from './game/engine/VehicleManager';
import { TouchInputManager } from './game/controls/TouchInputManager';
import { KeyboardMouseInput } from './game/controls/KeyboardMouseInput';
import { HUD } from './components/HUD';
import { TouchOverlay } from './components/TouchOverlay';
import { VehicleHUD } from './components/VehicleHUD';
import { KillFeed } from './components/KillFeed';
import { DamageIndicator } from './components/DamageIndicator';
import { LoadingScreen } from './components/LoadingScreen';
import { MainLobby } from './components/MainLobby';
import { MatchCountdown } from './components/MatchCountdown';
import { OrientationPrompt } from './components/OrientationPrompt';
import { DevGuideModal } from './components/DevGuideModal';
import {
  GraphicsPreset,
  PerformanceStats,
  PlayerStats,
  GameMode,
  MapId,
  KillFeedItem,
  IncomingDamageIndicator,
  FloatingHitDamage,
  VehicleStats,
  VehicleMapMarker,
} from './game/types';
import { PlayerProgress, PlayerData, STORE_CATALOG, StoreItem } from './game/state/PlayerProgress';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine references
  const sceneManagerRef = useRef<SceneManager | null>(null);
  const worldRef = useRef<IslandWorld | null>(null);
  const playerRef = useRef<CharacterController | null>(null);
  const cameraControllerRef = useRef<ThirdPersonCamera | null>(null);
  const weaponSystemRef = useRef<WeaponSystem | null>(null);
  const botManagerRef = useRef<BotManager | null>(null);
  const pickupManagerRef = useRef<PickupManager | null>(null);
  const vehicleManagerRef = useRef<VehicleManager | null>(null);
  const touchManagerRef = useRef<TouchInputManager | null>(null);
  const keyboardManagerRef = useRef<KeyboardMouseInput | null>(null);
  const audioManagerRef = useRef<AudioManager | null>(null);

  // Vehicle states
  const [isDriving, setIsDriving] = useState<boolean>(false);
  const isDrivingRef = useRef<boolean>(false);
  isDrivingRef.current = isDriving;
  const [activeVehicleStats, setActiveVehicleStats] = useState<VehicleStats | null>(null);
  const [nearbyVehicle, setNearbyVehicle] = useState<{ id: string; name: string; distance: number } | null>(null);
  const [vehicleMarkers, setVehicleMarkers] = useState<VehicleMapMarker[]>([]);
  const vehicleInputRef = useRef<{
    throttle: number;
    steer: number;
    handbrake: boolean;
    boost: boolean;
  }>({ throttle: 0, steer: 0, handbrake: false, boost: false });

  // Player progress & persistent inventory manager
  const progressMgrRef = useRef<PlayerProgress>(new PlayerProgress());
  const [playerData, setPlayerData] = useState<PlayerData>(progressMgrRef.current.data);

  // High level Game State Flow
  const [gameState, setGameState] = useState<'loading' | 'lobby' | 'countdown' | 'match'>('loading');
  const gameStateRef = useRef<'loading' | 'lobby' | 'countdown' | 'match'>('loading');
  gameStateRef.current = gameState;

  // Game UI States
  const [graphicsPreset, setGraphicsPreset] = useState<GraphicsPreset>('medium');
  const [cameraSensitivity, setCameraSensitivity] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPortrait, setIsPortrait] = useState<boolean>(false);
  const [dismissPortraitPrompt, setDismissPortraitPrompt] = useState<boolean>(false);
  const [isDevGuideOpen, setIsDevGuideOpen] = useState<boolean>(false);

  // Shooter combat states
  const [isFiring, setIsFiring] = useState<boolean>(false);
  const [isAiming, setIsAiming] = useState<boolean>(false);
  const [hitMarkerActive, setHitMarkerActive] = useState<boolean>(false);
  const [spawnNotification, setSpawnNotification] = useState<string | null>(null);

  // Kill Feed & Damage Indicator states
  const [killFeedItems, setKillFeedItems] = useState<KillFeedItem[]>([
    {
      id: 'init-kill-1',
      killerName: 'NOOB-01 (Striker)',
      isPlayerKiller: false,
      victimName: 'NOOB-04 (Apex)',
      isPlayerVictim: false,
      weapon: 'AR-M4',
      timestamp: Date.now() - 2500,
    },
  ]);
  const [playerKillStreak, setPlayerKillStreak] = useState<number>(0);
  const [playerKillBanner, setPlayerKillBanner] = useState<{
    victimName: string;
    weapon: string;
    isHeadshot?: boolean;
    streak: number;
  } | null>(null);
  const [incomingDamageHits, setIncomingDamageHits] = useState<IncomingDamageIndicator[]>([]);
  const [outgoingHitDamages, setOutgoingHitDamages] = useState<FloatingHitDamage[]>([]);

  // Player & Performance Stats
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    health: 100,
    maxHealth: 100,
    armor: 75,
    maxArmor: 100,
    speed: 0,
    stance: 'standing',
    position: { x: 0, y: 0, z: 15 },
    heading: 0,
    groundHeight: 0,
    isGrounded: true,
    equippedWeapon: 'rifle',
    ammo: 30,
    maxAmmo: 30,
    reserveAmmo: 120,
    kills: 0,
    aliveBots: 5,
    totalBots: 5,
    medkitsCount: 2,
    isAiming: false,
    isReloading: false,
    botProtectionActive: false,
    selectedMap: 'india',
    rank: 'Bronze',
    rankPoints: 180,
    credits: 1200,
    diamonds: 60,
  });

  const [perfStats, setPerfStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.6,
    drawCalls: 0,
    triangles: 0,
  });

  // Dynamic virtual joystick state for UI overlay
  const [joystickState, setJoystickState] = useState({
    active: false,
    baseX: 0,
    baseY: 0,
    currentX: 0,
    currentY: 0,
    normalized: { x: 0, y: 0 },
  });

  // Orientation detector for Android Chrome
  const checkOrientation = useCallback(() => {
    const portrait = window.innerHeight > window.innerWidth && window.innerWidth < 768;
    setIsPortrait(portrait);
  }, []);

  useEffect(() => {
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, [checkOrientation]);

  // Periodic cleanup for fading damage indicators & kill feed items
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setIncomingDamageHits((prev) => prev.filter((h) => now - h.timestamp < 1200));
      setOutgoingHitDamages((prev) => prev.filter((d) => now - d.timestamp < 800));
      setKillFeedItems((prev) => prev.filter((k) => now - k.timestamp < 5500));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Clear player kill banner after 2.5 seconds
  useEffect(() => {
    if (!playerKillBanner) return;
    const timeout = setTimeout(() => {
      setPlayerKillBanner(null);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [playerKillBanner]);

  // Record incoming directional damage indicator
  const recordIncomingDamage = useCallback((damage: number, sourcePos?: THREE.Vector3) => {
    let indicatorAngle = 0;
    if (sourcePos && playerRef.current && cameraControllerRef.current) {
      const playerPos = playerRef.current.position;
      const dx = sourcePos.x - playerPos.x;
      const dz = sourcePos.z - playerPos.z;
      // In Three.js, camera forward is along -Z when yaw = 0
      const worldAngleRad = Math.atan2(dx, -dz);
      const relativeAngleRad = worldAngleRad - cameraControllerRef.current.yaw;
      const deg = (relativeAngleRad * 180) / Math.PI;
      indicatorAngle = ((deg % 360) + 360) % 360;
    } else {
      indicatorAngle = Math.floor(Math.random() * 60 - 30);
    }

    setIncomingDamageHits((prev) => [
      ...prev.slice(-3),
      {
        id: `inc-${Date.now()}-${Math.random()}`,
        angle: indicatorAngle,
        damage,
        timestamp: Date.now(),
      },
    ]);
  }, []);

  // Ref to track aiming and firing in loop without closure stale states
  const isAimingRef = useRef(isAiming);
  isAimingRef.current = isAiming;

  const isFiringRef = useRef(isFiring);
  isFiringRef.current = isFiring;

  // Initialize Game Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 1. Audio
    const audio = new AudioManager();
    audioManagerRef.current = audio;

    // 2. Scene & Renderer
    const sceneMgr = new SceneManager(canvas, graphicsPreset);
    sceneManagerRef.current = sceneMgr;

    // 3. 3D Island World (loads currently selected map: india, rajasthan, or frontier)
    const initialMap = progressMgrRef.current.data.selectedMap || 'india';
    const world = new IslandWorld(sceneMgr.scene, initialMap);
    worldRef.current = world;

    // 4. Character Controller
    const player = new CharacterController(world, audio);
    playerRef.current = player;

    // Apply initial equipped outfit and backpack
    const equippedOutfitId = progressMgrRef.current.data.equippedOutfit;
    const initialOutfit = STORE_CATALOG.find((i) => i.id === equippedOutfitId);
    if (initialOutfit?.colors) {
      player.applyOutfit(
        initialOutfit.colors.suit,
        initialOutfit.colors.armor,
        initialOutfit.colors.visor
      );
    }
    const initialPack = STORE_CATALOG.find((i) => i.id === progressMgrRef.current.data.equippedBackpack);
    if (initialPack) {
      player.applyBackpack(initialPack.id === 'pack_titan' ? 0x0f172a : 0x334155);
    }

    // 5. Third-Person Follow Camera
    const camController = new ThirdPersonCamera(sceneMgr.camera, world);
    cameraControllerRef.current = camController;

    // 6. Weapon System (3D Visible Gun)
    const weaponSystem = new WeaponSystem(sceneMgr.scene, audio);
    weaponSystemRef.current = weaponSystem;

    // 7. Enemy Bots (5 Guaranteed Visible Bots with distinct names)
    const botManager = new BotManager(world, audio);
    botManagerRef.current = botManager;

    // 8. Health Pickups (Medkits on ground)
    const pickupManager = new PickupManager(world, audio);
    pickupManagerRef.current = pickupManager;

    // 8b. Driveable Tactical Vehicles Manager
    const vehicleManager = new VehicleManager(sceneMgr.scene, world, audio);
    vehicleManagerRef.current = vehicleManager;

    // 9. Touch Controller (Mobile)
    const touchMgr = new TouchInputManager(container);
    touchManagerRef.current = touchMgr;

    // 10. Keyboard & Mouse Controller (Desktop QA)
    const kbMgr = new KeyboardMouseInput(canvas);
    keyboardManagerRef.current = kbMgr;

    // Raycaster for weapon shooting from center of camera
    const raycaster = new THREE.Raycaster();

    // First user touch unlocks mobile audio context
    const unlockAudio = () => {
      audio.unlock();
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
    };
    window.addEventListener('touchstart', unlockAudio, { passive: true });
    window.addEventListener('click', unlockAudio, { passive: true });

    // Animation Loop
    let animationFrameId: number;
    let lastTime = performance.now();
    let statsThrottle = 0;

    const gameLoop = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(gameLoop);

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      // Update World animations (rotating radar dishes, water waves, beacons)
      world.update(dt);

      const currentGameState = gameStateRef.current;

      if (currentGameState === 'lobby' || currentGameState === 'loading') {
        // --- LOBBY MODE: 3D Operator Showcase Stage ---
        const groundY = world.getTerrainHeight(0, 15);
        player.position.set(0, groundY, 15);
        player.mesh.position.copy(player.position);
        player.mesh.rotation.y = player.rotationY;

        // Position camera in front of player looking directly at them
        camController.camera.position.set(0, groundY + 1.35, 18.5);
        camController.camera.lookAt(0, groundY + 1.25, 15);

        // Update rig idle breathing
        player.update(dt, { x: 0, y: 0 }, 0, { jump: false, crouch: false, sprint: false });

        // Update weapon in holding position
        weaponSystem.update(dt, player.position, player.rotationY, Math.PI, 0, false);

        sceneMgr.updateSunTarget(player.position);
        sceneMgr.render();
      } else if (currentGameState === 'countdown' || currentGameState === 'match') {
        // --- MATCH & AIRDROP MODE ---
        // Collect inputs: prioritize touch joystick if active, otherwise keyboard
        const touchMove = touchMgr.joystick.normalized;
        const kbMove = kbMgr.getMovementVector();
        const moveInput = touchMgr.joystick.active
          ? { x: touchMove.x, y: touchMove.y }
          : {
              x: touchMove.x !== 0 ? touchMove.x : kbMove.x,
              y: touchMove.y !== 0 ? touchMove.y : kbMove.y,
            };

        // Camera look deltas
        const touchLook = touchMgr.consumeLookDelta();
        const mouseLook = kbMgr.consumeMouseDelta();
        const totalLookX = touchLook.x + mouseLook.x;
        const totalLookY = touchLook.y + mouseLook.y;

        if (totalLookX !== 0 || totalLookY !== 0) {
          camController.handleLookDelta(totalLookX, totalLookY, cameraSensitivity);
        }

        // Check desktop vehicle interact key [F]/[E]/[V]
        if (kbMgr.consumeVehicleInteract()) {
          if (isDrivingRef.current) {
            handleExitVehicle();
          } else {
            handleEnterVehicle();
          }
        }

        const isCurrentlyDriving = isDrivingRef.current && !!vehicleManager.activeVehicle;
        const currentAiming = isCurrentlyDriving ? false : (isAimingRef.current || kbMgr.isAiming());

        if (isCurrentlyDriving && vehicleManager.activeVehicle) {
          // --- DRIVING VEHICLE MODE ---
          const activeVeh = vehicleManager.activeVehicle;

          // Combined inputs: dedicated touch button > keyboard W/S > touch joystick Y
          const throttleVal =
            vehicleInputRef.current.throttle !== 0
              ? vehicleInputRef.current.throttle
              : kbMove.y !== 0
              ? kbMove.y
              : moveInput.y;

          // Steer: keyboard A/D > touch joystick X
          const steerVal = kbMove.x !== 0 ? kbMove.x : moveInput.x;

          // Handbrake & Boost & Horn
          const handbrakeVal = kbMgr.isVehicleHandbrake() || vehicleInputRef.current.handbrake;
          const boostVal = kbMgr.isVehicleBoosting() || vehicleInputRef.current.boost;

          if (kbMgr.isVehicleHonk()) {
            activeVeh.honk();
          }

          // Update vehicle physics & bot ramming collisions
          vehicleManager.update(
            dt,
            { throttle: throttleVal, steer: steerVal, handbrake: handbrakeVal, boost: boostVal },
            world,
            player,
            botManager,
            (botName, damage, eliminated) => {
              setHitMarkerActive(true);
              setTimeout(() => setHitMarkerActive(false), 140);

              setOutgoingHitDamages((prev) => [
                ...prev.slice(-4),
                {
                  id: `ram-${Date.now()}-${Math.random()}`,
                  damage,
                  isHeadshot: false,
                  isElimination: eliminated,
                  offsetX: (Math.random() - 0.5) * 40,
                  offsetY: (Math.random() - 0.5) * 30,
                  timestamp: Date.now(),
                },
              ]);

              if (eliminated) {
                player.kills++;
                audio.playElimination();
                progressMgrRef.current.recordMatchFinish(1, false);
                setPlayerData({ ...progressMgrRef.current.data });

                const killItem: KillFeedItem = {
                  id: `veh-kill-${Date.now()}`,
                  killerName: playerData.displayName || 'YOU',
                  isPlayerKiller: true,
                  victimName: botName,
                  isPlayerVictim: false,
                  weapon: 'VEHICULAR RAM',
                  timestamp: Date.now(),
                };
                setKillFeedItems((prev) => [killItem, ...prev.slice(0, 5)]);

                setPlayerKillStreak((curr) => {
                  const newStreak = curr + 1;
                  setPlayerKillBanner({
                    victimName: botName,
                    weapon: 'TACTICAL RAM 🚗💥',
                    streak: newStreak,
                  });
                  return newStreak;
                });
              }
            }
          );

          // Update camera tracking for vehicle-based movement
          camController.updateVehicleCamera(dt, activeVeh);

          // Sync weapon position to follow player/vehicle
          weaponSystem.update(
            dt,
            player.position,
            activeVeh.heading,
            camController.yaw,
            camController.pitch,
            false
          );
        } else {
          // --- ON-FOOT INFANTRY MODE ---
          // Proximity detection for nearby parked vehicles
          const nearest = vehicleManager.getNearestVehicle(player.position, 4.0);
          if (nearest) {
            setNearbyVehicle({
              id: nearest.id,
              name: nearest.name,
              distance: player.position.distanceTo(nearest.position),
            });
          } else {
            setNearbyVehicle(null);
          }

          // Actions
          const wantsJump = touchMgr.actions.jump || kbMgr.isJumping();
          const actions = {
            jump: wantsJump,
            crouch: touchMgr.actions.crouch || kbMgr.isCrouching(),
            sprint: touchMgr.actions.sprint || kbMgr.isSprinting(),
          };

          if (touchMgr.actions.jump) {
            touchMgr.actions.jump = false;
          }

          // Update Player Kinematics with camera-relative movement
          player.update(dt, moveInput, camController.yaw, actions);

          // Update Camera Chase Position with Aim Zoom
          camController.update(dt, player, currentAiming);

          // Update Visible 3D Weapon
          weaponSystem.update(
            dt,
            player.position,
            player.rotationY,
            camController.yaw,
            camController.pitch,
            currentAiming
          );

          // Check Shooting Trigger (Mobile Fire button or Desktop Click)
          const wantsFire = isFiringRef.current || kbMgr.isFiring();
          if (wantsFire && player.health > 0) {
            raycaster.setFromCamera(new THREE.Vector2(0, 0), sceneMgr.camera);
            const rayOrigin = raycaster.ray.origin;
            const rayDir = raycaster.ray.direction;
            const targetAimPoint = rayOrigin.clone().add(rayDir.clone().multiplyScalar(100));

            const didShoot = weaponSystem.shoot(targetAimPoint);
            if (didShoot) {
              const weaponDamage =
                weaponSystem.currentWeapon === 'rifle'
                  ? weaponSystem.rifleDamage
                  : weaponSystem.shotgunDamage * 5;

              const hitResult = botManager.checkPlayerRayHit(rayOrigin, rayDir, weaponDamage);
              if (hitResult.hit) {
                setHitMarkerActive(true);
                setTimeout(() => setHitMarkerActive(false), 140);

                // Floating outgoing damage numbers near reticle
                const randX = (Math.random() - 0.5) * 50;
                const randY = (Math.random() - 0.5) * 30;
                setOutgoingHitDamages((prev) => [
                  ...prev.slice(-4),
                  {
                    id: `hit-dmg-${Date.now()}-${Math.random()}`,
                    damage: hitResult.damageDealt,
                    isHeadshot: hitResult.isHeadshot,
                    isElimination: hitResult.eliminated,
                    offsetX: randX,
                    offsetY: randY,
                    timestamp: Date.now(),
                  },
                ]);

                if (hitResult.eliminated) {
                  player.kills++;
                  audio.playElimination();
                  progressMgrRef.current.recordMatchFinish(1, false);
                  setPlayerData({ ...progressMgrRef.current.data });

                  const victimName = hitResult.botName || 'Hostile Bot';
                  const weaponName = weaponSystem.currentWeapon === 'rifle' ? 'AR-M4' : 'Shotgun';

                  // Add to Battle Royale Kill Feed
                  const killItem: KillFeedItem = {
                    id: `kill-${Date.now()}`,
                    killerName: playerData.displayName || 'YOU',
                    isPlayerKiller: true,
                    victimName,
                    isPlayerVictim: false,
                    weapon: weaponName,
                    isHeadshot: hitResult.isHeadshot,
                    timestamp: Date.now(),
                  };
                  setKillFeedItems((prev) => [killItem, ...prev.slice(0, 5)]);

                  // Trigger Center Screen Elimination Confirmation Banner
                  setPlayerKillStreak((curr) => {
                    const newStreak = curr + 1;
                    setPlayerKillBanner({
                      victimName,
                      weapon: weaponName,
                      isHeadshot: hitResult.isHeadshot,
                      streak: newStreak,
                    });
                    return newStreak;
                  });

                  // Spawn a loot medkit at bot location
                  const botPos = new THREE.Vector3(
                    targetAimPoint.x,
                    world.getTerrainHeight(targetAimPoint.x, targetAimPoint.z),
                    targetAimPoint.z
                  );
                  pickupManager.spawnMedkit(`drop-medkit-${Date.now()}`, botPos);
                }
              }
            }
          }

          // Desktop Keyboard Actions (R for reload, Q for weapon switch, H/E for heal)
          if (kbMgr.isReloading()) {
            weaponSystem.reload();
          }
          if (kbMgr.isSwitchingWeapon()) {
            weaponSystem.switchWeapon();
          }
          if (kbMgr.isHealing()) {
            player.heal(45);
          }

          // Update idle / unattended vehicles
          vehicleManager.update(
            dt,
            { throttle: 0, steer: 0, handbrake: false, boost: false },
            world,
            player
          );
        }

        // Update Bots AI & Projectiles
        botManager.update(
          dt,
          player.position,
          (damage, sourcePos) => {
            // RULE: Bot attacks reduce health, but MUST NEVER eliminate real player (clamped to 1 HP)
            player.takeDamage(damage, 'bot');
            recordIncomingDamage(damage, sourcePos);
          },
          (killerName, victimName, weapon) => {
            // Background bot skirmish elimination
            const skirmishItem: KillFeedItem = {
              id: `skirmish-${Date.now()}-${Math.random()}`,
              killerName,
              isPlayerKiller: false,
              victimName,
              isPlayerVictim: false,
              weapon,
              timestamp: Date.now(),
            };
            setKillFeedItems((prev) => [skirmishItem, ...prev.slice(0, 5)]);
          }
        );

        // Update Health Pickups (Medkits on ground)
        pickupManager.update(dt, player.position, (amount) => {
          player.addHealth(amount);
          progressMgrRef.current.recordMedkitCollected();
          setPlayerData({ ...progressMgrRef.current.data });
        });

        // Directional sunlight shadows focused on player
        sceneMgr.updateSunTarget(player.position);

        // Render 3D Scene & capture performance metrics
        const perf = sceneMgr.render();

        // Sync joystick visual state for HUD overlay
        setJoystickState({
          active: touchMgr.joystick.active,
          baseX: touchMgr.joystick.baseX,
          baseY: touchMgr.joystick.baseY,
          currentX: touchMgr.joystick.currentX,
          currentY: touchMgr.joystick.currentY,
          normalized: touchMgr.joystick.normalized,
        });

        // Throttle React state updates to ~15Hz for high performance
        statsThrottle += dt;
        if (statsThrottle >= 0.066) {
          const ammoInfo = weaponSystem.getAmmoInfo();
          const fullStats = player.getStats({
            equippedWeapon: ammoInfo.weapon,
            ammo: ammoInfo.current,
            maxAmmo: ammoInfo.max,
            reserveAmmo: ammoInfo.reserve,
            aliveBots: botManager.getAliveBotCount(),
            totalBots: botManager.bots.length,
            isAiming: currentAiming,
            isReloading: weaponSystem.isReloading,
            selectedMap: progressMgrRef.current.data.selectedMap,
            rank: progressMgrRef.current.data.rank,
            rankPoints: progressMgrRef.current.data.rankPoints,
            credits: progressMgrRef.current.data.credits,
            diamonds: progressMgrRef.current.data.diamonds,
          });

          setPlayerStats(fullStats);
          setPerfStats(perf);
          setVehicleMarkers(vehicleManager.getVehicleMarkers());
          if (isDrivingRef.current) {
            setActiveVehicleStats(vehicleManager.getActiveVehicleStats());
          }
          statsThrottle = 0;
        }
      }
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    const handleResize = () => {
      sceneMgr.handleResize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      touchMgr.dispose();
      kbMgr.dispose();
      sceneMgr.dispose();
    };
  }, [graphicsPreset, cameraSensitivity]);

  // Loading Screen Completion -> Transition into Main Lobby
  const handleLoadingComplete = () => {
    setGameState('lobby');
  };

  // Lobby CTA: Start Match -> Countdown -> Match
  const handleStartMatch = (mode: GameMode, mapId: MapId) => {
    progressMgrRef.current.setMode(mode);
    progressMgrRef.current.setMap(mapId);
    setPlayerData({ ...progressMgrRef.current.data });

    // Transition into 3-second countdown
    setGameState('countdown');
  };

  // Countdown finishes -> Drop player into match
  const handleCountdownComplete = () => {
    const selectedMap = progressMgrRef.current.data.selectedMap;
    if (worldRef.current && worldRef.current.currentMapId !== selectedMap) {
      worldRef.current.loadMap(selectedMap);
    }

    // Reset combat state for fresh match
    playerRef.current?.teleport(0, 15);
    playerRef.current?.resetMatchStats();
    weaponSystemRef.current?.resetAmmo();
    botManagerRef.current?.resetAll();
    pickupManagerRef.current?.resetAll();
    setIsFiring(false);
    setIsAiming(false);

    setGameState('match');

    setSpawnNotification(
      `Combat Started: 5 Bots Deployed on ${
        selectedMap === 'india'
          ? 'India (Heritage Island)'
          : selectedMap === 'rajasthan'
          ? 'Rajasthan (Desert Kingdom)'
          : 'Frontier Island'
      }`
    );
    setTimeout(() => setSpawnNotification(null), 5500);
  };

  // Return to Lobby from HUD or Elimination
  const handleReturnToLobby = () => {
    setGameState('lobby');
    setIsFiring(false);
    setIsAiming(false);
  };

  // Lobby 3D Character Preview Rotation
  const handleRotateCharacterPreview = (deltaX: number) => {
    if (playerRef.current) {
      playerRef.current.rotationY += deltaX * 0.015;
    }
  };

  // Lobby Inventory & Progression Handlers
  const handleSelectMap = (mapId: MapId) => {
    progressMgrRef.current.setMap(mapId);
    setPlayerData({ ...progressMgrRef.current.data });
    if (worldRef.current) {
      worldRef.current.loadMap(mapId);
    }
    if (vehicleManagerRef.current) {
      vehicleManagerRef.current.spawnDefaultVehicles();
    }
  };

  const handleSelectMode = (mode: GameMode) => {
    progressMgrRef.current.setMode(mode);
    setPlayerData({ ...progressMgrRef.current.data });
  };

  const handleBuyItem = (item: StoreItem) => {
    const res = progressMgrRef.current.buyItem(item);
    setPlayerData({ ...progressMgrRef.current.data });
    if (res.success && item.category === 'outfit' && item.colors) {
      playerRef.current?.applyOutfit(item.colors.suit, item.colors.armor, item.colors.visor);
    }
  };

  const handleEquipItem = (item: StoreItem) => {
    progressMgrRef.current.equipItem(item);
    setPlayerData({ ...progressMgrRef.current.data });
    if (item.category === 'outfit' && item.colors) {
      playerRef.current?.applyOutfit(item.colors.suit, item.colors.armor, item.colors.visor);
    } else if (item.category === 'backpack') {
      playerRef.current?.applyBackpack(item.id === 'pack_titan' ? 0x0f172a : 0x334155);
    }
  };

  const handleClaimDailyLogin = (day: number) => {
    progressMgrRef.current.claimDailyLogin(day);
    setPlayerData({ ...progressMgrRef.current.data });
  };

  const handleClaimMission = (missionId: string) => {
    progressMgrRef.current.claimMission(missionId);
    setPlayerData({ ...progressMgrRef.current.data });
  };

  const handleClaimPassTier = (tier: number) => {
    progressMgrRef.current.claimPassTier(tier);
    setPlayerData({ ...progressMgrRef.current.data });
  };

  // In-Game Control Handlers
  const handleSetPreset = (preset: GraphicsPreset) => {
    setGraphicsPreset(preset);
    sceneManagerRef.current?.applyPreset(preset);
  };

  const handleToggleMute = () => {
    if (audioManagerRef.current) {
      const muted = audioManagerRef.current.toggleMute();
      setIsMuted(muted);
    }
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Vehicle Enter / Exit Handlers
  const handleEnterVehicle = (targetVehicle?: any) => {
    const vehMgr = vehicleManagerRef.current;
    const player = playerRef.current;
    if (!vehMgr || !player) return;
    const veh = targetVehicle || vehMgr.getNearestVehicle(player.position, 4.2);
    if (veh && vehMgr.enterVehicle(veh, player)) {
      setIsDriving(true);
      setNearbyVehicle(null);
      setActiveVehicleStats(veh.getStats());
    }
  };

  const handleExitVehicle = () => {
    const vehMgr = vehicleManagerRef.current;
    const player = playerRef.current;
    const world = worldRef.current;
    if (!vehMgr || !player || !world) return;
    vehMgr.exitVehicle(player, world);
    setIsDriving(false);
    setActiveVehicleStats(null);
    vehicleInputRef.current = { throttle: 0, steer: 0, handbrake: false, boost: false };
  };

  const handleJump = () => {
    if (touchManagerRef.current) {
      touchManagerRef.current.actions.jump = true;
    }
  };

  const handleToggleCrouch = () => {
    touchManagerRef.current?.toggleCrouch();
  };

  const handleToggleSprint = () => {
    touchManagerRef.current?.toggleSprint();
  };

  const handleStartFire = () => {
    setIsFiring(true);
  };

  const handleStopFire = () => {
    setIsFiring(false);
  };

  const handleToggleAim = () => {
    setIsAiming((prev) => !prev);
  };

  const handleReload = () => {
    weaponSystemRef.current?.reload();
  };

  const handleSwitchWeapon = () => {
    weaponSystemRef.current?.switchWeapon();
  };

  const handleHeal = () => {
    playerRef.current?.heal(45);
  };

  const handleRespawn = () => {
    playerRef.current?.teleport(0, 15);
  };

  const handleTeleport = (x: number, z: number) => {
    playerRef.current?.teleport(x, z);
  };

  const handleTakeDamage = (amount: number) => {
    playerRef.current?.takeDamage(amount, 'environment');
    recordIncomingDamage(amount);
  };

  const handleRestartMatch = () => {
    if (isDrivingRef.current) {
      handleExitVehicle();
    }
    playerRef.current?.teleport(0, 15);
    playerRef.current?.resetMatchStats();
    weaponSystemRef.current?.resetAmmo();
    botManagerRef.current?.resetAll();
    pickupManagerRef.current?.resetAll();
    vehicleManagerRef.current?.spawnDefaultVehicles();
    setIsFiring(false);
    setIsAiming(false);
    setPlayerKillStreak(0);
    setPlayerKillBanner(null);
    setIncomingDamageHits([]);
    setOutgoingHitDamages([]);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 touch-none select-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block focus:outline-none"
      />

      {/* 1. LOADING SCREEN */}
      {gameState === 'loading' && (
        <LoadingScreen onLoadComplete={handleLoadingComplete} />
      )}

      {/* 2. MAIN LOBBY */}
      {gameState === 'lobby' && (
        <MainLobby
          playerData={playerData}
          onStartMatch={handleStartMatch}
          onSelectMap={handleSelectMap}
          onSelectMode={handleSelectMode}
          onBuyItem={handleBuyItem}
          onEquipItem={handleEquipItem}
          onClaimDailyLogin={handleClaimDailyLogin}
          onClaimMission={handleClaimMission}
          onClaimPassTier={handleClaimPassTier}
          onRotateCharacterPreview={handleRotateCharacterPreview}
          onOpenSettings={() => setIsDevGuideOpen(true)}
        />
      )}

      {/* 3. MATCH COUNTDOWN AIRDROP */}
      {gameState === 'countdown' && (
        <MatchCountdown
          mapId={playerData.selectedMap}
          mode={playerData.selectedMode}
          onCountdownComplete={handleCountdownComplete}
        />
      )}

      {/* 4. ACTIVE MATCH PLAY */}
      {gameState === 'match' && (
        <>
          {/* Spawn Notification Badge */}
          {spawnNotification && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/80 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-4 duration-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-mono font-bold text-cyan-200 tracking-wide uppercase">
                {spawnNotification}
              </span>
            </div>
          )}

          {/* Mobile Touch Surface Overlay & Shooter Controls */}
          <TouchOverlay
            joystickState={joystickState}
            stance={playerStats.stance}
            isSprinting={touchManagerRef.current?.actions.sprint || false}
            equippedWeapon={playerStats.equippedWeapon}
            ammo={playerStats.ammo}
            maxAmmo={playerStats.maxAmmo}
            reserveAmmo={playerStats.reserveAmmo}
            medkitsCount={playerStats.medkitsCount}
            isAiming={isAiming}
            isReloading={playerStats.isReloading}
            hitMarkerActive={hitMarkerActive}
            nearbyVehicle={nearbyVehicle}
            isDriving={isDriving}
            onEnterVehicle={() => handleEnterVehicle()}
            onJump={handleJump}
            onToggleCrouch={handleToggleCrouch}
            onToggleSprint={handleToggleSprint}
            onStartFire={handleStartFire}
            onStopFire={handleStopFire}
            onToggleAim={handleToggleAim}
            onReload={handleReload}
            onSwitchWeapon={handleSwitchWeapon}
            onHeal={handleHeal}
            onRespawn={handleRespawn}
          />

          {/* Tactical Vehicle Cockpit & Mobile Driving Controls */}
          {isDriving && activeVehicleStats && (
            <VehicleHUD
              stats={activeVehicleStats}
              onExit={handleExitVehicle}
              onHonk={() => vehicleManagerRef.current?.activeVehicle?.honk()}
              onBoostStart={() => {
                vehicleInputRef.current.boost = true;
              }}
              onBoostStop={() => {
                vehicleInputRef.current.boost = false;
              }}
              onThrottleStart={(dir) => {
                vehicleInputRef.current.throttle = dir;
              }}
              onThrottleStop={() => {
                vehicleInputRef.current.throttle = 0;
              }}
              onHandbrakeStart={() => {
                vehicleInputRef.current.handbrake = true;
              }}
              onHandbrakeStop={() => {
                vehicleInputRef.current.handbrake = false;
              }}
            />
          )}

          {/* Directional Threat Arcs & Floating Damage Numbers */}
          <DamageIndicator
            incomingHits={incomingDamageHits}
            hitDamages={outgoingHitDamages}
            isLowHealth={playerStats.health <= 25}
          />

          {/* Live Battle Royale Kill Feed & Booyah Elimination Banner */}
          <KillFeed
            feedItems={killFeedItems}
            playerKillBanner={playerKillBanner}
          />

          {/* Tactical Combat HUD */}
          <HUD
            stats={playerStats}
            perf={perfStats}
            landmarks={worldRef.current?.landmarks || []}
            islandRadius={worldRef.current?.islandRadius || 125}
            graphicsPreset={graphicsPreset}
            isMuted={isMuted}
            sensitivity={cameraSensitivity}
            vehicleMarkers={vehicleMarkers}
            onSetPreset={handleSetPreset}
            onToggleMute={handleToggleMute}
            onToggleFullscreen={handleToggleFullscreen}
            onOpenDevGuide={() => setIsDevGuideOpen(true)}
            onSensitivityChange={setCameraSensitivity}
            onTeleport={handleTeleport}
            onTakeDamage={handleTakeDamage}
            onRestartMatch={handleRestartMatch}
            onReturnToLobby={handleReturnToLobby}
          />
        </>
      )}

      {/* Orientation Advisory for Android Chrome in Portrait */}
      {isPortrait && !dismissPortraitPrompt && (
        <OrientationPrompt
          onDismiss={() => setDismissPortraitPrompt(true)}
          onRequestFullscreen={handleToggleFullscreen}
        />
      )}

      {/* Developer Blueprint & PlayCanvas Script Inspector Modal */}
      <DevGuideModal
        isOpen={isDevGuideOpen}
        onClose={() => setIsDevGuideOpen(false)}
      />
    </div>
  );
}
