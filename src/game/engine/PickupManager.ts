import * as THREE from 'three';
import { AudioManager } from './AudioManager';
import { IslandWorld } from './IslandWorld';

export interface PickupItem {
  id: string;
  type: 'health';
  mesh: THREE.Group;
  position: THREE.Vector3;
  baseY: number;
  active: boolean;
  amount: number;
}

export class PickupManager {
  public pickups: PickupItem[] = [];
  private world: IslandWorld;
  private audio: AudioManager;

  constructor(world: IslandWorld, audio: AudioManager) {
    this.world = world;
    this.audio = audio;
    this.spawnInitialPickups();
  }

  private buildMedkitMesh(): THREE.Group {
    const group = new THREE.Group();

    // White Case
    const caseGeo = new THREE.BoxGeometry(0.7, 0.45, 0.35);
    const caseMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.1,
    });
    const box = new THREE.Mesh(caseGeo, caseMat);
    box.castShadow = true;
    group.add(box);

    // Green Cross Plates
    const crossMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.8,
    });

    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.37), crossMat);
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.37), crossMat);
    group.add(crossH);
    group.add(crossV);

    // Glowing beacon ring around it
    const ringGeo = new THREE.RingGeometry(0.45, 0.55, 16);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = -0.3;
    group.add(ring);

    return group;
  }

  public spawnInitialPickups() {
    // Clear existing
    for (const p of this.pickups) {
      this.world.scene.remove(p.mesh);
    }
    this.pickups = [];

    // Place 6 medkits across landmarks and fields
    const locations = [
      new THREE.Vector3(0, 0, 10),      // Near spawn
      new THREE.Vector3(15, 0, 20),     // Radar path
      new THREE.Vector3(-45, 0, -15),   // West ridge
      new THREE.Vector3(55, 0, -32),    // Harbor warehouse
      new THREE.Vector3(-25, 0, 55),    // Crash site
      new THREE.Vector3(-10, 0, 25),    // Tactical cover meadow
    ];

    locations.forEach((pos, idx) => {
      this.spawnMedkit(`medkit-${idx}`, pos);
    });
  }

  public spawnMedkit(id: string, pos: THREE.Vector3) {
    const mesh = this.buildMedkitMesh();
    const groundY = this.world.getTerrainHeight(pos.x, pos.z);
    const actualPos = new THREE.Vector3(pos.x, groundY + 0.5, pos.z);

    mesh.position.copy(actualPos);
    this.world.scene.add(mesh);

    this.pickups.push({
      id,
      type: 'health',
      mesh,
      position: actualPos,
      baseY: groundY + 0.5,
      active: true,
      amount: 35,
    });
  }

  public update(dt: number, playerPos: THREE.Vector3, onCollectHealth: (amount: number) => void) {
    const time = performance.now() * 0.002;

    for (const p of this.pickups) {
      if (!p.active) continue;

      // Bobbing & slow rotation
      p.mesh.rotation.y += dt * 1.5;
      p.mesh.position.y = p.baseY + Math.sin(time + p.position.x) * 0.15;

      // Player proximity check (1.6m collection radius)
      const dist = p.position.distanceTo(playerPos);
      if (dist < 1.6) {
        p.active = false;
        p.mesh.visible = false;
        this.audio.playHeal();
        onCollectHealth(p.amount);

        // Respawn after 25s
        setTimeout(() => {
          p.active = true;
          p.mesh.visible = true;
        }, 25000);
      }
    }
  }

  public resetAll() {
    for (const p of this.pickups) {
      p.active = true;
      p.mesh.visible = true;
    }
  }
}
