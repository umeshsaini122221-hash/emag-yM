import * as THREE from 'three';
import { PlayerStance, PlayerStats } from '../types';
import { AudioManager } from './AudioManager';
import { IslandWorld } from './IslandWorld';

export class CharacterController {
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0; // heading in radians
  public stance: PlayerStance = 'standing';
  public isGrounded: boolean = true;

  // Visual rig parts for procedural animation
  private torso!: THREE.Mesh;
  private head!: THREE.Group;
  private visor!: THREE.Mesh;
  private leftArmGroup!: THREE.Group;
  private rightArmGroup!: THREE.Group;
  private leftLegGroup!: THREE.Group;
  private rightLegGroup!: THREE.Group;
  private backpack!: THREE.Mesh;

  // Animation phase
  private walkCycleTime: number = 0;
  private footstepTimer: number = 0;

  // Physics constants
  private gravity: number = -22.0;
  private walkSpeed: number = 4.8;
  private sprintSpeed: number = 7.8;
  private crouchSpeed: number = 2.4;
  private jumpForce: number = 7.8;
  private playerRadius: number = 0.45;
  private standingHeight: number = 1.85;
  private crouchingHeight: number = 1.25;

  // Stats
  public health: number = 100;
  public maxHealth: number = 100;
  public armor: number = 75;
  public maxArmor: number = 100;
  public kills: number = 0;
  public medkitsCount: number = 2;
  public botProtectionActive: boolean = false;

  private suitMat!: THREE.MeshStandardMaterial;
  private armorPlateMat!: THREE.MeshStandardMaterial;
  private visorMat!: THREE.MeshStandardMaterial;
  private backpackMat!: THREE.MeshStandardMaterial;

  private world: IslandWorld;
  private audio: AudioManager;

  constructor(world: IslandWorld, audio: AudioManager, startPosition?: THREE.Vector3) {
    this.world = world;
    this.audio = audio;

    const spawnX = startPosition?.x ?? 0;
    const spawnZ = startPosition?.z ?? 15;
    const spawnY = this.world.getTerrainHeight(spawnX, spawnZ);
    this.position = new THREE.Vector3(spawnX, spawnY, spawnZ);

    this.mesh = new THREE.Group();
    this.buildCharacterRig();
    this.mesh.position.copy(this.position);
    this.world.scene.add(this.mesh);
  }

