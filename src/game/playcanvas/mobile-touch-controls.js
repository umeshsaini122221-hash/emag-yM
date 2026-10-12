/**
 * PlayCanvas Script: mobile-touch-controls.js
 * Multi-touch Virtual Joystick & Look Swipe for Android Chrome Mobile
 * Attach to: Root Scene or UI Manager Entity
 */
var MobileTouchControls = pc.createScript('mobileTouchControls');

MobileTouchControls.prototype.initialize = function() {
    this.joystickTouchId = null;
    this.lookTouchId = null;
    
    this.joystickBase = new pc.Vec2();
    this.lastLookPos = new pc.Vec2();
    this.maxRadius = 60; // px
    
    var touch = this.app.touch;
    if (touch) {
        touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        touch.on(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchEnd, this);
    }
};

MobileTouchControls.prototype.onTouchStart = function(event) {
    var screenW = window.innerWidth;
    var halfW = screenW * 0.45;
    
    for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        if (t.x < halfW && this.joystickTouchId === null) {
            this.joystickTouchId = t.id;
            this.joystickBase.set(t.x, t.y);
            this.app.fire('mobile:move', 0, 0);
        } else if (t.x >= halfW && this.lookTouchId === null) {
            this.lookTouchId = t.id;
            this.lastLookPos.set(t.x, t.y);
        }
    }
};

MobileTouchControls.prototype.onTouchMove = function(event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        if (t.id === this.joystickTouchId) {
            var dx = t.x - this.joystickBase.x;
            var dy = t.y - this.joystickBase.y;
            var len = Math.sqrt(dx * dx + dy * dy);
            
            if (len > 0) {
                var cl = Math.min(len, this.maxRadius);
                var normX = (dx / len) * (cl / this.maxRadius);
                var normY = -(dy / len) * (cl / this.maxRadius); // negative Y is forward
                this.app.fire('mobile:move', normX, normY);
            }
        } else if (t.id === this.lookTouchId) {
            var ldx = t.x - this.lastLookPos.x;
            var ldy = t.y - this.lastLookPos.y;
            this.app.fire('mobile:look', ldx, ldy);
            this.lastLookPos.set(t.x, t.y);
        }
    }
};

MobileTouchControls.prototype.onTouchEnd = function(event) {
    for (var i = 0; i < event.changedTouches.length; i++) {
        var t = event.changedTouches[i];
        if (t.id === this.joystickTouchId) {
            this.joystickTouchId = null;
            this.app.fire('mobile:move', 0, 0);
        } else if (t.id === this.lookTouchId) {
            this.lookTouchId = null;
        }
    }
};
