import * as THREE from 'three';
import { LandmarkInfo, MapId } from '../types';

export interface Collider {
  type: 'box' | 'cylinder';
  position: THREE.Vector3;
  size: THREE.Vector3; // for box: (width, height, depth), for cylinder: (radius, height, radius)
  name?: string;
}

export class IslandWorld {
  public scene: THREE.Scene;
  public islandRadius = 125; // 250m diameter playable combat island
  public colliders: Collider[] = [];
  public landmarks: LandmarkInfo[] = [];
  public currentMapId: MapId = 'frontier';

  private worldGroup: THREE.Group;
  private terrainMesh!: THREE.Mesh;
  private oceanMesh!: THREE.Mesh;
  private oceanMaterial!: THREE.MeshStandardMaterial;
  private boundaryMesh!: THREE.Mesh;
  private animatedProps: Array<{ mesh: THREE.Object3D; update: (dt: number) => void }> = [];

  constructor(scene: THREE.Scene, initialMap: MapId = 'frontier') {
    this.scene = scene;
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.loadMap(initialMap);
  }

  public loadMap(mapId: MapId) {
    this.currentMapId = mapId;

    // Clear existing objects in worldGroup
    while (this.worldGroup.children.length > 0) {
      const obj = this.worldGroup.children[0];
      this.worldGroup.remove(obj);
    }
    this.colliders = [];
    this.landmarks = [];
    this.animatedProps = [];

    // Build common elements
    this.buildOcean();
    this.buildBoundary();
    this.buildTerrain();

    // Build map-specific landmarks & environment
    if (mapId === 'india') {
      this.buildIndiaHeritageMap();
    } else if (mapId === 'rajasthan') {
      this.buildRajasthanDesertMap();
    } else {
      this.buildFrontierMap();
    }

    this.buildTacticalVegetationAndCover();
  }

  /**
   * Continuous mathematical elevation function adapted per map theme
   */
  public getTerrainHeight(x: number, z: number): number {
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > this.islandRadius + 15) {
      return -4.0; // Deep water
    }

    const normalizedDist = distFromCenter / this.islandRadius;
    const islandMask = Math.max(0, 1 - Math.pow(normalizedDist, 2.2));

