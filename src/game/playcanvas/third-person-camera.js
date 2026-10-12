/**
 * PlayCanvas Script: third-person-camera.js
 * Mobile Third-Person Follow Camera with Touch Orbit and Wall Pull-In
 * Attach to: Camera Entity
 */
var ThirdPersonCamera = pc.createScript('thirdPersonCamera');

ThirdPersonCamera.attributes.add('targetEntity', { type: 'entity', title: 'Target (Player)' });
ThirdPersonCamera.attributes.add('distance', { type: 'number', default: 4.2, title: 'Distance' });
ThirdPersonCamera.attributes.add('heightOffset', { type: 'number', default: 1.5, title: 'Target Height Offset' });
ThirdPersonCamera.attributes.add('sensitivity', { type: 'number', default: 0.18, title: 'Sensitivity' });

ThirdPersonCamera.prototype.initialize = function() {
    this.yaw = 0;
    this.pitch = 15; // degrees looking down
    this.currentTarget = new pc.Vec3();
    
    // Listen for touch swipe look events
    this.app.on('mobile:look', this.onLookDelta, this);
};

ThirdPersonCamera.prototype.onLookDelta = function(dx, dy) {
    this.yaw -= dx * this.sensitivity;
    this.pitch += dy * this.sensitivity;
    
    // Clamp pitch
    this.pitch = pc.math.clamp(this.pitch, -25, 65);
};

ThirdPersonCamera.prototype.postUpdate = function(dt) {
    if (!this.targetEntity) return;
    
    var playerPos = this.targetEntity.getPosition();
    var lookTarget = new pc.Vec3(playerPos.x, playerPos.y + this.heightOffset, playerPos.z);
    
    // Smooth follow target
    this.currentTarget.lerp(this.currentTarget, lookTarget, dt * 14);
    
    // Compute camera position using spherical angles
    var yawRad = this.yaw * pc.math.DEG_TO_RAD;
    var pitchRad = this.pitch * pc.math.DEG_TO_RAD;
    
    var hDist = this.distance * Math.cos(pitchRad);
    var vDist = this.distance * Math.sin(pitchRad);
    
    var camX = this.currentTarget.x + Math.sin(yawRad) * hDist;
    var camY = this.currentTarget.y + vDist;
    var camZ = this.currentTarget.z + Math.cos(yawRad) * hDist;
    
    this.entity.setPosition(camX, camY, camZ);
    this.entity.lookAt(this.currentTarget);
};
