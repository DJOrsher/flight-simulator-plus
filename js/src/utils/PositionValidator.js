/**
 * PositionValidator - Pure position and distance calculation functions
 * Single Responsibility: Position validation and distance calculations
 * NO state management, NO event handling, ONLY math functions
 */

import { configManager } from '../config/ConfigManager.js';

/**
 * Calculate 2D distance between two points
 * @param {Object} pos1 - First position {x, z}
 * @param {Object} pos2 - Second position {x, z}
 * @returns {number} Distance
 */
export function distance2D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate 3D distance between two points
 * @param {Object} pos1 - First position {x, y, z}
 * @param {Object} pos2 - Second position {x, y, z}
 * @returns {number} Distance
 */
export function distance3D(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Check if position is within tolerance of target
 * @param {Object} current - Current position {x, y, z}
 * @param {Object} target - Target position {x, y, z}
 * @param {number} [tolerance=3.0] - Distance tolerance
 * @returns {boolean} True if within tolerance
 */
export function isWithinTolerance(current, target, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.positionTolerance') || 3.0;
    }
    return distance3D(current, target) <= tolerance;
}

/**
 * Check if aircraft is at runway threshold
 * @param {Object} position - Current position {x, y, z}
 * @param {number} [tolerance=3.0] - Distance tolerance
 * @returns {boolean} True if at runway threshold
 */
export function isAtRunwayThreshold(position, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.positionTolerance') || 3.0;
    }
    const runway = configManager.getRunwayConfig();
    const threshold = runway.startPosition;
    
    return isWithinTolerance(position, threshold, tolerance);
}

/**
 * Check if aircraft is at runway end
 * @param {Object} position - Current position {x, y, z}
 * @param {number} [tolerance=3.0] - Distance tolerance
 * @returns {boolean} True if at runway end
 */
export function isAtRunwayEnd(position, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.positionTolerance') || 3.0;
    }
    const runway = configManager.getRunwayConfig();
    const end = runway.endPosition;
    
    return isWithinTolerance(position, end, tolerance);
}

/**
 * Check if aircraft is on runway
 * @param {Object} position - Current position {x, y, z}
 * @param {number} [tolerance=10.0] - Width tolerance
 * @returns {boolean} True if on runway
 */
export function isOnRunway(position, tolerance = 10.0) {
    const runway = configManager.getRunwayConfig();
    
    // Check if X position is between runway start and end
    const minX = Math.min(runway.startPosition.x, runway.endPosition.x);
    const maxX = Math.max(runway.startPosition.x, runway.endPosition.x);
    
    // Check if Z position is within runway width
    const centerZ = (runway.startPosition.z + runway.endPosition.z) / 2;
    
    return position.x >= minX - tolerance &&
           position.x <= maxX + tolerance &&
           Math.abs(position.z - centerZ) <= runway.width / 2 + tolerance;
}

/**
 * Check if aircraft is at parking position
 * @param {Object} position - Current position {x, y, z}
 * @param {string} aircraftType - Aircraft type
 * @param {number} [tolerance=3.0] - Distance tolerance
 * @returns {boolean} True if at parking position
 */
export function isAtParkingPosition(position, aircraftType, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.positionTolerance') || 3.0;
    }
    const parking = configManager.getParkingPosition(aircraftType);
    
    return isWithinTolerance(position, parking, tolerance);
}

/**
 * Check if aircraft is airborne
 * @param {Object} position - Current position {x, y, z}
 * @param {string} aircraftType - Aircraft type
 * @returns {boolean} True if airborne
 */
export function isAirborne(position, aircraftType) {
    const config = configManager.getAircraftConfig(aircraftType);
    const minHeight = config.minFlightHeight || 1;
    
    return position.y > minHeight + 5; // 5 unit buffer above minimum
}

/**
 * Check if aircraft is at safe altitude
 * @param {Object} position - Current position {x, y, z}
 * @param {number} [minAltitude=30] - Minimum safe altitude
 * @returns {boolean} True if at safe altitude
 */
export function isAtSafeAltitude(position, minAltitude = 30) {
    return position.y >= minAltitude;
}

/**
 * Check if position is within airport bounds
 * @param {Object} position - Current position {x, y, z}
 * @param {number} [boundarySize=200] - Airport boundary size
 * @returns {boolean} True if within bounds
 */
export function isWithinAirportBounds(position, boundarySize = 200) {
    return Math.abs(position.x) <= boundarySize &&
           Math.abs(position.z) <= boundarySize;
}

/**
 * Get distance to waypoint
 * @param {Object} position - Current position {x, y, z}
 * @param {Object} waypoint - Waypoint {x, z}
 * @returns {number} Distance to waypoint
 */
export function getDistanceToWaypoint(position, waypoint) {
    return distance2D(position, waypoint);
}