  private buildCharacterRig() {
    // Color palette for high-tech operator
    this.suitMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
      metalness: 0.3,
    });
    this.armorPlateMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.5,
    });
    this.visorMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Glowing electric cyan visor
      emissive: 0x06b6d4,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    });
    this.backpackMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
      metalness: 0.4,
    });

    const suitMat = this.suitMat;
    const armorPlateMat = this.armorPlateMat;
    const visorMat = this.visorMat;
    const backpackMat = this.backpackMat;

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.32);
    this.torso = new THREE.Mesh(torsoGeo, suitMat);
    this.torso.position.y = 1.15;
    this.torso.castShadow = true;
    this.torso.receiveShadow = true;
    this.mesh.add(this.torso);

    // Chest armor plate
    const chestPlate = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.42, 0.12),
      armorPlateMat
    );
    chestPlate.position.set(0, 0.08, 0.16);
    chestPlate.castShadow = true;
    this.torso.add(chestPlate);

    // 2. Tactical Backpack
    const packGeo = new THREE.BoxGeometry(0.42, 0.5, 0.22);
    this.backpack = new THREE.Mesh(packGeo, backpackMat);
    this.backpack.position.set(0, 0.05, -0.22);
    this.backpack.castShadow = true;
    this.torso.add(this.backpack);

    // Battery core light on pack
    const coreLight = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.06, 0.04),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    coreLight.position.set(0, 0.12, -0.12);
    this.backpack.add(coreLight);

    // 3. Head & Helmet
    this.head = new THREE.Group();
    this.head.position.set(0, 1.62, 0);

    const helmetGeo = new THREE.BoxGeometry(0.36, 0.36, 0.38);
    const helmet = new THREE.Mesh(helmetGeo, suitMat);
    helmet.castShadow = true;
    this.head.add(helmet);

    // Tactical Visor
    const visorGeo = new THREE.BoxGeometry(0.32, 0.12, 0.1);
    this.visor = new THREE.Mesh(visorGeo, visorMat);
    this.visor.position.set(0, 0.04, 0.17);
    this.head.add(this.visor);

    this.mesh.add(this.head);

    // 4. Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.55, 0.16);

    // Left Arm
    this.leftArmGroup = new THREE.Group();
    this.leftArmGroup.position.set(-0.38, 1.35, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, suitMat);
    leftArmMesh.position.y = -0.25;
    leftArmMesh.castShadow = true;
    this.leftArmGroup.add(leftArmMesh);
    this.mesh.add(this.leftArmGroup);

    // Right Arm
    this.rightArmGroup = new THREE.Group();
    this.rightArmGroup.position.set(0.38, 1.35, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, suitMat);
    rightArmMesh.position.y = -0.25;
    rightArmMesh.castShadow = true;
    this.rightArmGroup.add(rightArmMesh);
    this.mesh.add(this.rightArmGroup);

    // 5. Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.68, 0.2);

    // Left Leg
    this.leftLegGroup = new THREE.Group();
    this.leftLegGroup.position.set(-0.16, 0.75, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, suitMat);
    leftLegMesh.position.y = -0.32;
    leftLegMesh.castShadow = true;
    this.leftLegGroup.add(leftLegMesh);
    this.mesh.add(this.leftLegGroup);

    // Right Leg
    this.rightLegGroup = new THREE.Group();
    this.rightLegGroup.position.set(0.16, 0.75, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, suitMat);
    rightLegMesh.position.y = -0.32;
    rightLegMesh.castShadow = true;
    this.rightLegGroup.add(rightLegMesh);
    this.mesh.add(this.rightLegGroup);
  }

  /**
   * Main movement update called every frame
   */
  public update(
    dt: number,
    moveInput: { x: number; y: number },
    cameraYaw: number,
    actions: { jump: boolean; crouch: boolean; sprint: boolean }
  ) {
    const isMoving = Math.hypot(moveInput.x, moveInput.y) > 0.1;

    // 1. Determine Stance & Target Speed
    let targetSpeed = this.walkSpeed;
    if (actions.crouch) {
      this.stance = 'crouching';
      targetSpeed = this.crouchSpeed;
    } else if (actions.sprint && isMoving) {
      this.stance = 'sprinting';
      targetSpeed = this.sprintSpeed;
    } else if (!this.isGrounded) {
      this.stance = 'jumping';
    } else {
      this.stance = 'standing';
      targetSpeed = this.walkSpeed;
    }

    // 2. Compute Movement Vector aligned with Camera Yaw
    // Camera forward vector in XZ plane (looking from camera towards target):
    // Forward = (-sin(cameraYaw), -cos(cameraYaw))
    // Camera right vector in XZ plane:
    // Right = (cos(cameraYaw), -sin(cameraYaw))
    // Joystick UP (moveInput.y > 0) -> move forward into view
    // Joystick DOWN (moveInput.y < 0) -> move backward towards camera
    // Joystick RIGHT (moveInput.x > 0) -> move right
    // Joystick LEFT (moveInput.x < 0) -> move left
    let desiredMoveX = 0;
    let desiredMoveZ = 0;

    if (isMoving) {
      // Input magnitude clamped to 1.0
      const mag = Math.min(1.0, Math.hypot(moveInput.x, moveInput.y));
      const inX = moveInput.x / (mag || 1);
      const inY = moveInput.y / (mag || 1);

      // Desired world-space movement direction: inY * Forward + inX * Right
      const dirX = inX * Math.cos(cameraYaw) - inY * Math.sin(cameraYaw);
      const dirZ = -inX * Math.sin(cameraYaw) - inY * Math.cos(cameraYaw);

      desiredMoveX = dirX * targetSpeed * mag;
      desiredMoveZ = dirZ * targetSpeed * mag;

      // Smoothly orient player body towards movement heading
      // Mesh default faces +Z, so targetAngle is atan2(dirX, dirZ)
      const targetAngle = Math.atan2(dirX, dirZ);
      const angleDiff = Math.atan2(
        Math.sin(targetAngle - this.rotationY),
        Math.cos(targetAngle - this.rotationY)
      );
      this.rotationY += angleDiff * Math.min(1.0, dt * 14);
    }

    // 3. Horizontal Velocity Interpolation (Responsive Acceleration & Deceleration)
    const accelRate = this.isGrounded ? 18 : 6;
    this.velocity.x = THREE.MathUtils.lerp(this.velocity.x, desiredMoveX, dt * accelRate);
    this.velocity.z = THREE.MathUtils.lerp(this.velocity.z, desiredMoveZ, dt * accelRate);

    // 4. Jump & Gravity
    const currentTerrainHeight = this.world.getTerrainHeight(this.position.x, this.position.z);

    if (this.isGrounded) {
      if (actions.jump && this.stance !== 'crouching') {
        this.velocity.y = 8.5; // Upward jump impulse
        this.isGrounded = false;
        this.stance = 'jumping';
        this.audio.playJump();
      } else {
        this.velocity.y = 0;
      }
    } else {
      this.velocity.y += this.gravity * dt;
    }

    // 5. Integrate Position
    const nextPos = this.position.clone();
    nextPos.x += this.velocity.x * dt;
    nextPos.z += this.velocity.z * dt;
    nextPos.y += this.velocity.y * dt;

    // 6. Terrain Ground Collision
    const currentHeightCap = this.stance === 'crouching' ? this.crouchingHeight : this.standingHeight;
    const terrainUnderNext = this.world.getTerrainHeight(nextPos.x, nextPos.z);

    if (nextPos.y <= terrainUnderNext) {
      if (this.velocity.y <= 0) {
        if (!this.isGrounded && this.velocity.y < -2.0) {
          this.audio.playLand();
        }
        nextPos.y = terrainUnderNext;
        this.velocity.y = 0;
        this.isGrounded = true;
      }
    } else {
      this.isGrounded = false;
    }

    // 7. World & Static Obstacle Collision Resolution
    const collisionResult = this.world.resolveCollision(nextPos, this.playerRadius, currentHeightCap);
    this.position.copy(collisionResult.position);

    // 8. Update Mesh Transform
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.rotationY;

    // Submerged deep water hazard damage
    if (this.position.y < -0.6) {
      this.takeDamage(dt * 35, 'environment');
    }

    // 9. Footsteps and Animation
    const horizontalSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.animateRig(dt, horizontalSpeed);
  }

  private animateRig(dt: number, speed: number) {
    const isMoving = speed > 0.3 && this.isGrounded;

    if (isMoving) {
      const stepFreq = this.stance === 'sprinting' ? 14 : 9;
      this.walkCycleTime += dt * stepFreq;

      // Leg swings
      const legSwing = Math.sin(this.walkCycleTime) * 0.55;
      this.leftLegGroup.rotation.x = legSwing;
      this.rightLegGroup.rotation.x = -legSwing;

      // Arm swings opposite to legs
      this.leftArmGroup.rotation.x = -legSwing * 0.75;
      this.rightArmGroup.rotation.x = legSwing * 0.75;

      // Subtle torso bounce & lean
      this.torso.position.y = (this.stance === 'crouching' ? 0.75 : 1.15) + Math.abs(Math.sin(this.walkCycleTime)) * 0.05;
      this.torso.rotation.x = (speed / this.sprintSpeed) * 0.12;

      // Footstep audio trigger
      this.footstepTimer += dt;
      const stepInterval = this.stance === 'sprinting' ? 0.28 : 0.42;
      if (this.footstepTimer >= stepInterval) {
        this.audio.playFootstep(this.stance === 'sprinting');
        this.footstepTimer = 0;
      }
    } else if (!this.isGrounded) {
      // In air jump pose
      this.leftLegGroup.rotation.x = 0.35;
      this.rightLegGroup.rotation.x = -0.2;
      this.leftArmGroup.rotation.x = -0.4;
      this.rightArmGroup.rotation.x = -0.4;
      this.torso.position.y = 1.15;
    } else {
      // Idle breathing sway
      const idleTime = performance.now() * 0.003;
      const breathe = Math.sin(idleTime) * 0.02;

      const baseTorsoY = this.stance === 'crouching' ? 0.75 : 1.15;
      this.torso.position.y = baseTorsoY + breathe;
      this.head.position.y = (this.stance === 'crouching' ? 1.2 : 1.62) + breathe;

      this.leftLegGroup.rotation.x = 0;
      this.rightLegGroup.rotation.x = 0;
      this.leftArmGroup.rotation.x = 0.08 + breathe;
      this.rightArmGroup.rotation.x = 0.08 + breathe;
      this.torso.rotation.x = 0;
      this.footstepTimer = 0;
    }

    // Crouch crouch stance posture
    if (this.stance === 'crouching') {
      this.mesh.scale.set(1.0, 0.78, 1.0);
    } else {
      this.mesh.scale.set(1.0, 1.0, 1.0);
    }
  }

  public takeDamage(amount: number, source: 'bot' | 'player' | 'environment' = 'bot') {
    if (this.health <= 0) return;
    if (this.armor > 0) {
      const absorbed = Math.min(this.armor, amount * 0.6);
      this.armor = Math.max(0, this.armor - absorbed);
      amount -= absorbed;
    }

    if (source === 'bot') {
      // RULE: Enemy bot attacks can reduce player health, but MUST NEVER eliminate the real player!
      // Clamp health to a minimum of 1 HP when damage comes from bots.
      const targetHealth = this.health - amount;
      if (targetHealth <= 1) {
        this.health = 1;
        this.botProtectionActive = true;
      } else {
        this.health = targetHealth;
      }
    } else {
      // Real player attacks or environmental hazards eliminate normally
      this.health = Math.max(0, this.health - amount);
      this.botProtectionActive = false;
    }
  }

  public heal(amount: number = 45): boolean {
    if (this.health >= this.maxHealth || this.medkitsCount <= 0) return false;
    this.medkitsCount--;
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.botProtectionActive = false;
    this.audio.playHeal();
    return true;
  }

  public addHealth(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    if (this.health > 15) {
      this.botProtectionActive = false;
    }
  }

  public resetMatchStats() {
    this.health = this.maxHealth;
    this.armor = this.maxArmor;
    this.kills = 0;
    this.medkitsCount = 2;
    this.botProtectionActive = false;
  }

  public applyOutfit(colorSuit: number, colorArmor: number, colorVisor: number) {
    if (this.suitMat) {
      this.suitMat.color.setHex(colorSuit);
    }
    if (this.armorPlateMat) {
      this.armorPlateMat.color.setHex(colorArmor);
    }
    if (this.visorMat) {
      this.visorMat.color.setHex(colorVisor);
      this.visorMat.emissive.setHex(colorVisor);
    }
  }

  public applyBackpack(colorBackpack: number) {
    if (this.backpackMat) {
      this.backpackMat.color.setHex(colorBackpack);
    }
  }

  public getStats(weaponExtra?: {
    equippedWeapon: 'rifle' | 'shotgun';
    ammo: number;
    maxAmmo: number;
    reserveAmmo: number;
    aliveBots: number;
    totalBots: number;
    isAiming: boolean;
    isReloading: boolean;
    selectedMap?: 'frontier' | 'india' | 'rajasthan';
    rank?: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Master' | 'Legend';
    rankPoints?: number;
    credits?: number;
    diamonds?: number;
  }): PlayerStats {
    const headingDeg = (Math.round(THREE.MathUtils.radToDeg(-this.rotationY + Math.PI)) + 360) % 360;
    return {
      health: this.health,
      maxHealth: this.maxHealth,
      armor: this.armor,
      maxArmor: this.maxArmor,
      speed: Math.hypot(this.velocity.x, this.velocity.z),
      stance: this.stance,
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      heading: headingDeg,
      groundHeight: this.world.getTerrainHeight(this.position.x, this.position.z),
      isGrounded: this.isGrounded,
      equippedWeapon: weaponExtra?.equippedWeapon ?? 'rifle',
      ammo: weaponExtra?.ammo ?? 30,
      maxAmmo: weaponExtra?.maxAmmo ?? 30,
      reserveAmmo: weaponExtra?.reserveAmmo ?? 120,
      kills: this.kills,
      aliveBots: weaponExtra?.aliveBots ?? 5,
      totalBots: weaponExtra?.totalBots ?? 5,
      medkitsCount: this.medkitsCount,
      isAiming: weaponExtra?.isAiming ?? false,
      isReloading: weaponExtra?.isReloading ?? false,
      botProtectionActive: this.botProtectionActive || this.health === 1,
      selectedMap: weaponExtra?.selectedMap ?? 'frontier',
      rank: weaponExtra?.rank ?? 'Bronze',
      rankPoints: weaponExtra?.rankPoints ?? 120,
      credits: weaponExtra?.credits ?? 1200,
      diamonds: weaponExtra?.diamonds ?? 50,
    };
  }

  public teleport(x: number, z: number) {
    const y = this.world.getTerrainHeight(x, z);
    this.position.set(x, y, z);
    this.velocity.set(0, 0, 0);
    this.health = this.maxHealth;
    this.armor = this.maxArmor;
    this.mesh.position.copy(this.position);
  }
}
