import * as THREE from 'three';
import { WeaponType } from '../types';
import { AudioManager } from './AudioManager';

export interface BulletTracer {
  mesh: THREE.Line;
  start: THREE.Vector3;
  end: THREE.Vector3;
  age: number;
  maxAge: number;
}

export interface ImpactParticle {
  mesh: THREE.Points;
  age: number;
  maxAge: number;
}

export class WeaponSystem {
  public scene: THREE.Scene;
  public audio: AudioManager;
  public currentWeapon: WeaponType = 'rifle';

  // Weapon Container Mesh (attached to player arm or root)
  public weaponMeshGroup: THREE.Group;
  private rifleMesh: THREE.Group;
  private shotgunMesh: THREE.Group;
  private muzzleFlashMesh: THREE.Mesh;
  private muzzleFlashLight: THREE.PointLight;
  private muzzleFlashTimer: number = 0;

  // Weapon Stats
  public rifleAmmo = 30;
  public rifleMaxAmmo = 30;
  public rifleReserve = 120;
  public rifleDamage = 26;
  public rifleFireRate = 0.13; // seconds between shots

  public shotgunAmmo = 8;
  public shotgunMaxAmmo = 8;
  public shotgunReserve = 32;
  public shotgunDamage = 16; // per pellet (5 pellets)
  public shotgunFireRate = 0.7;

  // State
  private lastFireTime: number = 0;
  public isReloading: boolean = false;
  public reloadProgress: number = 0;
  public reloadDuration: number = 1.8;
  public isAiming: boolean = false;

  // Visual effects
  private tracers: BulletTracer[] = [];
  private impacts: ImpactParticle[] = [];
  private recoilOffset = new THREE.Vector3();
  private recoilRotation = new THREE.Euler();

  constructor(scene: THREE.Scene, audio: AudioManager) {
    this.scene = scene;
    this.audio = audio;

    this.weaponMeshGroup = new THREE.Group();
    this.rifleMesh = this.buildRifleMesh();
    this.shotgunMesh = this.buildShotgunMesh();
    this.shotgunMesh.visible = false;

    this.weaponMeshGroup.add(this.rifleMesh);
    this.weaponMeshGroup.add(this.shotgunMesh);

    // Muzzle Flash
    const flashGeo = new THREE.DodecahedronGeometry(0.12, 0);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffaa00,
      transparent: true,
      opacity: 0.9,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.visible = false;
    this.weaponMeshGroup.add(this.muzzleFlashMesh);

    this.muzzleFlashLight = new THREE.PointLight(0xffaa22, 0, 5);
    this.weaponMeshGroup.add(this.muzzleFlashLight);

    this.scene.add(this.weaponMeshGroup);
  }

