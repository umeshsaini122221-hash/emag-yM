import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { IslandWorld } from './IslandWorld';
import { AudioManager } from './AudioManager';
import { CharacterController } from './CharacterController';
import { BotManager } from './BotManager';
import { VehicleMapMarker, VehicleStats } from '../types';

export class VehicleManager {
  public vehicles: Vehicle[] = [];
  public activeVehicle: Vehicle | null = null;
  private scene: THREE.Scene;
  private world: IslandWorld;
  private audio: AudioManager;

  constructor(scene: THREE.Scene, world: IslandWorld, audio: AudioManager) {
    this.scene = scene;
    this.world = world;
    this.audio = audio;

    this.spawnDefaultVehicles();
  }

  /**
   * Pre-spawn tactical recon dune buggies at key tactical locations across the map
   */
  public spawnDefaultVehicles() {
    this.clearAll();

    const spawnLocations = [
      { id: 'veh-1', name: 'APEX BUGGY [ALPHA]', x: 12, z: 22, heading: 0.2 },
      { id: 'veh-2', name: 'RECON ROVER [BRAVO]', x: -35, z: -15, heading: 1.8 },
      { id: 'veh-3', name: 'DUNE INTERCEPTOR [CHARLIE]', x: 28, z: -32, heading: -1.2 },
      { id: 'veh-4', name: 'TACTICAL BUGGY [DELTA]', x: -18, z: 46, heading: 2.7 },
    ];

    spawnLocations.forEach((loc) => {
      const terrainY = this.world.getTerrainHeight(loc.x, loc.z);
      const pos = new THREE.Vector3(loc.x, terrainY + 0.2, loc.z);
      const vehicle = new Vehicle(loc.id, loc.name, pos, loc.heading, this.scene, this.audio);
      this.vehicles.push(vehicle);
    });
  }

  public spawnVehicle(x: number, z: number, heading: number = 0, name?: string): Vehicle {
    const terrainY = this.world.getTerrainHeight(x, z);
    const pos = new THREE.Vector3(x, terrainY + 0.2, z);
    const id = `veh-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const vehName = name || `TACTICAL BUGGY #${this.vehicles.length + 1}`;
    const vehicle = new Vehicle(id, vehName, pos, heading, this.scene, this.audio);
    this.vehicles.push(vehicle);
    return vehicle;
  }

  /**
   * Find vehicle closest to a position within maxDist
   */
  public getNearestVehicle(pos: THREE.Vector3, maxDist: number = 4.2): Vehicle | null {
    let nearest: Vehicle | null = null;
    let minDist = maxDist;

    for (const veh of this.vehicles) {
      const dist = pos.distanceTo(veh.position);
      if (dist < minDist) {
        minDist = dist;
        nearest = veh;
      }
    }

    return nearest;
  }

  /**
   * Player enters the target vehicle
   */
  public enterVehicle(vehicle: Vehicle, player: CharacterController): boolean {
    if (vehicle.isOccupied) return false;

    this.activeVehicle = vehicle;
    vehicle.isOccupied = true;

    // Hide on-foot player mesh while seated in vehicle
    player.mesh.visible = false;
    player.position.copy(vehicle.position);

    // Audio feedback
    this.audio.playVehicleIgnition();
    this.audio.startVehicleEngine();

    return true;
  }

  /**
   * Player exits the currently driven vehicle
   */
  public exitVehicle(player: CharacterController, world: IslandWorld): Vehicle | null {
    if (!this.activeVehicle) return null;

    const vehicle = this.activeVehicle;
    vehicle.isOccupied = false;
    this.activeVehicle = null;

    // Shut down engine sound
    this.audio.stopVehicleEngine();

    // Place player at safe dismount spot on terrain beside vehicle
    const exitPos = vehicle.getExitPosition(world);
    player.position.copy(exitPos);
    player.mesh.position.copy(exitPos);
    player.mesh.visible = true;
    player.velocity.set(0, 0, 0);

    return vehicle;
  }

  /**
   * Frame update for all vehicles and check for bot ramming collisions
   */
  public update(
    dt: number,
    input: {
      throttle: number;
      steer: number;
      handbrake: boolean;
      boost: boolean;
    },
    world: IslandWorld,
    player: CharacterController,
    botManager?: BotManager,
    onRamBot?: (botName: string, damage: number, eliminated: boolean) => void
  ) {
    for (const vehicle of this.vehicles) {
      const isDriven = vehicle === this.activeVehicle;

      // Update vehicle kinematics
      vehicle.update(
        dt,
        isDriven
          ? input
          : { throttle: 0, steer: 0, handbrake: false, boost: false },
        world
      );

      // Keep on-foot player position in sync with vehicle while driving
      if (isDriven) {
        player.position.copy(vehicle.position);
        player.mesh.position.copy(vehicle.position);

        // Check ramming collision against bots
        if (botManager && Math.abs(vehicle.speed) > 3.5) {
          const ramSpeedKmh = Math.abs(vehicle.speed) * 3.6;
          for (const bot of botManager.bots) {
            if (!bot.isAlive) continue;
            const dist = vehicle.position.distanceTo(bot.position);
            if (dist < 2.3) {
              // Ramming hit!
              const ramDamage = Math.floor(Math.abs(vehicle.speed) * 14);
              bot.health -= ramDamage;
              this.audio.playVehicleImpact();

              // Fling bot back
              const flingDir = vehicle.velocity.clone().normalize().multiplyScalar(4.0);
              bot.position.add(flingDir);

              if (bot.health <= 0) {
                bot.isAlive = false;
                bot.mesh.visible = false;
                onRamBot?.(bot.name, ramDamage, true);
              } else {
                onRamBot?.(bot.name, ramDamage, false);
              }
            }
          }
        }
      }
    }
  }

  public getActiveVehicleStats(): VehicleStats | null {
    if (!this.activeVehicle) return null;
    return this.activeVehicle.getStats();
  }

  public getVehicleMarkers(): VehicleMapMarker[] {
    return this.vehicles.map((v) => ({
      id: v.id,
      name: v.name,
      position: { x: v.position.x, y: v.position.y, z: v.position.z },
      heading: (Math.round(THREE.MathUtils.radToDeg(-v.heading + Math.PI)) + 360) % 360,
      isOccupied: v.isOccupied,
    }));
  }

  public clearAll() {
    for (const v of this.vehicles) {
      v.destroy(this.scene);
    }
    this.vehicles = [];
    this.activeVehicle = null;
  }
}