    if (this.currentMapId === 'india') {
      // Gentle riverside delta with central elevated terrace for the Marble Citadel
      const riverFlow = Math.sin(x * 0.03 + z * 0.02) * 3.5;
      const hills = Math.sin(x * 0.05 + 1.2) * Math.cos(z * 0.04) * 2.8;

      // Elevated grand terrace for Marble Citadel at (0, 15)
      const dCitadel = Math.hypot(x - 0, z - 15);
      const citadelMound = Math.max(0, 1 - dCitadel / 45) * 8.5;

      // Fort rampart ridge at (-45, -25)
      const dFort = Math.hypot(x + 45, z + 25);
      const fortRidge = Math.max(0, 1 - dFort / 35) * 6.0;

      let height = (2.4 + riverFlow + hills + citadelMound + fortRidge) * islandMask;
      if (normalizedDist > 0.86) {
        height = THREE.MathUtils.lerp(height, -1.5, (normalizedDist - 0.86) / 0.14);
      }
      return height;
    } else if (this.currentMapId === 'rajasthan') {
      // Rolling sand dunes & sandstone ridges
      const dunes = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 6.5;
      const duneRipples = Math.sin(x * 0.08 - z * 0.05) * 2.4;

      // Mesa plateau for Amber Palace at (20, 15)
      const dPalace = Math.hypot(x - 20, z - 15);
      const palaceMesa = Math.max(0, 1 - dPalace / 42) * 10.5;

      // Stepwell depression at (-35, 10)
      const dStepwell = Math.hypot(x + 35, z - 10);
      const stepwellPit = Math.max(0, 1 - dStepwell / 20) * -3.0;

      let height = (2.8 + dunes + duneRipples + palaceMesa + stepwellPit) * islandMask;
      if (normalizedDist > 0.88) {
        height = THREE.MathUtils.lerp(height, -1.8, (normalizedDist - 0.88) / 0.12);
      }
      return height;
    } else {
      // Frontier Island: high radar peak and tactical ridges
      const hill1 = Math.sin(x * 0.025 + 0.5) * Math.cos(z * 0.025 + 0.2) * 6.0;
      const hill2 = Math.sin(x * 0.05 + 1.2) * Math.sin(z * 0.045 - 0.8) * 3.0;
      const dRadar = Math.hypot(x - 15, z - 10);
      const radarMountain = Math.max(0, 1 - dRadar / 45) * 11.5;
      const dBunker = Math.hypot(x + 55, z + 20);
      const bunkerHill = Math.max(0, 1 - dBunker / 35) * 5.5;

      let height = (2.2 + hill1 + hill2 + radarMountain + bunkerHill) * islandMask;
      if (normalizedDist > 0.85) {
        height = THREE.MathUtils.lerp(height, -1.8, (normalizedDist - 0.85) / 0.15);
      }
      return height;
    }
  }

  private buildTerrain() {
    const segments = 110;
    const size = this.islandRadius * 2.3;
    const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);

    // Color Palettes based on map identity
    let colorShore: THREE.Color;
    let colorLow: THREE.Color;
    let colorMid: THREE.Color;
    let colorHigh: THREE.Color;

    if (this.currentMapId === 'india') {
      // River delta, terracotta sand, lush banyan green, heritage sandstone
      colorShore = new THREE.Color(0xd4b886);
      colorLow = new THREE.Color(0x386641);
      colorMid = new THREE.Color(0x6a994e);
      colorHigh = new THREE.Color(0x9c6644); // Sandstone ridge
    } else if (this.currentMapId === 'rajasthan') {
      // Thar desert sand, golden amber dunes, weathered pink rock
      colorShore = new THREE.Color(0xe6be8a);
      colorLow = new THREE.Color(0xd4a373);
      colorMid = new THREE.Color(0xbc6c25);
      colorHigh = new THREE.Color(0x9a031e); // Red sandstone
    } else {
      // Frontier Island: Tropical sand, lush grass, dark basalt
      colorShore = new THREE.Color(0xd2b57b);
      colorLow = new THREE.Color(0x3e6837);
      colorMid = new THREE.Color(0x567139);
      colorHigh = new THREE.Color(0x5c5953);
    }

    const tempColor = new THREE.Color();

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const y = this.getTerrainHeight(x, z);
      positions.setY(i, y);

      if (y < 0.8) {
        tempColor.copy(colorShore);
      } else if (y < 4.0) {
        const t = (y - 0.8) / 3.2;
        tempColor.lerpColors(colorShore, colorLow, t);
      } else if (y < 9.5) {
        const t = (y - 4.0) / 5.5;
        tempColor.lerpColors(colorLow, colorMid, t);
      } else {
        const t = Math.min(1.0, (y - 9.5) / 5.0);
        tempColor.lerpColors(colorMid, colorHigh, t);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.88,
      metalness: 0.05,
    });

    this.terrainMesh = new THREE.Mesh(geometry, material);
    this.terrainMesh.receiveShadow = true;
    this.worldGroup.add(this.terrainMesh);
  }

  private buildOcean() {
    const oceanGeo = new THREE.PlaneGeometry(600, 600, 8, 8);
    oceanGeo.rotateX(-Math.PI / 2);

    let oceanColor = 0x145374;
    if (this.currentMapId === 'india') oceanColor = 0x1d4e89;
    if (this.currentMapId === 'rajasthan') oceanColor = 0x0f4c5c;

    this.oceanMaterial = new THREE.MeshStandardMaterial({
      color: oceanColor,
      roughness: 0.2,
      metalness: 0.4,
      transparent: true,
      opacity: 0.88,
    });

    this.oceanMesh = new THREE.Mesh(oceanGeo, this.oceanMaterial);
    this.oceanMesh.position.y = 0.0;
    this.oceanMesh.receiveShadow = true;
    this.worldGroup.add(this.oceanMesh);
  }

  private buildBoundary() {
    // Map Containment Safe Zone Forcefield
    const radius = this.islandRadius;
    const boundaryGeo = new THREE.CylinderGeometry(radius, radius, 30, 48, 1, true);
    const boundaryColor =
      this.currentMapId === 'india'
        ? 0xf59e0b
        : this.currentMapId === 'rajasthan'
        ? 0xef4444
        : 0x0ea5e9;

    const boundaryMat = new THREE.MeshBasicMaterial({
      color: boundaryColor,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
      wireframe: true,
    });

    this.boundaryMesh = new THREE.Mesh(boundaryGeo, boundaryMat);
    this.boundaryMesh.position.y = 12;
    this.worldGroup.add(this.boundaryMesh);

    this.animatedProps.push({
      mesh: this.boundaryMesh,
      update: (dt) => {
        this.boundaryMesh.rotation.y += dt * 0.04;
      },
    });
  }

  // ==========================================================
  // MAP A — INDIA: HERITAGE ISLAND
  // ==========================================================
  private buildIndiaHeritageMap() {
    this.landmarks = [
      {
        id: 'marble_citadel',
        name: 'Marble Citadel (Grand Taj)',
        type: 'citadel',
        position: { x: 0, y: this.getTerrainHeight(0, 15), z: 15 },
        description: 'Majestic white marble domed sanctuary with four towering minarets.',
      },
      {
        id: 'red_sandstone_fort',
        name: 'Red Sandstone Fort Ramparts',
        type: 'fort',
        position: { x: -45, y: this.getTerrainHeight(-45, -25), z: -25 },
        description: 'Heavy Mughal fort battlements overlooking the western river crossing.',
      },
      {
        id: 'heritage_bazaar',
        name: 'Heritage Spice Bazaar',
        type: 'market',
        position: { x: 45, y: this.getTerrainHeight(45, -20), z: -20 },
        description: 'Traditional village market filled with canopy stalls and pottery.',
      },
      {
        id: 'banyan_sanctuary',
        name: 'Ancient Banyan Sanctuary',
        type: 'citadel',
        position: { x: -20, y: this.getTerrainHeight(-20, 55), z: 55 },
        description: 'Centuries-old sacred grove with hanging aerial roots and stone pavilion.',
      },
    ];

    // 1. Build Marble Citadel (Taj-inspired original monument)
    const citadelGroup = new THREE.Group();
    const cx = 0;
    const cz = 15;
    const cy = this.getTerrainHeight(cx, cz);
    citadelGroup.position.set(cx, cy, cz);

    const marbleMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2,
    });

    // Elevated marble plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(24, 2.5, 24), marbleMat);
    plinth.position.y = 1.25;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    citadelGroup.add(plinth);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(cx, cy + 1.25, cz),
      size: new THREE.Vector3(24, 2.5, 24),
      name: 'Marble Plinth',
    });

    // Main sanctuary cube
    const mainHall = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 14), marbleMat);
    mainHall.position.y = 6.5;
    mainHall.castShadow = true;
    citadelGroup.add(mainHall);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(cx, cy + 6.5, cz),
      size: new THREE.Vector3(14, 8, 14),
      name: 'Citadel Hall',
    });

    // Grand Dome (Onion dome shape approximation)
    const domeBase = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 2, 16), marbleMat);
    domeBase.position.y = 11.5;
    citadelGroup.add(domeBase);

    const dome = new THREE.Mesh(new THREE.SphereGeometry(4.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), marbleMat);
    dome.position.y = 12.5;
    dome.castShadow = true;
    citadelGroup.add(dome);

    const goldFinial = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.8, 8), goldMat);
    goldFinial.position.y = 16.8;
    citadelGroup.add(goldFinial);

    // 4 Corner Minarets
    const minaretOffsets = [
      { x: -10, z: -10 },
      { x: 10, z: -10 },
      { x: -10, z: 10 },
      { x: 10, z: 10 },
    ];

    minaretOffsets.forEach((mo) => {
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 16, 8), marbleMat);
      tower.position.set(mo.x, 9.5, mo.z);
      tower.castShadow = true;
      citadelGroup.add(tower);

      const topDome = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), marbleMat);
      topDome.position.set(mo.x, 18, mo.z);
      citadelGroup.add(topDome);

      this.colliders.push({
        type: 'cylinder',
        position: new THREE.Vector3(cx + mo.x, cy + 9.5, cz + mo.z),
        size: new THREE.Vector3(1.2, 16, 1.2),
        name: 'Minaret',
      });
    });

    this.worldGroup.add(citadelGroup);

    // 2. Build Red Sandstone Fort Bastions at (-45, -25)
    const fortGroup = new THREE.Group();
    const fx = -45;
    const fz = -25;
    const fy = this.getTerrainHeight(fx, fz);
    fortGroup.position.set(fx, fy, fz);

    const sandstoneMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.8,
    });

    const fortWall = new THREE.Mesh(new THREE.BoxGeometry(20, 6, 4), sandstoneMat);
    fortWall.position.set(0, 3, 0);
    fortWall.castShadow = true;
    fortGroup.add(fortWall);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(fx, fy + 3, fz),
      size: new THREE.Vector3(20, 6, 4),
      name: 'Sandstone Rampart',
    });

    const fortTowerL = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.0, 9, 8), sandstoneMat);
    fortTowerL.position.set(-10, 4.5, 0);
    fortTowerL.castShadow = true;
    fortGroup.add(fortTowerL);

    const fortTowerR = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.0, 9, 8), sandstoneMat);
    fortTowerR.position.set(10, 4.5, 0);
    fortTowerR.castShadow = true;
    fortGroup.add(fortTowerR);

    this.colliders.push({
      type: 'cylinder',
      position: new THREE.Vector3(fx - 10, fy + 4.5, fz),
      size: new THREE.Vector3(3.0, 9, 3.0),
      name: 'Fort Tower Left',
    });
    this.colliders.push({
      type: 'cylinder',
      position: new THREE.Vector3(fx + 10, fy + 4.5, fz),
      size: new THREE.Vector3(3.0, 9, 3.0),
      name: 'Fort Tower Right',
    });

    this.worldGroup.add(fortGroup);

    // 3. Build Heritage Spice Bazaar stalls at (45, -20)
    const bazaarColors = [0xb91c1c, 0xf59e0b, 0x15803d, 0x7c3aed];
    for (let i = 0; i < 4; i++) {
      const bx = 45 + (i % 2) * 8 - 4;
      const bz = -20 + Math.floor(i / 2) * 8 - 4;
      const by = this.getTerrainHeight(bx, bz);

      const stall = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.5, 3.5), new THREE.MeshStandardMaterial({
        color: bazaarColors[i],
        roughness: 0.6,
      }));
      stall.position.set(bx, by + 1.25, bz);
      stall.castShadow = true;
      this.worldGroup.add(stall);

      this.colliders.push({
        type: 'box',
        position: new THREE.Vector3(bx, by + 1.25, bz),
        size: new THREE.Vector3(3.5, 2.5, 3.5),
        name: `Bazaar Stall ${i}`,
      });
    }
  }

  // ==========================================================
  // MAP B — RAJASTHAN: DESERT KINGDOM
  // ==========================================================
  private buildRajasthanDesertMap() {
    this.landmarks = [
      {
        id: 'amber_palace',
        name: 'Amber Palace (Hawa Landmark)',
        type: 'palace',
        position: { x: 20, y: this.getTerrainHeight(20, 15), z: 15 },
        description: 'Multi-tiered pink sandstone palace featuring hundreds of ornate jharokha screens.',
      },
      {
        id: 'chand_stepwell',
        name: 'Ancient Geometric Stepwell',
        type: 'stepwell',
        position: { x: -35, y: this.getTerrainHeight(-35, 10), z: 10 },
        description: 'Deep stone architectural reservoir with symmetrical crisscrossing staircases.',
      },
      {
        id: 'desert_hill_fort',
        name: 'Desert Ridge Fortress',
        type: 'fort',
        position: { x: -40, y: this.getTerrainHeight(-40, -35), z: -35 },
        description: 'Imposing canyon watchtower guarding the arid caravan pass.',
      },
      {
        id: 'caravan_encampment',
        name: 'Caravanserai Bazaars',
        type: 'market',
        position: { x: 45, y: this.getTerrainHeight(45, -30), z: -30 },
        description: 'Desert camel trade encampment with clay walls and shade awnings.',
      },
    ];

    // 1. Build Amber Palace (Hawa-inspired pink facade)
    const palaceGroup = new THREE.Group();
    const px = 20;
    const pz = 15;
    const py = this.getTerrainHeight(px, pz);
    palaceGroup.position.set(px, py, pz);

    const pinkSandstoneMat = new THREE.MeshStandardMaterial({
      color: 0xdb7093, // Pale violet-red / pink terracotta
      roughness: 0.75,
    });
    const darkTerracottaMat = new THREE.MeshStandardMaterial({
      color: 0x993d52,
      roughness: 0.8,
    });

    // Tier 1 Base Hall
    const tier1 = new THREE.Mesh(new THREE.BoxGeometry(22, 6, 12), pinkSandstoneMat);
    tier1.position.y = 3;
    tier1.castShadow = true;
    palaceGroup.add(tier1);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(px, py + 3, pz),
      size: new THREE.Vector3(22, 6, 12),
      name: 'Amber Palace Base',
    });

    // Tier 2 Middle Hall
    const tier2 = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 9), pinkSandstoneMat);
    tier2.position.set(0, 8.5, 0);
    tier2.castShadow = true;
    palaceGroup.add(tier2);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(px, py + 8.5, pz),
      size: new THREE.Vector3(16, 5, 9),
      name: 'Amber Palace Mid',
    });

    // Tier 3 Top Pavilion
    const tier3 = new THREE.Mesh(new THREE.BoxGeometry(10, 4, 6), darkTerracottaMat);
    tier3.position.set(0, 13, 0);
    tier3.castShadow = true;
    palaceGroup.add(tier3);

    // Decorative Jharokha window boxes
    for (let r = 0; r < 5; r++) {
      const jBox = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.8), darkTerracottaMat);
      jBox.position.set(-8 + r * 4, 4.5, 6.2);
      palaceGroup.add(jBox);
    }

    this.worldGroup.add(palaceGroup);

    // 2. Build Ancient Stepwell at (-35, 10)
    const swx = -35;
    const swz = 10;
    const swy = this.getTerrainHeight(swx, swz);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.9 });
    const wellBorder = new THREE.Mesh(new THREE.BoxGeometry(16, 3, 16), stoneMat);
    wellBorder.position.set(swx, swy + 1, swz);
    wellBorder.castShadow = true;
    this.worldGroup.add(wellBorder);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(swx, swy + 1, swz),
      size: new THREE.Vector3(16, 3, 16),
      name: 'Stepwell Perimeter',
    });

    // 3. Build Desert Ridge Fortress Watchtower at (-40, -35)
    const rwx = -40;
    const rwz = -35;
    const rwy = this.getTerrainHeight(rwx, rwz);

    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 4.2, 14, 8), darkTerracottaMat);
    tower.position.set(rwx, rwy + 7, rwz);
    tower.castShadow = true;
    this.worldGroup.add(tower);

    this.colliders.push({
      type: 'cylinder',
      position: new THREE.Vector3(rwx, rwy + 7, rwz),
      size: new THREE.Vector3(4.2, 14, 4.2),
      name: 'Desert Fortress Tower',
    });
  }

  // ==========================================================
  // MAP C — UNIVERSAL: FRONTIER ISLAND
  // ==========================================================
  private buildFrontierMap() {
    this.landmarks = [
      {
        id: 'radar_alpha',
        name: 'Radar Alpha (Hilltop)',
        type: 'radar',
        position: { x: 15, y: this.getTerrainHeight(15, 10), z: 10 },
        description: 'Command communication mast with 360° vantage over the island.',
      },
      {
        id: 'bunker_04',
        name: 'Bunker 04 (West Ridge)',
        type: 'bunker',
        position: { x: -55, y: this.getTerrainHeight(-55, -20), z: -20 },
        description: 'Hardened underground military shelter with blast doors.',
      },
      {
        id: 'coastal_outpost',
        name: 'Coastal Outpost (East Harbor)',
        type: 'outpost',
        position: { x: 60, y: this.getTerrainHeight(60, -40), z: -40 },
        description: 'Logistics pier with maritime shipping containers and watchtower.',
      },
      {
        id: 'crash_site',
        name: 'Crash Site Bravo (South Field)',
        type: 'crash',
        position: { x: -20, y: this.getTerrainHeight(-20, 65), z: 65 },
        description: 'Downed VTOL dropship fuselage with emergency beacon.',
      },
    ];

    // Radar Tower
    const rx = 15;
    const rz = 10;
    const ry = this.getTerrainHeight(rx, rz);
    const radarGroup = new THREE.Group();
    radarGroup.position.set(rx, ry, rz);

    const base = new THREE.Mesh(new THREE.BoxGeometry(12, 4, 10), new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 }));
    base.position.y = 2;
    radarGroup.add(base);

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 1.2, 18, 6), new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 }));
    mast.position.y = 13;
    radarGroup.add(mast);

    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 21, 0);
    const dish = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 8, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0xe2e8f0 }));
    dish.rotation.x = Math.PI / 4;
    dishGroup.add(dish);
    radarGroup.add(dishGroup);

    this.worldGroup.add(radarGroup);
    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(rx, ry + 2, rz),
      size: new THREE.Vector3(12, 4, 10),
      name: 'Radar Base',
    });

    this.animatedProps.push({
      mesh: dishGroup,
      update: (dt) => {
        dishGroup.rotation.y += dt * 1.2;
      },
    });

    // Bunker 04 at (-55, -20)
    const bx = -55;
    const bz = -20;
    const by = this.getTerrainHeight(bx, bz);
    const bunker = new THREE.Mesh(new THREE.BoxGeometry(14, 4.5, 12), new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.85 }));
    bunker.position.set(bx, by + 2.25, bz);
    this.worldGroup.add(bunker);

    this.colliders.push({
      type: 'box',
      position: new THREE.Vector3(bx, by + 2.25, bz),
      size: new THREE.Vector3(14, 4.5, 12),
      name: 'Bunker 04',
    });
  }

  private buildTacticalVegetationAndCover() {
    // Foliage adjusted to match current map theme
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.45, 4.5, 6);
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4a3525, roughness: 0.9 });

    const foliageGeo =
      this.currentMapId === 'rajasthan'
        ? new THREE.DodecahedronGeometry(1.6, 0)
        : new THREE.ConeGeometry(2.4, 6, 6);

    const foliageMat = new THREE.MeshStandardMaterial({
      color:
        this.currentMapId === 'rajasthan'
          ? 0x854d0e // dry desert scrub
          : this.currentMapId === 'india'
          ? 0x2d5a27 // lush banyan emerald
          : 0x1e3a1e, // dark pine
      roughness: 0.8,
    });

    const rng = (seed: number) => {
      const val = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
      return val - Math.floor(val);
    };

    // Trees
    for (let i = 0; i < 55; i++) {
      const angle = rng(i * 3 + 1) * Math.PI * 2;
      const dist = 18 + rng(i * 3 + 2) * (this.islandRadius - 28);
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const y = this.getTerrainHeight(x, z);

      if (y < 0.6 || Math.hypot(x, z - 15) < 22) continue;

      const tree = new THREE.Group();
      tree.position.set(x, y, z);

      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.25;
      tree.add(trunk);

      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 5.0;
      tree.add(foliage);

      const scale = 0.8 + rng(i * 5) * 0.4;
      tree.scale.set(scale, scale, scale);
      this.worldGroup.add(tree);

      this.colliders.push({
        type: 'cylinder',
        position: new THREE.Vector3(x, y + 2, z),
        size: new THREE.Vector3(0.55 * scale, 4.5 * scale, 0.55 * scale),
        name: `Tree_${i}`,
      });
    }

    // Concrete & Sandstone Tactical Cover Barricades
    const barrierGeo = new THREE.BoxGeometry(3.2, 1.1, 0.8);
    const barrierColor =
      this.currentMapId === 'rajasthan'
        ? 0x9a3412
        : this.currentMapId === 'india'
        ? 0x78350f
        : 0x94a3b8;
    const barrierMat = new THREE.MeshStandardMaterial({ color: barrierColor, roughness: 0.8 });

    const barrierPositions = [
      { x: 8, z: 28, rot: 0.4 },
      { x: -12, z: -8, rot: -0.2 },
      { x: 32, z: -12, rot: 0.8 },
      { x: -32, z: 22, rot: 1.2 },
      { x: 12, z: -38, rot: -0.6 },
    ];

    barrierPositions.forEach((pos, idx) => {
      const y = this.getTerrainHeight(pos.x, pos.z);
      const barrier = new THREE.Mesh(barrierGeo, barrierMat);
      barrier.position.set(pos.x, y + 0.55, pos.z);
      barrier.rotation.y = pos.rot;
      barrier.castShadow = true;
      this.worldGroup.add(barrier);

      this.colliders.push({
        type: 'box',
        position: new THREE.Vector3(pos.x, y + 0.55, pos.z),
        size: new THREE.Vector3(3.2, 1.1, 0.8),
        name: `Tactical Barrier ${idx}`,
      });
    });
  }

  public resolveCollision(
    currentPos: THREE.Vector3,
    radius: number = 0.5,
    height: number = 1.8
  ): { position: THREE.Vector3; collided: boolean } {
    let resolved = currentPos.clone();
    let didCollide = false;

    // Check perimeter ring
    const distFromCenter = Math.hypot(resolved.x, resolved.z);
    if (distFromCenter > this.islandRadius - 2) {
      const angle = Math.atan2(resolved.z, resolved.x);
      resolved.x = Math.cos(angle) * (this.islandRadius - 2);
      resolved.z = Math.sin(angle) * (this.islandRadius - 2);
      didCollide = true;
    }

    // Check colliders
    for (const col of this.colliders) {
      if (col.type === 'box') {
        const halfX = col.size.x / 2 + radius;
        const halfZ = col.size.z / 2 + radius;
        const colBottom = col.position.y - col.size.y / 2;
        const colTop = col.position.y + col.size.y / 2;

        if (resolved.y < colTop && resolved.y + height > colBottom) {
          const dx = resolved.x - col.position.x;
          const dz = resolved.z - col.position.z;

          if (Math.abs(dx) < halfX && Math.abs(dz) < halfZ) {
            didCollide = true;
            const overlapX = halfX - Math.abs(dx);
            const overlapZ = halfZ - Math.abs(dz);

            if (overlapX < overlapZ) {
              resolved.x = col.position.x + Math.sign(dx) * halfX;
            } else {
              resolved.z = col.position.z + Math.sign(dz) * halfZ;
            }
          }
        }
      } else if (col.type === 'cylinder') {
        const colRadius = col.size.x + radius;
        const colBottom = col.position.y - col.size.y / 2;
        const colTop = col.position.y + col.size.y / 2;

        if (resolved.y < colTop && resolved.y + height > colBottom) {
          const dx = resolved.x - col.position.x;
          const dz = resolved.z - col.position.z;
          const dist2D = Math.hypot(dx, dz);

          if (dist2D < colRadius && dist2D > 0.001) {
            didCollide = true;
            const pushFactor = colRadius / dist2D;
            resolved.x = col.position.x + dx * pushFactor;
            resolved.z = col.position.z + dz * pushFactor;
          }
        }
      }
    }

    return { position: resolved, collided: didCollide };
  }

  public update(dt: number) {
    for (const prop of this.animatedProps) {
      prop.update(dt);
    }
  }
}
