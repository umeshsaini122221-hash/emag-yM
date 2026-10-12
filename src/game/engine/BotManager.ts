import * as THREE from 'three';
import { BotInfo } from '../types';
import { AudioManager } from './AudioManager';
import { IslandWorld } from './IslandWorld';

export interface BotProjectile {
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  sourcePos: THREE.Vector3;
  velocity: THREE.Vector3;
  damage: number;
  age: number;
  maxAge: number;
}

export interface FloatingDamage {
  textMesh: THREE.Sprite;
  position: THREE.Vector3;
  age: number;
  maxAge: number;
}

export class Bot {
  public id: string;
  public name: string;
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public rotationY: number = 0;
  public health: number = 100;
  public maxHealth: number = 100;
  public isAlive: boolean = true;
  public isAggro: boolean = false;

  // AI & Kinematics
  private spawnOrigin: THREE.Vector3;
  private patrolTarget: THREE.Vector3;
  private patrolTimer: number = 0;
  private shootCooldown: number = 0;
  private walkCycleTime: number = 0;

  // Visual parts
  private torso!: THREE.Mesh;
  private head!: THREE.Group;
  private visor!: THREE.Mesh;
  private leftLeg!: THREE.Group;
  private rightLeg!: THREE.Group;
  private leftArm!: THREE.Group;
  private rightArm!: THREE.Group;
  private gunMesh!: THREE.Group;
  private healthBarSprite!: THREE.Sprite;
  private healthCanvas!: HTMLCanvasElement;
  private healthTexture!: THREE.CanvasTexture;
  private hitFlashTimer: number = 0;

  private world: IslandWorld;
  private audio: AudioManager;

  constructor(
    id: string,
    name: string,
    spawnPos: THREE.Vector3,
    world: IslandWorld,
    audio: AudioManager
  ) {
    this.id = id;
    this.name = name;
    this.world = world;
    this.audio = audio;

    const groundY = this.world.getTerrainHeight(spawnPos.x, spawnPos.z);
    this.position = new THREE.Vector3(spawnPos.x, groundY, spawnPos.z);
    this.spawnOrigin = this.position.clone();
    this.patrolTarget = this.position.clone();

    this.mesh = new THREE.Group();
    this.buildBotRig();
    this.buildHealthBarSprite();

    this.mesh.position.copy(this.position);
    this.world.scene.add(this.mesh);

    // Stagger initial shoot cooldown
    this.shootCooldown = 1.0 + Math.random() * 2.0;
  }

