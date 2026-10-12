import { Vector2D } from '../types';

export class KeyboardMouseInput {
  private keys: Record<string, boolean> = {};
  public mouseLookDelta: Vector2D = { x: 0, y: 0 };
  private isPointerLocked: boolean = false;
  private canvas: HTMLCanvasElement;
  private mouseButtons: Record<number, boolean> = {};

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('pointerlockchange', this.handleLockChange);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private handleMouseDown = (e: MouseEvent) => {
    this.mouseButtons[e.button] = true;
    // Left click can request pointer lock for desktop testing
    if (e.button === 0 && !this.isPointerLocked) {
      this.canvas.requestPointerLock?.();
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.mouseButtons[e.button] = false;
  };

  private handleLockChange = () => {
    this.isPointerLocked = document.pointerLockElement === this.canvas;
  };

  private handleMouseMove = (e: MouseEvent) => {
    if (this.isPointerLocked) {
      this.mouseLookDelta.x += e.movementX;
      this.mouseLookDelta.y += e.movementY;
    }
  };

  public getMovementVector(): Vector2D {
    let x = 0;
    let y = 0;

    if (this.keys['KeyW'] || this.keys['ArrowUp']) y += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) y -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;

    // Normalize diagonal movement
    const mag = Math.hypot(x, y);
    if (mag > 0) {
      x /= mag;
      y /= mag;
    }

    return { x, y };
  }

  public isJumping(): boolean {
    return !!this.keys['Space'];
  }

  public isCrouching(): boolean {
    return !!this.keys['KeyC'];
  }

  public isSprinting(): boolean {
    return !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
  }

  public isFiring(): boolean {
    return !!this.mouseButtons[0] || !!this.keys['KeyF'] || !!this.keys['Enter'];
  }

  public isAiming(): boolean {
    return !!this.mouseButtons[2] || !!this.keys['KeyZ'];
  }

  public isReloading(): boolean {
    return !!this.keys['KeyR'];
  }

  public isHealing(): boolean {
    return !!this.keys['KeyH'] || !!this.keys['KeyE'];
  }

  public isSwitchingWeapon(): boolean {
    return !!this.keys['KeyQ'] || !!this.keys['Digit1'] || !!this.keys['Digit2'];
  }

  // --- VEHICLE CONTROLS ---
  private vehicleInteractPressed: boolean = false;

  public consumeVehicleInteract(): boolean {
    const isDown = !!this.keys['KeyF'] || !!this.keys['KeyE'] || !!this.keys['KeyV'];
    if (isDown && !this.vehicleInteractPressed) {
      this.vehicleInteractPressed = true;
      return true;
    }
    if (!isDown) {
      this.vehicleInteractPressed = false;
    }
    return false;
  }

  public isVehicleHandbrake(): boolean {
    return !!this.keys['Space'];
  }

  public isVehicleBoosting(): boolean {
    return !!this.keys['ShiftLeft'] || !!this.keys['ShiftRight'];
  }

  public isVehicleHonk(): boolean {
    return !!this.keys['KeyH'];
  }

  public consumeMouseDelta(): Vector2D {
    const delta = { x: this.mouseLookDelta.x, y: this.mouseLookDelta.y };
    this.mouseLookDelta.x = 0;
    this.mouseLookDelta.y = 0;
    return delta;
  }

  public dispose() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('pointerlockchange', this.handleLockChange);
  }
}