/**
 * Check if aircraft has reached waypoint
 * @param {Object} position - Current position {x, y, z}
 * @param {Object} waypoint - Waypoint {x, z}
 * @param {number} [tolerance=3.0] - Distance tolerance
 * @returns {boolean} True if waypoint reached
 */
export function hasReachedWaypoint(position, waypoint, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.positionTolerance') || 3.0;
    }
    return getDistanceToWaypoint(position, waypoint) <= tolerance;
}

/**
 * Get closest waypoint in route
 * @param {Object} position - Current position {x, y, z}
 * @param {Array} route - Array of waypoints
 * @returns {Object} {index, waypoint, distance}
 */
export function getClosestWaypoint(position, route) {
    if (!route || route.length === 0) {
        return { index: -1, waypoint: null, distance: Infinity };
    }

    let closestIndex = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < route.length; i++) {
        const distance = getDistanceToWaypoint(position, route[i]);
        if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = i;
        }
    }

    return {
        index: closestIndex,
        waypoint: route[closestIndex],
        distance: closestDistance
    };
}

/**
 * Calculate progress along route
 * @param {Object} position - Current position {x, y, z}
 * @param {Array} route - Array of waypoints
 * @param {number} currentWaypointIndex - Current waypoint index
 * @returns {number} Progress 0-1
 */
export function calculateRouteProgress(position, route, currentWaypointIndex) {
    if (!route || route.length === 0) return 0;
    if (currentWaypointIndex >= route.length) return 1;

    const totalWaypoints = route.length;
    const waypointProgress = currentWaypointIndex / totalWaypoints;
    
    // Add partial progress to current waypoint
    if (currentWaypointIndex < route.length) {
        const currentWaypoint = route[currentWaypointIndex];
        const prevWaypoint = currentWaypointIndex > 0 ? route[currentWaypointIndex - 1] : position;
        
        const segmentLength = distance2D(prevWaypoint, currentWaypoint);
        const segmentProgress = segmentLength > 0 ? 
            (1 - getDistanceToWaypoint(position, currentWaypoint) / segmentLength) : 0;
        
        const segmentWeight = 1 / totalWaypoints;
        return waypointProgress + (segmentProgress * segmentWeight);
    }

    return waypointProgress;
}

/**
 * Check if aircraft heading matches target heading
 * @param {number} currentHeading - Current heading in radians
 * @param {number} targetHeading - Target heading in radians
 * @param {number} [tolerance=0.1] - Heading tolerance in radians
 * @returns {boolean} True if headings match
 */
export function isHeadingAligned(currentHeading, targetHeading, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.headingTolerance') || 0.1;
    }
    
    // Normalize angles to 0-2π
    const normalizeCurrent = ((currentHeading % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    const normalizeTarget = ((targetHeading % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
    
    // Calculate shortest angular distance
    let diff = Math.abs(normalizeCurrent - normalizeTarget);
    diff = Math.min(diff, 2 * Math.PI - diff);
    
    return diff <= tolerance;
}

/**
 * Calculate heading between two points
 * @param {Object} from - Start position {x, z}
 * @param {Object} to - End position {x, z}
 * @returns {number} Heading in radians
 */
export function calculateHeading(from, to) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    return Math.atan2(-dx, -dz);
}

/**
 * Check if aircraft speed matches target speed
 * @param {number} currentSpeed - Current speed
 * @param {number} targetSpeed - Target speed
 * @param {number} [tolerance=1.0] - Speed tolerance
 * @returns {boolean} True if speeds match
 */
export function isSpeedAligned(currentSpeed, targetSpeed, tolerance = null) {
    if (tolerance === null) {
        tolerance = configManager.get('validation.speedTolerance') || 1.0;
    }
    return Math.abs(currentSpeed - targetSpeed) <= tolerance;
}

/**
 * Validate aircraft position constraints
 * @param {Object} position - Position to validate {x, y, z}
 * @param {string} aircraftType - Aircraft type
 * @param {string} phase - Current operation phase
 * @returns {Object} Validation result {isValid, violations}
 */
export function validatePositionConstraints(position, aircraftType, phase) {
    const violations = [];
    
    // Check airport bounds
    if (!isWithinAirportBounds(position)) {
        violations.push('outside_airport_bounds');
    }
    
    // Check minimum altitude when airborne
    if (phase === 'takeoff' || phase === 'cruise' || phase === 'landing') {
        const config = configManager.getAircraftConfig(aircraftType);
        if (position.y < config.minFlightHeight) {
            violations.push('below_minimum_altitude');
        }
    }
    
    // Check ground clearance when on ground
    if (phase === 'taxi' || phase === 'parking') {
        if (position.y < 0.5) {
            violations.push('below_ground_level');
        }
    }
    
    return {
        isValid: violations.length === 0,
        violations
    };
}