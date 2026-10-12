import { Vector2D } from '../types';

export interface TouchJoystickState {
  active: boolean;
  baseX: number;
  baseY: number;
  currentX: number;
  currentY: number;
  normalized: Vector2D; // x: -1 to 1 (strafe), y: -1 to 1 (forward/back)
}

export interface TouchActions {
  jump: boolean;
  crouch: boolean;
  sprint: boolean;
  fire: boolean;
  aim: boolean;
  reload: boolean;
  heal: boolean;
  switchWeapon: boolean;
}

export class TouchInputManager {
  private element: HTMLElement;

  // Joystick state (left side of screen)
  public joystick: TouchJoystickState = {
    active: false,
    baseX: 0,
    baseY: 0,
    currentX: 0,
    currentY: 0,
    normalized: { x: 0, y: 0 },
  };

  // Look touchpad delta (right side of screen)
  public lookDelta: Vector2D = { x: 0, y: 0 };

  // Actions
  public actions: TouchActions = {
    jump: false,
    crouch: false,
    sprint: false,
    fire: false,
    aim: false,
    reload: false,
    heal: false,
    switchWeapon: false,
  };

  // Touch tracking
  private joystickTouchId: number | null = null;
  private lookTouchId: number | null = null;
  private lastLookPos: Vector2D = { x: 0, y: 0 };
  private maxJoystickRadius = 55; // pixels

  constructor(element: HTMLElement) {
    this.element = element;
    this.bindEvents();
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    this.element.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    this.element.addEventListener('touchcancel', this.handleTouchEnd, { passive: false });
  }

  private handleTouchStart = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.closest('button, input, select, [data-interactive]')) {
      // Do not swallow touches on interactive buttons
      return;
    }

    // Prevent default browser gesture behavior on Android Chrome (zoom, pull to refresh)
    e.preventDefault();

    const rect = this.element.getBoundingClientRect();
    const halfWidth = rect.width * 0.44; // Left 44% is joystick zone

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const relY = touch.clientY - rect.top;

      if (relX < halfWidth && this.joystickTouchId === null) {
        // Left zone: Initialize dynamic virtual joystick
        this.joystickTouchId = touch.identifier;
        this.joystick.active = true;
        this.joystick.baseX = relX;
        this.joystick.baseY = relY;
        this.joystick.currentX = relX;
        this.joystick.currentY = relY;
        this.joystick.normalized = { x: 0, y: 0 };
      } else if (relX >= halfWidth && this.lookTouchId === null) {
        // Right zone: Initialize camera swipe touchpad
        this.lookTouchId = touch.identifier;
        this.lastLookPos = { x: relX, y: relY };
      }
    }
  };

  private handleTouchMove = (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.closest('button, input, select, [data-interactive]')) {
      return;
    }

    e.preventDefault();
    const rect = this.element.getBoundingClientRect();

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      const relX = touch.clientX - rect.left;
      const relY = touch.clientY - rect.top;

      if (touch.identifier === this.joystickTouchId) {
        // Update Joystick
        this.joystick.currentX = relX;
        this.joystick.currentY = relY;

        const dx = relX - this.joystick.baseX;
        const dy = relY - this.joystick.baseY;
        const dist = Math.hypot(dx, dy);

        if (dist > 0.001) {
          const clampedDist = Math.min(dist, this.maxJoystickRadius);
          const factor = clampedDist / this.maxJoystickRadius;
          const normX = (dx / dist) * factor;
          const normY = -(dy / dist) * factor; // negative Y on screen is forward movement

          this.joystick.normalized = { x: normX, y: normY };
        } else {
          this.joystick.normalized = { x: 0, y: 0 };
        }
      } else if (touch.identifier === this.lookTouchId) {
        // Update Look Delta
        const dx = relX - this.lastLookPos.x;
        const dy = relY - this.lastLookPos.y;

        this.lookDelta.x += dx;
        this.lookDelta.y += dy;

        this.lastLookPos = { x: relX, y: relY };
      }
    }
  };

  private handleTouchEnd = (e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystick.active = false;
        this.joystick.normalized = { x: 0, y: 0 };
      } else if (touch.identifier === this.lookTouchId) {
        this.lookTouchId = null;
      }
    }
  };

  /**
   * Consume look delta for this frame and reset it
   */
  public consumeLookDelta(): Vector2D {
    const delta = { x: this.lookDelta.x, y: this.lookDelta.y };
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    return delta;
  }

  public triggerJump() {
    this.actions.jump = true;
    setTimeout(() => {
      this.actions.jump = false;
    }, 120);
  }

  public toggleCrouch() {
    this.actions.crouch = !this.actions.crouch;
  }

  public toggleSprint() {
    this.actions.sprint = !this.actions.sprint;
  }

  public dispose() {
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
    this.element.removeEventListener('touchend', this.handleTouchEnd);
    this.element.removeEventListener('touchcancel', this.handleTouchEnd);
  }
}
