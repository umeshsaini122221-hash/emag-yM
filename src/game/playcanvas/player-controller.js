/**
 * PlayCanvas Script: player-controller.js
 * Phase 1 & 2: Mobile Third-Person Player Kinematics & Stance Management
 * Attach to: Player Entity (Root containing mesh or model)
 */
var PlayerController = pc.createScript('playerController');

PlayerController.attributes.add('walkSpeed', { type: 'number', default: 4.8, title: 'Walk Speed' });
PlayerController.attributes.add('sprintSpeed', { type: 'number', default: 7.8, title: 'Sprint Speed' });
PlayerController.attributes.add('crouchSpeed', { type: 'number', default: 2.4, title: 'Crouch Speed' });
PlayerController.attributes.add('jumpImpulse', { type: 'number', default: 7.5, title: 'Jump Force' });
PlayerController.attributes.add('gravity', { type: 'number', default: -20.0, title: 'Gravity' });
PlayerController.attributes.add('cameraEntity', { type: 'entity', title: 'Camera Entity' });

PlayerController.prototype.initialize = function() {
    this.velocity = new pc.Vec3();
    this.isGrounded = true;
    this.stance = 'standing'; // 'standing', 'crouching', 'jumping', 'sprinting'
    this.targetRotationY = 0;
    
    // Listen for mobile touch input events
    this.app.on('mobile:move', this.onMoveInput, this);
    this.app.on('mobile:jump', this.onJumpInput, this);
    this.app.on('mobile:crouch', this.onCrouchToggle, this);
    this.app.on('mobile:sprint', this.onSprintToggle, this);
    
    this.inputVector = new pc.Vec2(0, 0);
    this.isSprinting = false;
    this.isCrouching = false;
};

PlayerController.prototype.onMoveInput = function(normX, normY) {
    this.inputVector.set(normX, normY);
};

PlayerController.prototype.onJumpInput = function() {
    if (this.isGrounded && !this.isCrouching) {
        this.velocity.y = this.jumpImpulse;
        this.isGrounded = false;
        this.app.fire('audio:jump');
    }
};

PlayerController.prototype.onCrouchToggle = function() {
    this.isCrouching = !this.isCrouching;
};

PlayerController.prototype.onSprintToggle = function() {
    this.isSprinting = !this.isSprinting;
};

PlayerController.prototype.update = function(dt) {
    var hasMoveInput = this.inputVector.lengthSq() > 0.01;
    var speed = this.walkSpeed;
    
    if (this.isCrouching) {
        speed = this.crouchSpeed;
        this.stance = 'crouching';
    } else if (this.isSprinting && hasMoveInput) {
        speed = this.sprintSpeed;
        this.stance = 'sprinting';
    } else if (!this.isGrounded) {
        this.stance = 'jumping';
    } else {
        this.stance = 'standing';
    }

    // Camera relative direction
    var camYaw = 0;
    if (this.cameraEntity) {
        camYaw = this.cameraEntity.getEulerAngles().y * pc.math.DEG_TO_RAD;
    }
    
    var worldMoveX = 0;
    var worldMoveZ = 0;
    
    if (hasMoveInput) {
        var angle = Math.atan2(this.inputVector.x, this.inputVector.y) + camYaw;
        worldMoveX = Math.sin(angle) * speed;
        worldMoveZ = Math.cos(angle) * speed;
        
        // Smoothly rotate character toward movement heading
        this.entity.setEulerAngles(0, angle * pc.math.RAD_TO_DEG, 0);
    }
    
    // Lerp horizontal velocity
    this.velocity.x = pc.math.lerp(this.velocity.x, worldMoveX, dt * 16);
    this.velocity.z = pc.math.lerp(this.velocity.z, worldMoveZ, dt * 16);
    
    // Gravity
    if (!this.isGrounded) {
        this.velocity.y += this.gravity * dt;
    }
    
    // Position translation
    var pos = this.entity.getPosition();
    pos.x += this.velocity.x * dt;
    pos.y += this.velocity.y * dt;
    pos.z += this.velocity.z * dt;
    
    // Ground clamp (Terrain query)
    var groundY = 0; // Replace with raycast or island elevation function
    if (pos.y <= groundY) {
        pos.y = groundY;
        this.velocity.y = 0;
        this.isGrounded = true;
    }
    
    this.entity.setPosition(pos);
};
