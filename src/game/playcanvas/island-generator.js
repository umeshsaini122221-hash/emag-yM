/**
 * PlayCanvas Script: island-generator.js
 * Procedural Island, Landmarks, and Boundaries
 * Attach to: Island Root Entity
 */
var IslandGenerator = pc.createScript('islandGenerator');

IslandGenerator.attributes.add('islandRadius', { type: 'number', default: 120, title: 'Radius (m)' });

IslandGenerator.prototype.initialize = function() {
    this.createBoundaryRing();
};

IslandGenerator.prototype.getTerrainHeight = function(x, z) {
    var dist = Math.sqrt(x * x + z * z);
    if (dist > this.islandRadius) return -3.0;
    
    var mask = Math.max(0, 1 - Math.pow(dist / this.islandRadius, 2.0));
    var h1 = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 6.0;
    var h2 = Math.sin(x * 0.06 + 1.0) * Math.sin(z * 0.05) * 3.0;
    
    // Hill at (15, 10)
    var dCenter = Math.hypot(x - 15, z - 10);
    var peak = Math.max(0, 1 - dCenter / 45) * 11.0;
    
    return (2.0 + h1 + h2 + peak) * mask;
};

IslandGenerator.prototype.createBoundaryRing = function() {
    var entity = new pc.Entity('SafeZonePerimeter');
    entity.addComponent('model', { type: 'cylinder' });
    entity.setLocalScale(this.islandRadius * 2, 25, this.islandRadius * 2);
    entity.setLocalPosition(0, 12, 0);
    this.entity.addChild(entity);
};
