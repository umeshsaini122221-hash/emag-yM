import * as THREE from 'three';
import { CharacterController } from './CharacterController';
import { IslandWorld } from './IslandWorld';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  public yaw: number = 0; // horizontal angle in radians
  public pitch: number = 0.25; // vertical angle in radians (looking slightly down)
  public distance: number = 4.2; // default distance behind player
  public minDistance: number = 1.2;
  public maxDistance: number = 5.5;

  private currentTarget: THREE.Vector3 = new THREE.Vector3();
  private currentCameraPos: THREE.Vector3 = new THREE.Vector3();
  private world: IslandWorld;

  // Smoothing rates
  private positionLerpSpeed: number = 14.0;
  private targetOffset: THREE.Vector3 = new THREE.Vector3(0, 1.55, 0);

  constructor(camera: THREE.PerspectiveCamera, world: IslandWorld, initialYaw: number = 0) {
    this.camera = camera;
    this.world = world;
    this.yaw = initialYaw;
  }

  /**
   * Rotate camera from touch look or mouse drag delta
   */
  public handleLookDelta(deltaX: number, deltaY: number, sensitivity: number = 1.0) {
    const scale = 0.0035 * sensitivity;
    this.yaw -= deltaX * scale;
    this.pitch += deltaY * scale;

    // Clamp pitch to avoid gimbal flipping or inverted camera
    const minPitch = -0.45; // looking up
    const maxPitch = 1.15; // looking down from above
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
  }

  public update(dt: number, player: CharacterController, isAiming: boolean = false) {
    // 1. Calculate desired look-at target (player's head/shoulder)
    let shoulderOffset = new THREE.Vector3(0, 1.55, 0);
    if (player.stance === 'crouching') {
      shoulderOffset = new THREE.Vector3(0, 1.1, 0);
    }
    if (isAiming) {
      // Over the right shoulder offset
      const rightSide = new THREE.Vector3(0.45, 1.5, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      shoulderOffset.add(rightSide);
    }

    const desiredTarget = player.position.clone().add(shoulderOffset);

    // Smoothly track target
    this.currentTarget.lerp(desiredTarget, Math.min(1.0, dt * this.positionLerpSpeed));

    // 2. Compute ideal camera position in spherical coordinates
    const targetDistance = isAiming ? 2.4 : this.distance;
    const horizontalDist = targetDistance * Math.cos(this.pitch);
    const verticalDist = targetDistance * Math.sin(this.pitch);

    const idealOffset = new THREE.Vector3(
      Math.sin(this.yaw) * horizontalDist,
      verticalDist,
      Math.cos(this.yaw) * horizontalDist
    );

    let actualDistance = targetDistance;
    const idealPos = this.currentTarget.clone().add(idealOffset);

    // 3. Terrain & obstacle collision check for camera (prevent wall clipping)
    const terrainHeightAtCam = this.world.getTerrainHeight(idealPos.x, idealPos.z) + 0.4;
    if (idealPos.y < terrainHeightAtCam) {
      // Pull camera higher or closer to prevent clipping ground
      idealPos.y = terrainHeightAtCam;
    }

    // Check collision along ray from target to idealPos
    const rayDir = idealPos.clone().sub(this.currentTarget).normalize();
    const rayDist = idealPos.distanceTo(this.currentTarget);

    // Simple raycast against world colliders
    for (const col of this.world.colliders) {
      if (col.type === 'box') {
        const box = new THREE.Box3(
          col.position.clone().sub(col.size.clone().multiplyScalar(0.5)),
          col.position.clone().add(col.size.clone().multiplyScalar(0.5))
        );

        const ray = new THREE.Ray(this.currentTarget, rayDir);
        const hit = ray.intersectBox(box, new THREE.Vector3());
        if (hit) {
          const hitDist = hit.distanceTo(this.currentTarget);
          if (hitDist < rayDist && hitDist > this.minDistance) {
            actualDistance = Math.min(actualDistance, hitDist - 0.25);
          }
        }
      }
    }

    // Recompute camera pos with adjusted distance
    const clampedOffset = new THREE.Vector3(
      Math.sin(this.yaw) * actualDistance * Math.cos(this.pitch),
      actualDistance * Math.sin(this.pitch),
      Math.cos(this.yaw) * actualDistance * Math.cos(this.pitch)
    );

    const targetCameraPos = this.currentTarget.clone().add(clampedOffset);
    this.currentCameraPos.lerp(targetCameraPos, Math.min(1.0, dt * 20.0));

    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentTarget);

    // 4. Dynamic Field of View
    const targetFov = isAiming ? 45 : (player.stance === 'sprinting' ? 70 : 60);
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 8);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Dedicated chase camera tracking tailored for vehicle-based movement.
   * Smoothly auto-aligns yaw behind vehicle direction, expands distance and FOV
   * dynamically with speed, and dampens terrain bumps.
   */
  public updateVehicleCamera(
    dt: number,
    vehicle: { position: THREE.Vector3; heading: number; speed: number; isBoosting: boolean }
  ) {
    // 1. Soft auto-align yaw to follow vehicle direction when moving forward
    if (Math.abs(vehicle.speed) > 1.2) {
      let yawDiff = vehicle.heading - this.yaw;
      while (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      while (yawDiff > Math.PI) yawDiff -= Math.PI * 2;

      // Soft realign strength scales with speed (so player can still look around, but camera naturally eases behind vehicle)
      const realignSpeed = Math.min(2.8, 1.2 + Math.abs(vehicle.speed) * 0.08);
      this.yaw += yawDiff * Math.min(1.0, dt * realignSpeed);
    }

    // 2. Look-at target: vehicle roof/hood center
    const vehicleTarget = vehicle.position.clone().add(new THREE.Vector3(0, 1.35, 0));
    this.currentTarget.lerp(vehicleTarget, Math.min(1.0, dt * 14.0));

    // 3. Dynamic distance scaling with speed
    // Base distance: 6.8m, expanding up to 9.2m on boost
    const speedRatio = Math.min(1.2, Math.abs(vehicle.speed) / 20.0);
    const dynamicDist = 6.8 + speedRatio * 2.4;

    // Pitch: slightly elevated view overlooking the car
    const clampedPitch = Math.max(0.12, Math.min(0.75, this.pitch));

    const horizontalDist = dynamicDist * Math.cos(clampedPitch);
    const verticalDist = dynamicDist * Math.sin(clampedPitch);

    const idealOffset = new THREE.Vector3(
      Math.sin(this.yaw) * horizontalDist,
      verticalDist,
      Math.cos(this.yaw) * horizontalDist
    );

    const idealPos = this.currentTarget.clone().add(idealOffset);

    // 4. Ground collision protection
    const terrainHeightAtCam = this.world.getTerrainHeight(idealPos.x, idealPos.z) + 0.55;
    if (idealPos.y < terrainHeightAtCam) {
      idealPos.y = terrainHeightAtCam;
    }

    // Smoothly interpolate camera position
    this.currentCameraPos.lerp(idealPos, Math.min(1.0, dt * 18.0));
    this.camera.position.copy(this.currentCameraPos);
    this.camera.lookAt(this.currentTarget);

    // 5. Dynamic FOV: expands up to 78° on boost
    const targetFov = vehicle.isBoosting ? 78 : 62 + speedRatio * 8;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 6.0);
    this.camera.updateProjectionMatrix();
  }
}