  private buildRifleMesh(): THREE.Group {
    const group = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3,
    });
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5,
      metalness: 0.7,
      roughness: 0.2,
    });
    const gripMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });

    // Receiver Body
    const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.55), bodyMat);
    receiver.castShadow = true;
    group.add(receiver);

    // Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 8), bodyMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0, 0.04, 0.45);
    barrel.castShadow = true;
    group.add(barrel);

    // Muzzle Brake
    const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.03, 0.08, 8), accentMat);
    muzzle.rotation.x = Math.PI / 2;
    muzzle.position.set(0, 0.04, 0.7);
    group.add(muzzle);

    // Magazine (Curved Bananapack)
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.3, 0.14), accentMat);
    mag.position.set(0, -0.16, 0.05);
    mag.rotation.x = 0.25;
    mag.castShadow = true;
    group.add(mag);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.35), gripMat);
    stock.position.set(0, -0.02, -0.38);
    stock.castShadow = true;
    group.add(stock);

    // Holographic Sight
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.09, 0.18), gripMat);
    sight.position.set(0, 0.13, 0);
    group.add(sight);

    const reticleLens = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, transparent: true, opacity: 0.8 })
    );
    reticleLens.position.set(0, 0.14, 0.06);
    group.add(reticleLens);

    // Tactical Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.2, 0.09), gripMat);
    grip.position.set(0, -0.14, -0.12);
    grip.rotation.x = -0.3;
    group.add(grip);

    group.scale.set(1.1, 1.1, 1.1);
    return group;
  }

  private buildShotgunMesh(): THREE.Group {
    const group = new THREE.Group();

    const heavyMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.25,
    });
    const orangeMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.5,
      roughness: 0.4,
    });

    // Receiver
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.6), heavyMat);
    body.castShadow = true;
    group.add(body);

    // Heavy Dual Barrel
    const barrel1 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), heavyMat);
    barrel1.rotation.x = Math.PI / 2;
    barrel1.position.set(-0.025, 0.05, 0.48);
    group.add(barrel1);

    const barrel2 = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5, 8), heavyMat);
    barrel2.rotation.x = Math.PI / 2;
    barrel2.position.set(0.025, 0.05, 0.48);
    group.add(barrel2);

    // Pump Slide
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.1, 0.2), orangeMat);
    pump.position.set(0, -0.01, 0.42);
    group.add(pump);

    // Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.15, 0.32), heavyMat);
    stock.position.set(0, -0.04, -0.38);
    group.add(stock);

    group.scale.set(1.05, 1.05, 1.05);
    return group;
  }

  public switchWeapon() {
    this.currentWeapon = this.currentWeapon === 'rifle' ? 'shotgun' : 'rifle';
    this.rifleMesh.visible = this.currentWeapon === 'rifle';
    this.shotgunMesh.visible = this.currentWeapon === 'shotgun';
    this.isReloading = false;
    this.audio.playReload();
  }

  public reload() {
    if (this.isReloading) return;
    const currentAmmo = this.currentWeapon === 'rifle' ? this.rifleAmmo : this.shotgunAmmo;
    const maxAmmo = this.currentWeapon === 'rifle' ? this.rifleMaxAmmo : this.shotgunMaxAmmo;
    const reserve = this.currentWeapon === 'rifle' ? this.rifleReserve : this.shotgunReserve;

    if (currentAmmo >= maxAmmo || reserve <= 0) return;

    this.isReloading = true;
    this.reloadProgress = 0;
    this.audio.playReload();
  }

  public canShoot(): boolean {
    if (this.isReloading) return false;
    const now = performance.now() / 1000;
    const fireRate = this.currentWeapon === 'rifle' ? this.rifleFireRate : this.shotgunFireRate;
    if (now - this.lastFireTime < fireRate) return false;

    const ammo = this.currentWeapon === 'rifle' ? this.rifleAmmo : this.shotgunAmmo;
    return ammo > 0;
  }

  /**
   * Fires the weapon from the gun muzzle toward target point (crosshair ray)
   */
  public shoot(
    targetPoint: THREE.Vector3,
    onHitBot?: (botId: string, damage: number, hitPoint: THREE.Vector3) => void
  ): boolean {
    if (!this.canShoot()) {
      if (
        !this.isReloading &&
        (this.currentWeapon === 'rifle' ? this.rifleAmmo : this.shotgunAmmo) === 0
      ) {
        this.reload();
      }
      return false;
    }

    this.lastFireTime = performance.now() / 1000;

    // Decrement Ammo
    if (this.currentWeapon === 'rifle') {
      this.rifleAmmo--;
    } else {
      this.shotgunAmmo--;
    }

    // Play Audio
    this.audio.playShoot(this.currentWeapon);

    // Muzzle Flash
    this.triggerMuzzleFlash();

    // Recoil Kick
    this.recoilOffset.z = -0.12;
    this.recoilRotation.x = 0.16;

    // Gun Muzzle Origin in world space
    const muzzlePos = new THREE.Vector3();
    this.muzzleFlashMesh.getWorldPosition(muzzlePos);

    // Number of pellets / rays
    const count = this.currentWeapon === 'shotgun' ? 5 : 1;
    const baseDamage = this.currentWeapon === 'rifle' ? this.rifleDamage : this.shotgunDamage;

    for (let i = 0; i < count; i++) {
      // Calculate ray direction with slight spread if shotgun or non-ADS
      const spread = this.isAiming ? (this.currentWeapon === 'shotgun' ? 0.03 : 0.005) : (this.currentWeapon === 'shotgun' ? 0.08 : 0.02);
      const spreadX = (Math.random() - 0.5) * spread;
      const spreadY = (Math.random() - 0.5) * spread;

      const aimDir = targetPoint.clone().sub(muzzlePos).normalize();
      aimDir.x += spreadX;
      aimDir.y += spreadY;
      aimDir.normalize();

      const rayEnd = muzzlePos.clone().add(aimDir.clone().multiplyScalar(150));

      // Spawn visual bullet tracer
      this.spawnTracer(muzzlePos, targetPoint.clone().add(new THREE.Vector3(spreadX * 20, spreadY * 20, 0)));
    }

    return true;
  }

  private triggerMuzzleFlash() {
    this.muzzleFlashMesh.visible = true;
    this.muzzleFlashLight.intensity = 2.5;
    this.muzzleFlashMesh.position.set(0, 0.04, this.currentWeapon === 'rifle' ? 0.8 : 0.75);
    this.muzzleFlashLight.position.copy(this.muzzleFlashMesh.position);
    this.muzzleFlashTimer = 0.06;
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const points = [start, end];
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: this.currentWeapon === 'rifle' ? 0x00f0ff : 0xffaa00,
      transparent: true,
      opacity: 0.95,
      linewidth: 2,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);

    this.tracers.push({
      mesh: line,
      start,
      end,
      age: 0,
      maxAge: 0.12,
    });
  }

  public spawnImpactSpark(position: THREE.Vector3) {
    const count = 8;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = position.x + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = position.y + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 2] = position.z + (Math.random() - 0.5) * 0.4;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffcc00,
      size: 0.15,
      transparent: true,
      opacity: 1.0,
    });
    const pts = new THREE.Points(geo, mat);
    this.scene.add(pts);

    this.impacts.push({
      mesh: pts,
      age: 0,
      maxAge: 0.25,
    });
  }

  public update(
    dt: number,
    playerPosition: THREE.Vector3,
    playerRotationY: number,
    cameraYaw: number,
    cameraPitch: number,
    isAiming: boolean
  ) {
    this.isAiming = isAiming;

    // Handle Reload Progress
    if (this.isReloading) {
      this.reloadProgress += dt / this.reloadDuration;
      if (this.reloadProgress >= 1.0) {
        this.isReloading = false;
        if (this.currentWeapon === 'rifle') {
          const needed = this.rifleMaxAmmo - this.rifleAmmo;
          const toAdd = Math.min(needed, this.rifleReserve);
          this.rifleAmmo += toAdd;
          this.rifleReserve -= toAdd;
        } else {
          const needed = this.shotgunMaxAmmo - this.shotgunAmmo;
          const toAdd = Math.min(needed, this.shotgunReserve);
          this.shotgunAmmo += toAdd;
          this.shotgunReserve -= toAdd;
        }
      }
    }

    // Recover recoil smoothly
    this.recoilOffset.lerp(new THREE.Vector3(0, 0, 0), dt * 14);
    this.recoilRotation.x = THREE.MathUtils.lerp(this.recoilRotation.x, 0, dt * 16);

    // Muzzle Flash Decay
    if (this.muzzleFlashTimer > 0) {
      this.muzzleFlashTimer -= dt;
      if (this.muzzleFlashTimer <= 0) {
        this.muzzleFlashMesh.visible = false;
        this.muzzleFlashLight.intensity = 0;
      }
    }

    // Position weapon attached relative to player and aimed forward
    // In standard third-person: gun is anchored near right chest/shoulder (x: 0.35, y: 1.25, z: 0.2)
    // When aiming (ADS): gun moves towards center eye line (x: 0.18, y: 1.42, z: 0.4)
    const targetOffset = isAiming
      ? new THREE.Vector3(0.2, 1.42, 0.45)
      : new THREE.Vector3(0.35, 1.22, 0.25);

    // Rotate offset by camera yaw so gun stays relative to facing direction
    targetOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), cameraYaw);

    const targetPos = playerPosition.clone().add(targetOffset).add(this.recoilOffset);
    this.weaponMeshGroup.position.lerp(targetPos, Math.min(1.0, dt * 25));

    // Gun rotation matches camera yaw and pitch so it points where the crosshair points
    this.weaponMeshGroup.rotation.set(cameraPitch + this.recoilRotation.x, cameraYaw + Math.PI, 0, 'YXZ');

    // Update bullet tracers
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const tracer = this.tracers[i];
      tracer.age += dt;
      const mat = tracer.mesh.material as THREE.LineBasicMaterial;
      mat.opacity = Math.max(0, 1 - tracer.age / tracer.maxAge);
      if (tracer.age >= tracer.maxAge) {
        this.scene.remove(tracer.mesh);
        tracer.mesh.geometry.dispose();
        mat.dispose();
        this.tracers.splice(i, 1);
      }
    }

    // Update impact sparks
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      const imp = this.impacts[i];
      imp.age += dt;
      const mat = imp.mesh.material as THREE.PointsMaterial;
      mat.opacity = Math.max(0, 1 - imp.age / imp.maxAge);
      if (imp.age >= imp.maxAge) {
        this.scene.remove(imp.mesh);
        imp.mesh.geometry.dispose();
        mat.dispose();
        this.impacts.splice(i, 1);
      }
    }
  }

  public getAmmoInfo() {
    return {
      current: this.currentWeapon === 'rifle' ? this.rifleAmmo : this.shotgunAmmo,
      max: this.currentWeapon === 'rifle' ? this.rifleMaxAmmo : this.shotgunMaxAmmo,
      reserve: this.currentWeapon === 'rifle' ? this.rifleReserve : this.shotgunReserve,
      weapon: this.currentWeapon,
    };
  }

  public resetAmmo() {
    this.rifleAmmo = this.rifleMaxAmmo;
    this.rifleReserve = 120;
    this.shotgunAmmo = this.shotgunMaxAmmo;
    this.shotgunReserve = 32;
    this.isReloading = false;
  }
}
