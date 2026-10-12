import * as THREE from 'three';
import { GraphicsPreset, PerformanceStats } from '../types';

export class SceneManager {
  public canvas: HTMLCanvasElement;
  public renderer: THREE.WebGLRenderer;
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public sunLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;

  private currentPreset: GraphicsPreset = 'medium';
  private frameCount: number = 0;
  private lastFpsUpdate: number = performance.now();
  private lastFrameTime: number = performance.now();
  private stats: PerformanceStats = {
    fps: 60,
    frameTime: 16.6,
    drawCalls: 0,
    triangles: 0,
  };

  constructor(canvas: HTMLCanvasElement, initialPreset: GraphicsPreset = 'medium') {
    this.canvas = canvas;
    this.currentPreset = initialPreset;

    // 1. Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x8ec5fc); // Tropical island sky
    this.scene.fog = new THREE.FogExp2(0x8ec5fc, 0.0065); // Atmospheric depth falloff

    // 2. Camera setup
    const aspect = canvas.clientWidth / Math.max(1, canvas.clientHeight);
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.2, 500);

    // 3. WebGL2 Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: initialPreset !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });

    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // 4. Lights
    this.setupLighting();

    // 5. Apply preset
    this.applyPreset(initialPreset);

    // 6. Context loss listeners
    this.setupContextHandling();

    // 7. Initial sizing
    this.handleResize();
  }

  private setupLighting() {
    // Atmospheric Skylight / Hemisphere
    this.hemiLight = new THREE.HemisphereLight(0xdff0ff, 0x443322, 0.95);
    this.hemiLight.position.set(0, 100, 0);
    this.scene.add(this.hemiLight);

    // Directional Sun Light
    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
    this.sunLight.position.set(60, 110, 45);
    this.sunLight.castShadow = true;

    // Shadow frustum tuned for mobile efficiency
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 240;
    this.sunLight.shadow.camera.left = -60;
    this.sunLight.shadow.camera.right = 60;
    this.sunLight.shadow.camera.top = 60;
    this.sunLight.shadow.camera.bottom = -60;
    this.sunLight.shadow.bias = -0.0006;

    this.scene.add(this.sunLight);
  }

  public applyPreset(preset: GraphicsPreset) {
    this.currentPreset = preset;

    if (preset === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.renderer.setPixelRatio(1.0);
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).density = 0.008;
      }
    } else if (preset === 'medium') {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.BasicShadowMap;
      this.sunLight.shadow.mapSize.set(1024, 1024);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.35));
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).density = 0.0065;
      }
    } else {
      // High
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.sunLight.shadow.mapSize.set(2048, 2048);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.0));
      if (this.scene.fog) {
        (this.scene.fog as THREE.FogExp2).density = 0.0055;
      }
    }

    this.renderer.shadowMap.needsUpdate = true;
    this.handleResize();
  }

  public updateSunTarget(playerPos: THREE.Vector3) {
    // Keep directional sunlight shadow frustum centered around the player
    this.sunLight.position.set(playerPos.x + 60, playerPos.y + 110, playerPos.z + 45);
    this.sunLight.target.position.copy(playerPos);
    this.sunLight.target.updateMatrixWorld();
  }

  private setupContextHandling() {
    this.canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      // WebGL context lost handled safely
    });

    this.canvas.addEventListener('webglcontextrestored', () => {
      this.applyPreset(this.currentPreset);
    });
  }

  public handleResize() {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;

    if (this.camera && (this.canvas.width !== width || this.canvas.height !== height)) {
      this.camera.aspect = width / Math.max(1, height);
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height, false);
    }
  }

  public render(): PerformanceStats {
    const now = performance.now();
    const frameDelta = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.renderer.render(this.scene, this.camera);

    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      const elapsed = (now - this.lastFpsUpdate) / 1000;
      this.stats.fps = Math.round(this.frameCount / elapsed);
      this.stats.frameTime = Math.round(frameDelta * 10) / 10;
      this.stats.drawCalls = this.renderer.info.render.calls;
      this.stats.triangles = this.renderer.info.render.triangles;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    return this.stats;
  }

  public dispose() {
    this.renderer.dispose();
  }
}