  private buildBotRig() {
    // Hostile Crimson / Charcoal PBR Materials
    const suitMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      roughness: 0.6,
      metalness: 0.4,
    });
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Crimson Red hostile armor
      roughness: 0.35,
      metalness: 0.6,
    });
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Glowing Red Visor
      emissive: 0xef4444,
      emissiveIntensity: 0.9,
    });
    const gunMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.8,
      roughness: 0.3,
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.56, 0.68, 0.34);
    this.torso = new THREE.Mesh(torsoGeo, suitMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.mesh.add(this.torso);

    // Crimson Chest Plate
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.44, 0.12), armorMat);
    chestPlate.position.set(0, 0.08, 0.17);
    this.torso.add(chestPlate);

    // 2. Head
    this.head = new THREE.Group();
    this.head.position.set(0, 1.62, 0);

    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.36, 0.38), armorMat);
    helmet.castShadow = true;
    this.head.add(helmet);

    // Visor
    this.visor = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.1), visorMat);
    this.visor.position.set(0, 0.04, 0.17);
    this.head.add(this.visor);
    this.mesh.add(this.head);

    // 3. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);

    this.leftLeg = new THREE.Group();
    this.leftLeg.position.set(-0.16, 0.75, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
    leftLegMesh.position.y = -0.32;
    leftLegMesh.castShadow = true;
    this.leftLeg.add(leftLegMesh);
    this.mesh.add(this.leftLeg);

    this.rightLeg = new THREE.Group();
    this.rightLeg.position.set(0.16, 0.75, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
    rightLegMesh.position.y = -0.32;
    rightLegMesh.castShadow = true;
    this.rightLeg.add(rightLegMesh);
    this.mesh.add(this.rightLeg);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);

    this.leftArm = new THREE.Group();
    this.leftArm.position.set(-0.38, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    leftArmMesh.position.y = -0.25;
    this.leftArm.add(leftArmMesh);
    this.mesh.add(this.leftArm);

    this.rightArm = new THREE.Group();
    this.rightArm.position.set(0.38, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
    rightArmMesh.position.y = -0.25;
    this.rightArm.add(rightArmMesh);

    // 5. Weapon in right arm
    this.gunMesh = new THREE.Group();
    const gunBody = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 0.45), gunMat);
    const gunBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), gunMat);
    gunBarrel.rotation.x = Math.PI / 2;
    gunBarrel.position.set(0, 0.03, 0.35);

    this.gunMesh.add(gunBody);
    this.gunMesh.add(gunBarrel);
    this.gunMesh.position.set(0.05, -0.35, 0.22);
    this.rightArm.add(this.gunMesh);

    this.mesh.add(this.rightArm);
  }

  private buildHealthBarSprite() {
    this.healthCanvas = document.createElement('canvas');
    this.healthCanvas.width = 256;
    this.healthCanvas.height = 64;

    this.healthTexture = new THREE.CanvasTexture(this.healthCanvas);
    const spriteMat = new THREE.SpriteMaterial({
      map: this.healthTexture,
      transparent: true,
      depthTest: false,
    });

    this.healthBarSprite = new THREE.Sprite(spriteMat);
    this.healthBarSprite.position.set(0, 2.25, 0);
    this.healthBarSprite.scale.set(1.4, 0.35, 1);
    this.mesh.add(this.healthBarSprite);

    this.updateHealthBarTexture();
  }

  private updateHealthBarTexture() {
    const ctx = this.healthCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 256, 64);

    // Background pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(4, 4, 248, 56, 8);
    } else {
      ctx.fillRect(4, 4, 248, 56);
    }
    ctx.fill();

    // Border
    ctx.strokeStyle = this.isAggro ? 'rgba(239, 68, 68, 0.9)' : 'rgba(100, 116, 139, 0.7)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Bot Name
    ctx.font = 'bold 22px monospace';
    ctx.fillStyle = this.isAggro ? '#f87171' : '#f1f5f9';
    ctx.textAlign = 'left';
    ctx.fillText(this.name, 14, 28);

    // Numeric HP
    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.max(0, Math.round(this.health))} HP`, 242, 28);

    // Health Bar Frame
    const barX = 14;
    const barY = 36;
    const barW = 228;
    const barH = 14;

    ctx.fillStyle = '#334155';
    ctx.fillRect(barX, barY, barW, barH);

    // Filled Health Bar
    const healthPercent = Math.max(0, Math.min(1, this.health / this.maxHealth));
    ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#eab308' : '#ef4444';
    ctx.fillRect(barX, barY, barW * healthPercent, barH);

    this.healthTexture.needsUpdate = true;
  }

  public takeDamage(amount: number): boolean {
    if (!this.isAlive) return false;

    this.health -= amount;
    this.isAggro = true; // immediately retaliate if attacked
    this.hitFlashTimer = 0.12;

    // Flash white on hit
    (this.torso.material as THREE.MeshStandardMaterial).color.setHex(0xffffff);

    this.updateHealthBarTexture();

    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.eliminate();
      return true; // Was eliminated!
    }

    return false;
  }

  private eliminate() {
    // Collapse to ground
    this.mesh.rotation.x = Math.PI / 2.2;
    this.mesh.position.y = this.world.getTerrainHeight(this.position.x, this.position.z) + 0.25;
    this.healthBarSprite.visible = false;
    this.audio.playElimination();

    // Hide after 3 seconds
    setTimeout(() => {
      this.mesh.visible = false;
    }, 3500);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onBotFire: (fromPos: THREE.Vector3, toPos: THREE.Vector3) => void
  ) {
    if (!this.isAlive) return;

    // Hit Flash recovery
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
      if (this.hitFlashTimer <= 0) {
        (this.torso.material as THREE.MeshStandardMaterial).color.setHex(0x27272a);
      }
    }

    const distToPlayer = this.position.distanceTo(playerPos);

    // Aggro Check: detects player within 38 meters
    const wasAggro = this.isAggro;
    this.isAggro = distToPlayer < 38;
    if (this.isAggro !== wasAggro) {
      this.updateHealthBarTexture();
    }

    let isWalking = false;

    if (this.isAggro) {
      // Rotate to face player
      const angleToPlayer = Math.atan2(playerPos.x - this.position.x, playerPos.z - this.position.z);
      this.rotationY = angleToPlayer;

      // Approach player if further than optimal shooting distance (14m)
      if (distToPlayer > 13) {
        isWalking = true;
        const speed = 3.8;
        const nextX = this.position.x + Math.sin(angleToPlayer) * speed * dt;
        const nextZ = this.position.z + Math.cos(angleToPlayer) * speed * dt;

        // Collision check
        const resolved = this.world.resolveCollision(new THREE.Vector3(nextX, 0, nextZ), 0.5, 1.8);
        this.position.x = resolved.position.x;
        this.position.z = resolved.position.z;
        this.position.y = this.world.getTerrainHeight(this.position.x, this.position.z);
      }

      // Shoot at player
      this.shootCooldown -= dt;
      if (this.shootCooldown <= 0) {
        this.shootCooldown = 1.4 + Math.random() * 0.9;

        // Gun muzzle origin
        const muzzlePos = new THREE.Vector3(
          this.position.x + Math.sin(this.rotationY + 0.3) * 0.7,
          this.position.y + 1.25,
          this.position.z + Math.cos(this.rotationY + 0.3) * 0.7
        );

        // Aim at player's torso with slight aim error
        const targetAim = playerPos.clone().add(new THREE.Vector3(
          (Math.random() - 0.5) * 0.8,
          1.1 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.8
        ));

        onBotFire(muzzlePos, targetAim);
        this.audio.playBotShoot();
      }
    } else {
      // Peaceful patrol around spawn territory
      this.patrolTimer -= dt;
      if (this.patrolTimer <= 0) {
        this.patrolTimer = 4.0 + Math.random() * 4.0;
        const patrolRadius = 15;
        this.patrolTarget.set(
          this.spawnOrigin.x + (Math.random() - 0.5) * patrolRadius * 2,
          0,
          this.spawnOrigin.z + (Math.random() - 0.5) * patrolRadius * 2
        );
      }

      const distToPatrol = Math.hypot(
        this.patrolTarget.x - this.position.x,
        this.patrolTarget.z - this.position.z
      );

      if (distToPatrol > 1.5) {
        isWalking = true;
        const angle = Math.atan2(
          this.patrolTarget.x - this.position.x,
          this.patrolTarget.z - this.position.z
        );
        this.rotationY = angle;

        const speed = 2.2;
        this.position.x += Math.sin(angle) * speed * dt;
        this.position.z += Math.cos(angle) * speed * dt;
        this.position.y = this.world.getTerrainHeight(this.position.x, this.position.z);
      }
    }

    // Update Transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // Leg & Arm Walk Animation
    if (isWalking) {
      this.walkCycleTime += dt * 8;
      const legSwing = Math.sin(this.walkCycleTime) * 0.45;
      this.leftLeg.rotation.x = legSwing;
      this.rightLeg.rotation.x = -legSwing;
      this.leftArm.rotation.x = -legSwing * 0.6;
      this.rightArm.rotation.x = legSwing * 0.3; // Holds gun raised
    } else {
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      this.leftArm.rotation.x = 0.1;
      this.rightArm.rotation.x = -0.2; // weapon aimed
    }
  }

  public reset() {
    this.health = this.maxHealth;
    this.isAlive = true;
    this.isAggro = false;
    this.position.copy(this.spawnOrigin);
    this.position.y = this.world.getTerrainHeight(this.spawnOrigin.x, this.spawnOrigin.z);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.visible = true;
    this.healthBarSprite.visible = true;
    this.updateHealthBarTexture();
  }
}

export class BotManager {
  public bots: Bot[] = [];
  public projectiles: BotProjectile[] = [];
  public floatingDamages: FloatingDamage[] = [];

  private world: IslandWorld;
  private audio: AudioManager;

  constructor(world: IslandWorld, audio: AudioManager) {
    this.world = world;
    this.audio = audio;
    this.spawnAllBots();
  }

  public spawnAllBots() {
    // Clear any existing
    for (const b of this.bots) {
      this.world.scene.remove(b.mesh);
    }
    this.bots = [];

    // 5 Guaranteed visible spawn coordinates across island zones
    const botConfigs = [
      { id: 'bot-01', name: 'NOOB-01 (Striker)', pos: new THREE.Vector3(22, 0, 22) },   // Radar Hill Slope
      { id: 'bot-02', name: 'NOOB-02 (Phantom)', pos: new THREE.Vector3(-38, 0, -12) }, // Bunker 04 Entrance
      { id: 'bot-03', name: 'NOOB-03 (Vanguard)', pos: new THREE.Vector3(48, 0, -28) }, // Coastal Harbor Road
      { id: 'bot-04', name: 'NOOB-04 (Apex)', pos: new THREE.Vector3(-16, 0, 48) },    // Crash Site Meadow
      { id: 'bot-05', name: 'NOOB-05 (Reaper)', pos: new THREE.Vector3(4, 0, -18) },    // Center Tactical Barricades
    ];

    for (const cfg of botConfigs) {
      const bot = new Bot(cfg.id, cfg.name, cfg.pos, this.world, this.audio);
      this.bots.push(bot);
    }
  }

  public handleBotFire = (fromPos: THREE.Vector3, toPos: THREE.Vector3) => {
    // Red energy projectile
    const geo = new THREE.SphereGeometry(0.18, 6, 6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff2222 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(fromPos);
    this.world.scene.add(mesh);

    const dir = toPos.clone().sub(fromPos).normalize();
    const speed = 42; // projectile m/s

    this.projectiles.push({
      mesh,
      position: fromPos.clone(),
      sourcePos: fromPos.clone(),
      velocity: dir.multiplyScalar(speed),
      damage: 10 + Math.floor(Math.random() * 6), // 10-15 damage
      age: 0,
      maxAge: 2.5,
    });
  };

  public spawnFloatingDamageText(damage: number, hitPos: THREE.Vector3, isHeadshot: boolean = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.font = isHeadshot ? 'bold 32px monospace' : 'bold 36px monospace';
    ctx.fillStyle = isHeadshot ? '#facc15' : '#ff3333';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.textAlign = 'center';
    const text = isHeadshot ? `CRIT -${damage}` : `-${damage}`;
    ctx.strokeText(text, 80, 44);
    ctx.fillText(text, 80, 44);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.copy(hitPos).add(new THREE.Vector3(0, 0.8, 0));
    sprite.scale.set(1.0, 0.45, 1);
    this.world.scene.add(sprite);

    this.floatingDamages.push({
      textMesh: sprite,
      position: sprite.position.clone(),
      age: 0,
      maxAge: 0.8,
    });
  }

  private botSkirmishTimer: number = 0;

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    onPlayerHit: (damage: number, sourcePos?: THREE.Vector3) => void,
    onBotSkirmishEliminated?: (killerName: string, victimName: string, weapon: string) => void
  ) {
    // Update Bots
    for (const bot of this.bots) {
      bot.update(dt, playerPos, this.handleBotFire);
    }

    // Periodic battle royale background skirmish between bots
    this.botSkirmishTimer += dt;
    if (this.botSkirmishTimer >= 18) {
      this.botSkirmishTimer = 0;
      const aliveBots = this.bots.filter((b) => b.isAlive);
      if (aliveBots.length >= 2) {
        // Find a bot far enough from the player
        const distantBots = aliveBots.filter((b) => b.position.distanceTo(playerPos) > 30);
        if (distantBots.length > 0) {
          const victim = distantBots[Math.floor(Math.random() * distantBots.length)];
          const killers = aliveBots.filter((b) => b.id !== victim.id);
          const killer = killers[Math.floor(Math.random() * killers.length)];
          victim.takeDamage(100);
          const weapons = ['AR-M4', 'Shotgun', 'Sniper-X', 'Safe Zone'];
          const chosenWep = weapons[Math.floor(Math.random() * weapons.length)];
          if (onBotSkirmishEliminated && killer) {
            onBotSkirmishEliminated(killer.name, victim.name, chosenWep);
          }
        }
      }
    }

    // Update Bot Projectiles & Check Player Collision
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.age += dt;

      proj.position.addScaledVector(proj.velocity, dt);
      proj.mesh.position.copy(proj.position);

      // Check collision with player
      const playerCenter = playerPos.clone().add(new THREE.Vector3(0, 1.1, 0));
      const distToPlayer = proj.position.distanceTo(playerCenter);

      if (distToPlayer < 1.1) {
        // Player was hit! Provide source position for directional damage indicator
        onPlayerHit(proj.damage, proj.sourcePos);
        this.audio.playHurt();

        // Cleanup projectile
        this.world.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
        continue;
      }

      // Lifespan or ground collision
      const groundAtProj = this.world.getTerrainHeight(proj.position.x, proj.position.z);
      if (proj.age >= proj.maxAge || proj.position.y <= groundAtProj) {
        this.world.scene.remove(proj.mesh);
        proj.mesh.geometry.dispose();
        (proj.mesh.material as THREE.Material).dispose();
        this.projectiles.splice(i, 1);
      }
    }

    // Update floating damage texts
    for (let i = this.floatingDamages.length - 1; i >= 0; i--) {
      const fd = this.floatingDamages[i];
      fd.age += dt;
      fd.position.y += dt * 1.2; // Float up
      fd.textMesh.position.copy(fd.position);

      const mat = fd.textMesh.material;
      mat.opacity = Math.max(0, 1 - fd.age / fd.maxAge);

      if (fd.age >= fd.maxAge) {
        this.world.scene.remove(fd.textMesh);
        fd.textMesh.geometry.dispose();
        mat.dispose();
        this.floatingDamages.splice(i, 1);
      }
    }
  }

  /**
   * Raycast or distance test against all alive bots from a player weapon shot
   */
  public checkPlayerRayHit(
    rayOrigin: THREE.Vector3,
    rayDirection: THREE.Vector3,
    damage: number
  ): {
    hit: boolean;
    botName?: string;
    eliminated: boolean;
    damageDealt: number;
    isHeadshot: boolean;
    hitPoint: THREE.Vector3;
  } {
    let closestDist = Infinity;
    let hitBot: Bot | null = null;
    let hitPoint = new THREE.Vector3();

    const ray = new THREE.Ray(rayOrigin, rayDirection);

    for (const bot of this.bots) {
      if (!bot.isAlive) continue;

      // Bot bounding sphere (1.1m radius around bot center)
      const botCenter = bot.position.clone().add(new THREE.Vector3(0, 1.1, 0));
      const sphere = new THREE.Sphere(botCenter, 1.1);

      const intersect = ray.intersectSphere(sphere, new THREE.Vector3());
      if (intersect) {
        const dist = rayOrigin.distanceTo(intersect);
        if (dist < closestDist) {
          closestDist = dist;
          hitBot = bot;
          hitPoint.copy(intersect);
        }
      }
    }

    if (hitBot) {
      // Check headshot (head area is above y + 1.35)
      const isHeadshot = hitPoint.y > hitBot.position.y + 1.35;
      const effectiveDamage = isHeadshot ? Math.round(damage * 1.8) : damage;

      this.audio.playHit();
      this.spawnFloatingDamageText(effectiveDamage, hitPoint, isHeadshot);
      const eliminated = hitBot.takeDamage(effectiveDamage);
      return {
        hit: true,
        botName: hitBot.name,
        eliminated,
        damageDealt: effectiveDamage,
        isHeadshot,
        hitPoint,
      };
    }

    return {
      hit: false,
      eliminated: false,
      damageDealt: 0,
      isHeadshot: false,
      hitPoint: new THREE.Vector3(),
    };
  }

  public getAliveBotCount(): number {
    return this.bots.filter((b) => b.isAlive).length;
  }

  public getBotInfoList(playerPos: THREE.Vector3): BotInfo[] {
    return this.bots.map((b) => ({
      id: b.id,
      name: b.name,
      health: b.health,
      maxHealth: b.maxHealth,
      isAlive: b.isAlive,
      position: { x: b.position.x, y: b.position.y, z: b.position.z },
      distanceToPlayer: Math.round(b.position.distanceTo(playerPos)),
    }));
  }

  public resetAll() {
    // Clear projectiles
    for (const p of this.projectiles) {
      this.world.scene.remove(p.mesh);
    }
    this.projectiles = [];

    // Clear floating damages
    for (const f of this.floatingDamages) {
      this.world.scene.remove(f.textMesh);
    }
    this.floatingDamages = [];

    // Reset each bot
    for (const b of this.bots) {
      b.reset();
    }
  }
}
