export interface ScriptInfo {
  filename: string;
  targetEntity: string;
  purpose: string;
  attributes: string[];
  code: string;
}

export const PLAYCANVAS_SCRIPTS: ScriptInfo[] = [
  {
    filename: 'player-controller.js',
    targetEntity: 'Player (Root)',
    purpose: 'Handles third-person player movement, sprint/crouch speeds, jump impulse, camera-relative heading, and gravity.',
    attributes: [
      'walkSpeed (Number: 4.8)',
      'sprintSpeed (Number: 7.8)',
      'crouchSpeed (Number: 2.4)',
      'jumpImpulse (Number: 7.5)',
      'gravity (Number: -20.0)',
      'cameraEntity (Entity: Camera)',
    ],
    code: `// player-controller.js
var PlayerController = pc.createScript('playerController');
PlayerController.attributes.add('walkSpeed', { type: 'number', default: 4.8 });
PlayerController.attributes.add('sprintSpeed', { type: 'number', default: 7.8 });
PlayerController.attributes.add('crouchSpeed', { type: 'number', default: 2.4 });
PlayerController.attributes.add('jumpImpulse', { type: 'number', default: 7.5 });
PlayerController.attributes.add('gravity', { type: 'number', default: -20.0 });
PlayerController.attributes.add('cameraEntity', { type: 'entity' });

PlayerController.prototype.initialize = function() {
    this.velocity = new pc.Vec3();
    this.isGrounded = true;
    this.inputVector = new pc.Vec2(0, 0);
    this.app.on('mobile:move', (x, y) => this.inputVector.set(x, y), this);
    this.app.on('mobile:jump', () => { if(this.isGrounded) { this.velocity.y = this.jumpImpulse; this.isGrounded = false; } }, this);
};`,
  },
  {
    filename: 'third-person-camera.js',
    targetEntity: 'Camera Entity',
    purpose: 'Orbit chase camera following the player with smooth interpolation, touch swipe angle steering, and wall clearance.',
    attributes: [
      'targetEntity (Entity: Player)',
      'distance (Number: 4.2)',
      'heightOffset (Number: 1.5)',
      'sensitivity (Number: 0.18)',
    ],
    code: `// third-person-camera.js
var ThirdPersonCamera = pc.createScript('thirdPersonCamera');
ThirdPersonCamera.attributes.add('targetEntity', { type: 'entity' });
ThirdPersonCamera.attributes.add('distance', { type: 'number', default: 4.2 });
ThirdPersonCamera.attributes.add('heightOffset', { type: 'number', default: 1.5 });
ThirdPersonCamera.attributes.add('sensitivity', { type: 'number', default: 0.18 });

ThirdPersonCamera.prototype.initialize = function() {
    this.yaw = 0;
    this.pitch = 15;
    this.currentTarget = new pc.Vec3();
    this.app.on('mobile:look', (dx, dy) => {
        this.yaw -= dx * this.sensitivity;
        this.pitch = pc.math.clamp(this.pitch + dy * this.sensitivity, -25, 65);
    }, this);
};`,
  },
  {
    filename: 'mobile-touch-controls.js',
    targetEntity: 'UI / Input Manager',
    purpose: 'Dual-zone multi-touch screen handler: left half creates a virtual analog stick, right half tracks swipe rotation.',
    attributes: [
      'maxRadius (Number: 60px)',
    ],
    code: `// mobile-touch-controls.js
var MobileTouchControls = pc.createScript('mobileTouchControls');
MobileTouchControls.prototype.initialize = function() {
    this.joystickId = null;
    this.lookId = null;
    this.joystickBase = new pc.Vec2();
    this.lastLook = new pc.Vec2();
    var touch = this.app.touch;
    if (touch) {
        touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        touch.on(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
    }
};`,
  },
  {
    filename: 'island-generator.js',
    targetEntity: 'Island Root Entity',
    purpose: 'Generates the compact island terrain, sets up landmark positions (Radar, Bunker, Outpost, Crash site), and boundary colliders.',
    attributes: [
      'islandRadius (Number: 120)',
    ],
    code: `// island-generator.js
var IslandGenerator = pc.createScript('islandGenerator');
IslandGenerator.attributes.add('islandRadius', { type: 'number', default: 120 });
IslandGenerator.prototype.initialize = function() {
    // Spawns terrain heightmap mesh and boundary forcefield
};`,
  },
];

export const PHASE_ROADMAP = [
  {
    phase: 1,
    title: 'Phase 1: 3D Island & Playable Character',
    status: 'COMPLETED & PLAYABLE',
    deliverables: [
      '240m Compact Combat Island with procedural height variations and biomes (Sand beaches, Grass meadows, Rocky hills).',
      '4 Primary Landmarks for visual navigation (Radar Alpha Tower, Bunker 04, Coastal Outpost Harbor, Crash Site Bravo).',
      'Collisions for trees, boulders, cargo containers, bunkers, and tactical cover barriers.',
      'Fully articulated tactical operator player character with idle, walk, run, jump, and crouch animations.',
      'Third-person follow camera with smooth spherical interpolation and obstacle clearance.',
      'Atmospheric daylight lighting, directional sunlight with shadow maps, and exponential distance fog.',
    ],
  },
  {
    phase: 2,
    title: 'Phase 2: Mobile Movement & Camera Touch Controls',
    status: 'COMPLETED & PLAYABLE',
    deliverables: [
      'Multi-touch dynamic analog joystick on left thumb zone (responsive at 0-1 magnitude).',
      'Camera-look swipe touchpad on right thumb zone with adjustable sensitivity.',
      'Dedicated tactile action buttons (Jump, Crouch, Sprint toggle) optimized for thumbs (>=48px touch targets).',
      'Tactical landscape HUD with compass azimuth, minimap radar showing player heading & landmarks, and stance badges.',
      'FPS, frame-time, draw-calls real-time performance monitor.',
    ],
  },
  {
    phase: 3,
    title: 'Phase 3: Collectible Equipment & Practice Targets',
    status: 'NEXT PHASE READY',
    deliverables: [
      'Collectible fictional blasters (Plasma Carbine, Arc Beam Rifle, Scatter Pulse).',
      'Loot crates scattered around landmarks with glowing rarity tiers.',
      'Interactive target dummies at the Bunker 04 shooting range.',
    ],
  },
  {
    phase: 4,
    title: 'Phase 4: Real Multiplayer Networking & Player Sync',
    status: 'ARCHITECTURE PREPARED',
    deliverables: [
      'WebSocket authoritative match server (Express + ws).',
      'Player room lobbies (Create Room, Join via Room Code).',
      'State interpolation (20Hz server tick, 60fps client interpolation) for 2-8 players.',
    ],
  },
  {
    phase: 5,
    title: 'Phase 5: Server-Authoritative Combat & Elimination',
    status: 'PLANNED',
    deliverables: [
      'Server-validated raycast/projectile hit registration.',
      'Health & shield damage calculations with elimination spectator mode.',
    ],
  },
  {
    phase: 6,
    title: 'Phase 6: Shrinking Safe Zone & Victory Screen',
    status: 'PLANNED',
    deliverables: [
      'Server-timed safe circle contraction with non-graphic electric storm damage.',
      'Last-player-standing celebration banner and match summary stats.',
    ],
  },
];
