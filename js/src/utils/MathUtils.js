/**
 * Mathematical Utility Functions
 * Common mathematical operations used throughout the simulator
 */

/**
 * Normalize angle to range [-PI, PI]
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= Math.PI * 2;
    while (angle < -Math.PI) angle += Math.PI * 2;
    return angle;
}

/**
 * Calculate distance between two 2D points
 * @param {number} x1 - First point X coordinate
 * @param {number} z1 - First point Z coordinate
 * @param {number} x2 - Second point X coordinate
 * @param {number} z2 - Second point Z coordinate
 * @returns {number} Distance between points
 */
export function distance2D(x1, z1, x2, z2) {
    const dx = x2 - x1;
    const dz = z2 - z1;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate distance between two 3D points
 * @param {THREE.Vector3} point1 - First point
 * @param {THREE.Vector3} point2 - Second point
 * @returns {number} Distance between points
 */
export function distance3D(point1, point2) {
    return point1.distanceTo(point2);
}

/**
 * Linear interpolation between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Calculate angle from one point to another
 * @param {number} fromX - Starting point X
 * @param {number} fromZ - Starting point Z
 * @param {number} toX - Target point X
 * @param {number} toZ - Target point Z
 * @returns {number} Angle in radians
 */
export function angleToTarget(fromX, fromZ, toX, toZ) {
    const dx = toX - fromX;
    const dz = toZ - fromZ;
    return Math.atan2(-dz, dx);
}

/**
 * Calculate forward direction vector from yaw angle
 * @param {number} yaw - Yaw angle in radians
 * @returns {Object} Direction vector {x, z}
 */
export function forwardDirection(yaw) {
    return {
        x: -Math.sin(yaw),  // Fixed: 90 degree offset
        z: -Math.cos(yaw)
    };
}

/**
 * Calculate right direction vector from yaw angle
 * @param {number} yaw - Yaw angle in radians
 * @returns {Object} Direction vector {x, z}
 */
export function rightDirection(yaw) {
    return {
        x: Math.cos(yaw),   // Fixed: reversed left/right
        z: -Math.sin(yaw)
    };
}

/**
 * Generate a random value within a range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random value
 */
export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * Check if a point is within a rectangular boundary
 * @param {number} x - Point X coordinate
 * @param {number} z - Point Z coordinate
 * @param {number} centerX - Rectangle center X
 * @param {number} centerZ - Rectangle center Z
 * @param {number} width - Rectangle width
 * @param {number} depth - Rectangle depth
 * @returns {boolean} True if point is within boundary
 */
export function isWithinRectangle(x, z, centerX, centerZ, width, depth) {
    const halfWidth = width / 2;
    const halfDepth = depth / 2;
    return x >= centerX - halfWidth &&
           x <= centerX + halfWidth &&
           z >= centerZ - halfDepth &&
           z <= centerZ + halfDepth;
}

/**
 * Check if a point is within a circular boundary
 * @param {number} x - Point X coordinate
 * @param {number} z - Point Z coordinate
 * @param {number} centerX - Circle center X
 * @param {number} centerZ - Circle center Z
 * @param {number} radius - Circle radius
 * @returns {boolean} True if point is within boundary
 */
export function isWithinCircle(x, z, centerX, centerZ, radius) {
    const distance = distance2D(x, z, centerX, centerZ);
    return distance <= radius;
}

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}