import * as THREE from 'three';
import { IslandWorld } from './IslandWorld';
import { AudioManager } from './AudioManager';
import { VehicleStats } from '../types';

export class Vehicle {
  public id: string;
  public name: string;
  public mesh: THREE.Group;
  public position: THREE.Vector3;
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public heading: number; // yaw angle in radians
  public speed: number = 0; // forward speed in m/s
  public steerAngle: number = 0; // current wheel steering angle in radians
  public pitch: number = 0; // terrain/suspension pitch
  public roll: number = 0; // terrain/suspension roll

  // Status & gameplay
  public isOccupied: boolean = false;
  public health: number = 300;
  public maxHealth: number = 300;
  public boostAmount: number = 100; // 0 - 100%
  public isBoosting: boolean = false;
  public isBraking: boolean = false;
  public isHonking: boolean = false;
  public enterRadius: number = 3.8;

  // Visual sub-groups for animations
  private chassisGroup: THREE.Group;
  private steeringWheelGroup!: THREE.Group;
  private wheelFLGroup: THREE.Group;
  private wheelFRGroup: THREE.Group;
  private wheelRLGroup: THREE.Group;
  private wheelRRGroup: THREE.Group;
  private wheelSpinAngle: number = 0;
  private tailLightMat!: THREE.MeshStandardMaterial;
  private nitroFlameLeft!: THREE.Mesh;
  private nitroFlameRight!: THREE.Mesh;
  private headlightLeft!: THREE.Mesh;
  private headlightRight!: THREE.Mesh;
  private smokeEmitterGroup!: THREE.Group;
  private smokeParticles: Array<{ mesh: THREE.Mesh; life: number; maxLife: number; velocity: THREE.Vector3 }> = [];

  // Wheel offset constants
  private readonly wheelTrack: number = 1.7; // distance between left and right wheels
  private readonly wheelBase: number = 2.4; // distance between front and rear axles
  private readonly wheelRadius: number = 0.42;

  // Handling constants
  private readonly maxSteerAngle: number = 0.58; // ~33 degrees
  private readonly accelRate: number = 17.5; // m/s^2
  private readonly boostAccelRate: number = 28.0;
  private readonly brakeRate: number = 22.0;
  private readonly reverseAccelRate: number = 8.5;
  private readonly coastFriction: number = 4.2;
  private readonly maxForwardSpeed: number = 20.0; // ~72 km/h
  private readonly maxBoostSpeed: number = 28.5; // ~102 km/h
  private readonly maxReverseSpeed: number = 7.0; // ~25 km/h

  private audio: AudioManager;

  constructor(
    id: string,
    name: string,
    startPos: THREE.Vector3,
    initialHeading: number,
    scene: THREE.Scene,
    audio: AudioManager
  ) {
    this.id = id;
    this.name = name;
    this.audio = audio;
    this.heading = initialHeading;
    this.position = startPos.clone();

    this.mesh = new THREE.Group();
    this.chassisGroup = new THREE.Group();
    this.mesh.add(this.chassisGroup);

    this.wheelFLGroup = new THREE.Group();
    this.wheelFRGroup = new THREE.Group();
    this.wheelRLGroup = new THREE.Group();
    this.wheelRRGroup = new THREE.Group();

    this.buildVehicleVisuals();
    this.mesh.position.copy(this.position);
    this.mesh.rotation.y = this.heading;

    scene.add(this.mesh);
  }

