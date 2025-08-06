/**
 * Geometry Factory
 * Reusable geometry creation functions for common shapes and components
 */

/**
 * Create a cylinder geometry for engines, struts, etc.
 * @param {number} radiusTop - Top radius
 * @param {number} radiusBottom - Bottom radius
 * @param {number} height - Cylinder height
 * @param {number} segments - Number of segments (default: 8)
 * @returns {THREE.CylinderGeometry} Cylinder geometry
 */
export function createCylinder(radiusTop, radiusBottom, height, segments = 8) {
    return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
}

/**
 * Create a box geometry for wings, fuselage, etc.
 * @param {number} width - Box width
 * @param {number} height - Box height
 * @param {number} depth - Box depth
 * @returns {THREE.BoxGeometry} Box geometry
 */
export function createBox(width, height, depth) {
    return new THREE.BoxGeometry(width, height, depth);
}

/**
 * Create a sphere geometry for cockpits, heads, etc.
 * @param {number} radius - Sphere radius
 * @param {number} widthSegments - Width segments (default: 12)
 * @param {number} heightSegments - Height segments (default: 8)
 * @returns {THREE.SphereGeometry} Sphere geometry
 */
export function createSphere(radius, widthSegments = 12, heightSegments = 8) {
    return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
}

/**
 * Create a cone geometry for nose cones, etc.
 * @param {number} radius - Cone base radius
 * @param {number} height - Cone height
 * @param {number} segments - Number of segments (default: 8)
 * @returns {THREE.ConeGeometry} Cone geometry
 */
export function createCone(radius, height, segments = 8) {
    return new THREE.ConeGeometry(radius, height, segments);
}

/**
 * Create a plane geometry for runways, ground, etc.
 * @param {number} width - Plane width
 * @param {number} height - Plane height
 * @returns {THREE.PlaneGeometry} Plane geometry
 */
export function createPlane(width, height) {
    return new THREE.PlaneGeometry(width, height);
}

/**
 * Create a circle geometry for helipads, etc.
 * @param {number} radius - Circle radius
 * @param {number} segments - Number of segments (default: 32)
 * @returns {THREE.CircleGeometry} Circle geometry
 */
export function createCircle(radius, segments = 32) {
    return new THREE.CircleGeometry(radius, segments);
}

/**
 * Create a ring geometry for helipad markings, etc.
 * @param {number} innerRadius - Inner radius
 * @param {number} outerRadius - Outer radius
 * @param {number} segments - Number of segments (default: 32)
 * @returns {THREE.RingGeometry} Ring geometry
 */
export function createRing(innerRadius, outerRadius, segments = 32) {
    return new THREE.RingGeometry(innerRadius, outerRadius, segments);
}

/**
 * Create a material with specified properties
 * @param {number} color - Material color (hex)
 * @param {Object} options - Additional material options
 * @returns {THREE.MeshLambertMaterial} Material
 */
export function createMaterial(color, options = {}) {
    return new THREE.MeshLambertMaterial({
        color: color,
        ...options
    });
}

/**
 * Create a transparent material for glass, etc.
 * @param {number} color - Material color (hex)
 * @param {number} opacity - Material opacity (0-1)
 * @returns {THREE.MeshLambertMaterial} Transparent material
 */
export function createTransparentMaterial(color, opacity = 0.7) {
    return new THREE.MeshLambertMaterial({
        color: color,
        transparent: true,
        opacity: opacity
    });
}

/**
 * Create a line material for boundaries, etc.
 * @param {number} color - Line color (hex)
 * @param {number} opacity - Line opacity (default: 1.0)
 * @returns {THREE.LineBasicMaterial} Line material
 */
export function createLineMaterial(color, opacity = 1.0) {
    return new THREE.LineBasicMaterial({
        color: color,
        transparent: opacity < 1.0,
        opacity: opacity
    });
}

/**
 * Create a mesh with geometry and material
 * @param {THREE.Geometry} geometry - Mesh geometry
 * @param {THREE.Material} material - Mesh material
 * @param {boolean} castShadow - Whether mesh casts shadows (default: true)
 * @param {boolean} receiveShadow - Whether mesh receives shadows (default: true)
 * @returns {THREE.Mesh} Mesh object
 */
export function createMesh(geometry, material, castShadow = true, receiveShadow = true) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
    return mesh;
}

/**
 * Create a line from points
 * @param {THREE.Vector3[]} points - Array of points
 * @param {THREE.Material} material - Line material
 * @returns {THREE.Line} Line object
 */
export function createLine(points, material) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return new THREE.Line(geometry, material);
}

/**
 * Position a mesh at specified coordinates
 * @param {THREE.Mesh} mesh - Mesh to position
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @param {number} z - Z coordinate
 * @param {number} rotationY - Y rotation in radians (default: 0)
 */
export function positionMesh(mesh, x, y, z, rotationY = 0) {
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotationY;
}

/**
 * Create a propeller group for aircraft
 * @param {number} hubRadius - Propeller hub radius
 * @param {number} hubHeight - Propeller hub height
 * @param {number} bladeLength - Blade length
 * @param {number} bladeCount - Number of blades
 * @param {number} color - Propeller color
 * @returns {THREE.Group} Propeller group
 */
export function createPropeller(hubRadius, hubHeight, bladeLength, bladeCount, color = 0x333333) {
    const propGroup = new THREE.Group();
    
    // Hub
    const hubGeometry = createCylinder(hubRadius, hubRadius, hubHeight, 8);
    const hubMaterial = createMaterial(color);
    const hub = createMesh(hubGeometry, hubMaterial);
    hub.rotation.z = Math.PI / 2;
    propGroup.add(hub);
    
    // Blades
    const bladeGeometry = createBox(0.05, bladeLength, 0.15);
    const bladeMaterial = createMaterial(0x2c2c2c);
    
    for (let i = 0; i < bladeCount; i++) {
        const blade = createMesh(bladeGeometry, bladeMaterial);
        blade.rotation.z = i * (2 * Math.PI / bladeCount);
        propGroup.add(blade);
    }
    
    return propGroup;
}