  private buildVehicleVisuals() {
    // --- MATERIALS ---
    const armorMat = new THREE.MeshStandardMaterial({
      color: 0x242d38, // Tactical charcoal stealth
      metalness: 0.6,
      roughness: 0.35,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b, // Amber tactical highlight
      metalness: 0.4,
      roughness: 0.3,
    });

    const rollCageMat = new THREE.MeshStandardMaterial({
      color: 0xd97706, // High-vis roll cage safety orange/amber
      metalness: 0.7,
      roughness: 0.25,
    });

    const interiorMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.7,
    });

    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.9,
    });

    const tireMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.85,
    });

    const rimMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 0.8,
      roughness: 0.2,
    });

    const headlightMat = new THREE.MeshStandardMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.2,
      roughness: 0.1,
    });

    this.tailLightMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.5,
      roughness: 0.2,
    });

    const nitroMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x22d3ee,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.85,
    });

    // --- 1. CHASSIS / LOWER BODY ---
    // Main tub
    const mainTubGeo = new THREE.BoxGeometry(1.5, 0.45, 2.8);
    const mainTub = new THREE.Mesh(mainTubGeo, armorMat);
    mainTub.position.set(0, 0.5, 0);
    this.chassisGroup.add(mainTub);

    // Front tapered nose
    const noseGeo = new THREE.BoxGeometry(1.3, 0.35, 0.9);
    const nose = new THREE.Mesh(noseGeo, armorMat);
    nose.position.set(0, 0.55, 1.4);
    nose.rotation.x = -0.12;
    this.chassisGroup.add(nose);

    // Tactical side panels with amber accents
    const sidePanelGeo = new THREE.BoxGeometry(0.12, 0.35, 2.2);
    const leftPanel = new THREE.Mesh(sidePanelGeo, accentMat);
    leftPanel.position.set(-0.76, 0.6, 0);
    const rightPanel = new THREE.Mesh(sidePanelGeo, accentMat);
    rightPanel.position.set(0.76, 0.6, 0);
    this.chassisGroup.add(leftPanel, rightPanel);

    // Front tactical bullbar / heavy bumper
    const bumperGeo = new THREE.BoxGeometry(1.6, 0.25, 0.2);
    const bumper = new THREE.Mesh(bumperGeo, rollCageMat);
    bumper.position.set(0, 0.45, 1.95);
    this.chassisGroup.add(bumper);

    const bumperBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 8);
    const bumperBar = new THREE.Mesh(bumperBarGeo, rollCageMat);
    bumperBar.rotation.z = Math.PI / 2;
    bumperBar.position.set(0, 0.7, 1.92);
    this.chassisGroup.add(bumperBar);

    // --- 2. COCKPIT & SEATS ---
    // Floor
    const floorGeo = new THREE.BoxGeometry(1.3, 0.1, 1.5);
    const floor = new THREE.Mesh(floorGeo, interiorMat);
    floor.position.set(0, 0.55, -0.1);
    this.chassisGroup.add(floor);

    // Driver & passenger bucket seats
    const seatGeo = new THREE.BoxGeometry(0.48, 0.55, 0.45);
    const seatBackGeo = new THREE.BoxGeometry(0.48, 0.7, 0.12);
    
    // Driver seat (Left)
    const driverSeat = new THREE.Mesh(seatGeo, interiorMat);
    driverSeat.position.set(-0.35, 0.65, -0.2);
    const driverSeatBack = new THREE.Mesh(seatBackGeo, accentMat);
    driverSeatBack.position.set(-0.35, 1.0, -0.45);
    driverSeatBack.rotation.x = -0.15;
    this.chassisGroup.add(driverSeat, driverSeatBack);

    // Passenger seat (Right)
    const passSeat = new THREE.Mesh(seatGeo, interiorMat);
    passSeat.position.set(0.35, 0.65, -0.2);
    const passSeatBack = new THREE.Mesh(seatBackGeo, accentMat);
    passSeatBack.position.set(0.35, 1.0, -0.45);
    passSeatBack.rotation.x = -0.15;
    this.chassisGroup.add(passSeat, passSeatBack);

    // Dashboard console
    const dashGeo = new THREE.BoxGeometry(1.1, 0.25, 0.35);
    const dash = new THREE.Mesh(dashGeo, interiorMat);
    dash.position.set(0, 0.95, 0.45);
    this.chassisGroup.add(dash);

    // Glowing cyan digital HUD screen on dash
    const screenGeo = new THREE.PlaneGeometry(0.3, 0.15);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.2,
    });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(-0.35, 1.02, 0.58);
    screen.rotation.x = -0.3;
    this.chassisGroup.add(screen);

    // Steering wheel group
    this.steeringWheelGroup = new THREE.Group();
    this.steeringWheelGroup.position.set(-0.35, 1.0, 0.35);
    this.steeringWheelGroup.rotation.x = 0.5;

    const wheelRimGeo = new THREE.TorusGeometry(0.16, 0.03, 8, 16);
    const wheelCenterGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.04, 8);
    const wheelRim = new THREE.Mesh(wheelRimGeo, interiorMat);
    const wheelCenter = new THREE.Mesh(wheelCenterGeo, accentMat);
    wheelCenter.rotation.x = Math.PI / 2;
    this.steeringWheelGroup.add(wheelRim, wheelCenter);
    this.chassisGroup.add(this.steeringWheelGroup);

    // Windshield frame & glass
    const windshieldGeo = new THREE.PlaneGeometry(1.25, 0.65);
    const windshield = new THREE.Mesh(windshieldGeo, glassMat);
    windshield.position.set(0, 1.25, 0.5);
    windshield.rotation.x = -0.45;
    this.chassisGroup.add(windshield);

    // --- 3. TUBULAR ROLL CAGE ---
    const cageGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8);
    // 4 vertical cage pillars
    const pFL = new THREE.Mesh(cageGeo, rollCageMat);
    pFL.position.set(-0.62, 1.15, 0.5);
    pFL.rotation.x = -0.35;
    const pFR = new THREE.Mesh(cageGeo, rollCageMat);
    pFR.position.set(0.62, 1.15, 0.5);
    pFR.rotation.x = -0.35;

    const pRL = new THREE.Mesh(cageGeo, rollCageMat);
    pRL.position.set(-0.62, 1.15, -0.65);
    const pRR = new THREE.Mesh(cageGeo, rollCageMat);
    pRR.position.set(0.62, 1.15, -0.65);

    this.chassisGroup.add(pFL, pFR, pRL, pRR);

    // Overhead roof bars
    const roofBarLongGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.2, 8);
    const rLeft = new THREE.Mesh(roofBarLongGeo, rollCageMat);
    rLeft.position.set(-0.62, 1.6, -0.05);
    rLeft.rotation.x = Math.PI / 2;
    const rRight = new THREE.Mesh(roofBarLongGeo, rollCageMat);
    rRight.position.set(0.62, 1.6, -0.05);
    rRight.rotation.x = Math.PI / 2;

    const roofCrossGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.24, 8);
    const rCrossFront = new THREE.Mesh(roofCrossGeo, rollCageMat);
    rCrossFront.position.set(0, 1.6, 0.45);
    rCrossFront.rotation.z = Math.PI / 2;
    const rCrossBack = new THREE.Mesh(roofCrossGeo, rollCageMat);
    rCrossBack.position.set(0, 1.6, -0.65);
    rCrossBack.rotation.z = Math.PI / 2;

    this.chassisGroup.add(rLeft, rRight, rCrossFront, rCrossBack);

    // Roof light bar (4 spotlights)
    for (let i = 0; i < 4; i++) {
      const spotGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8);
      const spot = new THREE.Mesh(spotGeo, headlightMat);
      spot.rotation.x = Math.PI / 2;
      spot.position.set(-0.45 + i * 0.3, 1.7, 0.45);
      this.chassisGroup.add(spot);
    }

    // --- 4. LIGHTS (HEADLIGHTS & TAILLIGHTS) ---
    const headGeo = new THREE.BoxGeometry(0.2, 0.12, 0.1);
    this.headlightLeft = new THREE.Mesh(headGeo, headlightMat);
    this.headlightLeft.position.set(-0.5, 0.6, 1.85);
    this.headlightRight = new THREE.Mesh(headGeo, headlightMat);
    this.headlightRight.position.set(0.5, 0.6, 1.85);
    this.chassisGroup.add(this.headlightLeft, this.headlightRight);

    const tailGeo = new THREE.BoxGeometry(0.25, 0.12, 0.08);
    const tailLeft = new THREE.Mesh(tailGeo, this.tailLightMat);
    tailLeft.position.set(-0.55, 0.65, -1.42);
    const tailRight = new THREE.Mesh(tailGeo, this.tailLightMat);
    tailRight.position.set(0.55, 0.65, -1.42);
    this.chassisGroup.add(tailLeft, tailRight);

    // --- 5. EXHAUSTS & NITRO FLAMES ---
    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
    const pipeLeft = new THREE.Mesh(pipeGeo, rimMat);
    pipeLeft.rotation.x = Math.PI / 2;
    pipeLeft.position.set(-0.35, 0.38, -1.48);
    const pipeRight = new THREE.Mesh(pipeGeo, rimMat);
    pipeRight.rotation.x = Math.PI / 2;
    pipeRight.position.set(0.35, 0.38, -1.48);
    this.chassisGroup.add(pipeLeft, pipeRight);

    // Nitro jet flames (grow when boosting)
    const flameGeo = new THREE.ConeGeometry(0.09, 0.6, 8);
    this.nitroFlameLeft = new THREE.Mesh(flameGeo, nitroMat);
    this.nitroFlameLeft.rotation.x = -Math.PI / 2;
    this.nitroFlameLeft.position.set(-0.35, 0.38, -1.9);
    this.nitroFlameLeft.visible = false;

    this.nitroFlameRight = new THREE.Mesh(flameGeo, nitroMat);
    this.nitroFlameRight.rotation.x = -Math.PI / 2;
    this.nitroFlameRight.position.set(0.35, 0.38, -1.9);
    this.nitroFlameRight.visible = false;
    this.chassisGroup.add(this.nitroFlameLeft, this.nitroFlameRight);

    // --- 6. 4 OFF-ROAD WHEELS WITH BRAKE CALIPERS ---
    const buildWheel = (): THREE.Group => {
      const g = new THREE.Group();
      // Outer rubber tire with deep treads
      const tGeo = new THREE.CylinderGeometry(this.wheelRadius, this.wheelRadius, 0.32, 14);
      const tire = new THREE.Mesh(tGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      g.add(tire);

      // Alloy rim
      const rGeo = new THREE.CylinderGeometry(this.wheelRadius * 0.68, this.wheelRadius * 0.68, 0.34, 10);
      const rim = new THREE.Mesh(rGeo, rimMat);
      rim.rotation.z = Math.PI / 2;
      g.add(rim);

      // Center lug cap
      const capGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.36, 6);
      const cap = new THREE.Mesh(capGeo, accentMat);
      cap.rotation.z = Math.PI / 2;
      g.add(cap);

      return g;
    };

    const halfTrack = this.wheelTrack / 2;
    const halfBase = this.wheelBase / 2;

    const wFL = buildWheel();
    this.wheelFLGroup.add(wFL);
    this.wheelFLGroup.position.set(-halfTrack, this.wheelRadius, halfBase);

    const wFR = buildWheel();
    this.wheelFRGroup.add(wFR);
    this.wheelFRGroup.position.set(halfTrack, this.wheelRadius, halfBase);

    const wRL = buildWheel();
    this.wheelRLGroup.add(wRL);
    this.wheelRLGroup.position.set(-halfTrack, this.wheelRadius, -halfBase);

    const wRR = buildWheel();
    this.wheelRRGroup.add(wRR);
    this.wheelRRGroup.position.set(halfTrack, this.wheelRadius, -halfBase);

    this.mesh.add(
      this.wheelFLGroup,
      this.wheelFRGroup,
      this.wheelRLGroup,
      this.wheelRRGroup
    );

    // --- 7. TIRE DUST / SMOKE PARTICLES ---
    this.smokeEmitterGroup = new THREE.Group();
    this.mesh.add(this.smokeEmitterGroup);
  }

  /**
   * Main vehicle physics and animation update step
   */
  public update(
    dt: number,
    input: {
      throttle: number; // -1 (reverse) to 1 (forward)
      steer: number; // -1 (left) to 1 (right)
      handbrake: boolean;
      boost: boolean;
    },
    world: IslandWorld
  ) {
    // 1. Boost Management
    if (this.isOccupied && input.boost && this.boostAmount > 5 && input.throttle > 0) {
      if (!this.isBoosting) {
        this.audio.playTurboBoost();
      }
      this.isBoosting = true;
      this.boostAmount = Math.max(0, this.boostAmount - dt * 26);
    } else {
      this.isBoosting = false;
      // Boost gradually recharges
      this.boostAmount = Math.min(100, this.boostAmount + dt * 14);
    }

    // Toggle Nitro flame visuals
    if (this.nitroFlameLeft && this.nitroFlameRight) {
      this.nitroFlameLeft.visible = this.isBoosting;
      this.nitroFlameRight.visible = this.isBoosting;
      if (this.isBoosting) {
        const flicker = 0.8 + Math.random() * 0.4;
        this.nitroFlameLeft.scale.set(flicker, flicker * 1.2, flicker);
        this.nitroFlameRight.scale.set(flicker, flicker * 1.2, flicker);
      }
    }

    // 2. Throttle & Speed Calculation
    const targetMaxSpeed = this.isBoosting ? this.maxBoostSpeed : this.maxForwardSpeed;
    const accel = this.isBoosting ? this.boostAccelRate : this.accelRate;

    this.isBraking = false;

    if (input.throttle > 0.05) {
      // Forward Drive
      if (this.speed < -0.1) {
        // Braking while in reverse
        this.speed += this.brakeRate * dt;
        this.isBraking = true;
      } else {
        this.speed = Math.min(targetMaxSpeed, this.speed + input.throttle * accel * dt);
      }
    } else if (input.throttle < -0.05) {
      // Reverse or Brake
      if (this.speed > 0.5) {
        // Active Braking
        this.speed = Math.max(0, this.speed - Math.abs(input.throttle) * this.brakeRate * dt);
        this.isBraking = true;
      } else {
        // Reversing
        this.speed = Math.max(-this.maxReverseSpeed, this.speed - this.reverseAccelRate * dt);
      }
    } else {
      // Coasting Friction
      if (Math.abs(this.speed) > 0.1) {
        const decay = Math.sign(this.speed) * this.coastFriction * dt;
        if (Math.abs(decay) >= Math.abs(this.speed)) {
          this.speed = 0;
        } else {
          this.speed -= decay;
        }
      } else {
        this.speed = 0;
      }
    }

    // Handbrake drift / fast deceleration
    if (input.handbrake) {
      this.isBraking = true;
      if (Math.abs(this.speed) > 0.2) {
        this.speed *= Math.max(0, 1 - dt * 4.5);
      }
    }

    // Taillight brake flare
    if (this.tailLightMat) {
      this.tailLightMat.emissiveIntensity = this.isBraking ? 1.8 : 0.4;
    }

    // 3. Steering Angle Calculation
    // Steering tightens at higher speeds for high-speed stability
    const speedRatio = Math.abs(this.speed) / this.maxForwardSpeed;
    const steerLimit = this.maxSteerAngle * (1.0 - speedRatio * 0.45);
    const targetSteer = input.steer * steerLimit;
    this.steerAngle = THREE.MathUtils.lerp(this.steerAngle, targetSteer, dt * 12.0);

    // 4. Heading & Yaw rotation
    if (Math.abs(this.speed) > 0.1) {
      // Vehicle turning: yaw rate is proportional to speed and steer angle
      const turnMultiplier = input.handbrake ? 1.8 : 1.1;
      const turnRate = (this.speed / this.wheelBase) * Math.sin(this.steerAngle) * turnMultiplier;
      this.heading -= turnRate * dt;
    }

    // 5. Update World Position from velocity
    // Forward direction in world coords (with heading in XZ plane)
    const forwardX = -Math.sin(this.heading);
    const forwardZ = -Math.cos(this.heading);

    this.velocity.set(forwardX * this.speed, 0, forwardZ * this.speed);

    const nextX = this.position.x + this.velocity.x * dt;
    const nextZ = this.position.z + this.velocity.z * dt;

    // Check boundary constraint (island limit)
    const distFromCenter = Math.hypot(nextX, nextZ);
    if (distFromCenter < world.islandRadius - 2.0) {
      this.position.x = nextX;
      this.position.z = nextZ;
    } else {
      // Rebound gently from edge barrier
      this.speed *= -0.4;
      this.audio.playVehicleImpact();
    }

    // Check collision against world boxes
    for (const col of world.colliders) {
      if (col.type === 'box') {
        const halfX = col.size.x * 0.5 + 1.2;
        const halfZ = col.size.z * 0.5 + 1.2;
        if (
          Math.abs(this.position.x - col.position.x) < halfX &&
          Math.abs(this.position.z - col.position.z) < halfZ
        ) {
          // Collision occurred! Bounce and slow down
          this.speed *= -0.5;
          this.audio.playVehicleImpact();
          this.position.x -= this.velocity.x * dt * 1.5;
          this.position.z -= this.velocity.z * dt * 1.5;
          break;
        }
      }
    }

    // 6. 4-Wheel Terrain Elevation, Pitch & Roll
    const halfTrack = this.wheelTrack * 0.5;
    const halfBase = this.wheelBase * 0.5;

    // World coords of the 4 wheels based on heading
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);

    const getLocalWorldOffset = (lx: number, lz: number) => ({
      x: this.position.x + (lx * cosH - lz * sinH),
      z: this.position.z + (-lx * sinH - lz * cosH),
    });

    const flCoord = getLocalWorldOffset(-halfTrack, halfBase);
    const frCoord = getLocalWorldOffset(halfTrack, halfBase);
    const rlCoord = getLocalWorldOffset(-halfTrack, -halfBase);
    const rrCoord = getLocalWorldOffset(halfTrack, -halfBase);

    const flH = world.getTerrainHeight(flCoord.x, flCoord.z);
    const frH = world.getTerrainHeight(frCoord.x, frCoord.z);
    const rlH = world.getTerrainHeight(rlCoord.x, rlCoord.z);
    const rrH = world.getTerrainHeight(rrCoord.x, rrCoord.z);

    const avgTerrainH = (flH + frH + rlH + rrH) * 0.25;

    // Smoothly adjust vehicle elevation
    const targetY = avgTerrainH + 0.15;
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, Math.min(1.0, dt * 18.0));

    // Pitch: front vs rear height difference + acceleration squat/dive
    const frontH = (flH + frH) * 0.5;
    const rearH = (rlH + rrH) * 0.5;
    const terrainPitch = Math.atan2(frontH - rearH, this.wheelBase);
    const dynamicSquat = (this.speed / this.maxForwardSpeed) * (this.isBraking ? -0.06 : 0.04);
    const targetPitch = THREE.MathUtils.clamp(terrainPitch + dynamicSquat, -0.45, 0.45);
    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch, dt * 12.0);

    // Roll: left vs right height difference + cornering centrifugal lean
    const leftH = (flH + rlH) * 0.5;
    const rightH = (frH + rrH) * 0.5;
    const terrainRoll = Math.atan2(leftH - rightH, this.wheelTrack);
    const cornerLean = (this.speed / this.maxForwardSpeed) * Math.sin(this.steerAngle) * 0.1;
    const targetRoll = THREE.MathUtils.clamp(terrainRoll - cornerLean, -0.35, 0.35);
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll, dt * 12.0);

    // 7. Update Mesh Transform & Rotations
    this.mesh.position.copy(this.position);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.rotation.y = this.heading;
    this.mesh.rotation.x = this.pitch;
    this.mesh.rotation.z = this.roll;

    // 8. Wheel Visual Animations (Spin and Steer)
    const spinDelta = (this.speed / this.wheelRadius) * dt;
    this.wheelSpinAngle += spinDelta;

    // Front wheels steer + spin
    this.wheelFLGroup.rotation.y = this.steerAngle;
    this.wheelFRGroup.rotation.y = this.steerAngle;

    if (this.wheelFLGroup.children[0]) this.wheelFLGroup.children[0].rotation.x = this.wheelSpinAngle;
    if (this.wheelFRGroup.children[0]) this.wheelFRGroup.children[0].rotation.x = this.wheelSpinAngle;
    if (this.wheelRLGroup.children[0]) this.wheelRLGroup.children[0].rotation.x = this.wheelSpinAngle;
    if (this.wheelRRGroup.children[0]) this.wheelRRGroup.children[0].rotation.x = this.wheelSpinAngle;

    // Interior steering wheel follows steerAngle
    if (this.steeringWheelGroup) {
      this.steeringWheelGroup.rotation.z = -this.steerAngle * 2.2;
    }

    // 9. Audio engine synthesis modulation
    if (this.isOccupied) {
      const speedNorm = Math.abs(this.speed) / this.maxForwardSpeed;
      this.audio.updateVehicleEngine(speedNorm, this.isBoosting);
    }
  }

  public honk() {
    this.isHonking = true;
    this.audio.playVehicleHorn();
    setTimeout(() => {
      this.isHonking = false;
    }, 450);
  }

  public takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.audio.playVehicleImpact();
  }

  public repair(amount: number = 100) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  public getStats(): VehicleStats {
    const kmh = Math.round(Math.abs(this.speed) * 3.6);
    let gear: 'R' | 'N' | 'D' | 'B' = 'N';
    if (this.speed > 0.5) gear = this.isBoosting ? 'B' : 'D';
    else if (this.speed < -0.5) gear = 'R';

    const rpm = Math.min(1.0, (Math.abs(this.speed) / this.maxForwardSpeed) * 0.9 + 0.1);

    return {
      id: this.id,
      name: this.name,
      speedKmh: kmh,
      health: this.health,
      maxHealth: this.maxHealth,
      boostAmount: Math.round(this.boostAmount),
      isBoosting: this.isBoosting,
      isBraking: this.isBraking,
      gear,
      rpm,
      steerAngle: this.steerAngle,
      isOccupied: this.isOccupied,
    };
  }

  public getExitPosition(world: IslandWorld): THREE.Vector3 {
    // Eject to the left side of the vehicle on ground
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);
    const exitOffsetDist = 1.9;

    const exitX = this.position.x - cosH * exitOffsetDist;
    const exitZ = this.position.z + sinH * exitOffsetDist;
    const exitY = world.getTerrainHeight(exitX, exitZ) + 0.1;

    return new THREE.Vector3(exitX, exitY, exitZ);
  }

  public destroy(scene: THREE.Scene) {
    scene.remove(this.mesh);
  }
}
