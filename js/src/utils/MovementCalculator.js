/**
 * MovementCalculator - Pure movement and physics calculation functions
 * Single Responsibility: Movement calculations and interpolation
 * NO state management, NO event handling, ONLY movement math
 */

import { configManager } from '../config/ConfigManager.js';

/**
 * Normalize angle to 0-2π range
 * @param {number} angle - Angle in radians
 * @returns {number} Normalized angle
 */
export function normalizeAngle(angle) {
    return ((angle % (2 * Math.PI)) + (2 * Math.PI)) % (2 * Math.PI);
}

/**
 * Calculate shortest angular difference between two angles
 * @param {number} from - Start angle in radians
 * @param {number} to - Target angle in radians
 * @returns {number} Angular difference (-π to π)
 */
export function angularDifference(from, to) {
    let diff = to - from;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return diff;
}

/**
 * Calculate forward direction vector from heading
 * @param {number} heading - Heading in radians
 * @returns {Object} Direction vector {x, z}
 */
export function getForwardDirection(heading) {
    return {
        x: Math.cos(heading - Math.PI/2),
        z: -Math.sin(heading - Math.PI/2)
    };
}

/**
 * Calculate right direction vector from heading
 * @param {number} heading - Heading in radians
 * @returns {Object} Direction vector {x, z}
 */
export function getRightDirection(heading) {
    return {
        x: Math.cos(heading),
        z: -Math.sin(heading)
    };
}

/**
 * Calculate new position after movement
 * @param {Object} position - Current position {x, y, z}
 * @param {Object} velocity - Velocity vector {x, y, z}
 * @param {number} deltaTime - Time step in seconds
 * @returns {Object} New position {x, y, z}
 */
export function calculateNewPosition(position, velocity, deltaTime) {
    return {
        x: position.x + velocity.x * deltaTime,
        y: position.y + velocity.y * deltaTime,
        z: position.z + velocity.z * deltaTime
    };
}

/**
 * Calculate velocity from speed and heading
 * @param {number} speed - Speed magnitude
 * @param {number} heading - Heading in radians
 * @param {number} [verticalSpeed=0] - Vertical speed component
 * @returns {Object} Velocity vector {x, y, z}
 */
export function calculateVelocity(speed, heading, verticalSpeed = 0) {
    const forward = getForwardDirection(heading);
    return {
        x: forward.x * speed,
        y: verticalSpeed,
        z: forward.z * speed
    };
}

/**
 * Interpolate between two positions
 * @param {Object} start - Start position {x, y, z}
 * @param {Object} end - End position {x, y, z}
 * @param {number} progress - Progress 0-1
 * @returns {Object} Interpolated position {x, y, z}
 */
export function interpolatePosition(start, end, progress) {
    const t = Math.max(0, Math.min(1, progress));
    return {
        x: start.x + (end.x - start.x) * t,
        y: start.y + (end.y - start.y) * t,
        z: start.z + (end.z - start.z) * t
    };
}

/**
 * Smooth interpolation using ease-in-out curve
 * @param {Object} start - Start position {x, y, z}
 * @param {Object} end - End position {x, y, z}
 * @param {number} progress - Progress 0-1
 * @returns {Object} Smoothly interpolated position {x, y, z}
 */
export function smoothInterpolatePosition(start, end, progress) {
    // Ease-in-out cubic curve
    const t = progress < 0.5 ? 
        4 * progress * progress * progress : 
        1 - Math.pow(-2 * progress + 2, 3) / 2;
    
    return interpolatePosition(start, end, t);
}

/**
 * Calculate turn towards target heading
 * @param {number} currentHeading - Current heading in radians
 * @param {number} targetHeading - Target heading in radians
 * @param {number} turnRate - Maximum turn rate in radians per second
 * @param {number} deltaTime - Time step in seconds
 * @returns {number} New heading in radians
 */
export function calculateTurn(currentHeading, targetHeading, turnRate, deltaTime) {
    const angleDiff = angularDifference(currentHeading, targetHeading);
    const maxTurn = turnRate * deltaTime;
    
    if (Math.abs(angleDiff) <= maxTurn) {
        return targetHeading;
    }
    
    return normalizeAngle(currentHeading + Math.sign(angleDiff) * maxTurn);
}

/**
 * Calculate acceleration towards target speed
 * @param {number} currentSpeed - Current speed
 * @param {number} targetSpeed - Target speed
 * @param {number} acceleration - Acceleration rate
 * @param {number} deltaTime - Time step in seconds
 * @returns {number} New speed
 */
export function calculateAcceleration(currentSpeed, targetSpeed, acceleration, deltaTime) {
    const speedDiff = targetSpeed - currentSpeed;
    const maxSpeedChange = acceleration * deltaTime;
    
    if (Math.abs(speedDiff) <= maxSpeedChange) {
        return targetSpeed;
    }
    
    return currentSpeed + Math.sign(speedDiff) * maxSpeedChange;
}

/**
 * Calculate movement towards waypoint
 * @param {Object} position - Current position {x, y, z}
 * @param {Object} waypoint - Target waypoint {x, z}
 * @param {number} speed - Movement speed
 * @param {number} deltaTime - Time step in seconds
 * @returns {Object} Movement result {newPosition, heading, distance}
 */
export function calculateMovementToWaypoint(position, waypoint, speed, deltaTime) {
    const dx = waypoint.x - position.x;
    const dz = waypoint.z - position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    if (distance < 0.1) {
        return {
            newPosition: { ...position },
            heading: Math.atan2(-dx, -dz),
            distance: 0
        };
    }
    
    const normalizedDx = dx / distance;
    const normalizedDz = dz / distance;
    const moveDistance = Math.min(speed * deltaTime, distance);
    
    const newPosition = {
        x: position.x + normalizedDx * moveDistance,
        y: position.y,
        z: position.z + normalizedDz * moveDistance
    };
    
    return {
        newPosition,
        heading: Math.atan2(-dx, -dz),
        distance: distance - moveDistance
    };
}

/**
 * Calculate aircraft physics (simplified)
 * @param {Object} state - Current state {position, velocity, heading, speed}
 * @param {string} aircraftType - Aircraft type
 * @param {Object} controls - Control inputs {throttle, elevator, rudder}
 * @param {number} deltaTime - Time step in seconds
 * @returns {Object} New state {position, velocity, heading, speed}
 */
export function calculateAircraftPhysics(state, aircraftType, controls, deltaTime) {
    const config = configManager.getAircraftConfig(aircraftType);
    const { throttle = 0, elevator = 0, rudder = 0 } = controls;
    
    // Calculate new speed
    const targetSpeed = throttle * config.maxSpeed;
    const newSpeed = calculateAcceleration(
        state.speed, 
        targetSpeed, 
        config.acceleration, 
        deltaTime
    );
    
    // Calculate new heading (simplified yaw)
    const turnInput = rudder * config.turnRate;
    const newHeading = normalizeAngle(state.heading + turnInput * deltaTime);
    
    // Calculate vertical speed (simplified pitch)
    const verticalSpeed = elevator * newSpeed * 0.5; // Simplified climb rate
    
    // Calculate new velocity
    const newVelocity = calculateVelocity(newSpeed, newHeading, verticalSpeed);
    
    // Calculate new position
    const newPosition = calculateNewPosition(state.position, newVelocity, deltaTime);
    
    // Apply ground constraints
    if (newPosition.y < config.minFlightHeight) {
        newPosition.y = config.minFlightHeight;
        newVelocity.y = 0;
    }
    
    return {
        position: newPosition,
        velocity: newVelocity,
        heading: newHeading,
        speed: newSpeed
    };
}

/**
 * Calculate taxi movement with realistic ground physics
 * @param {Object} position - Current position {x, y, z}
 * @param {Object} target - Target position {x, z}
 * @param {number} currentHeading - Current heading in radians
 * @param {string} aircraftType - Aircraft type
 * @param {number} deltaTime - Time step in seconds
 * @returns {Object} Movement result {position, heading, speed, reachedTarget}
 */
export function calculateTaxiMovement(position, target, currentHeading, aircraftType, deltaTime) {
    const config = configManager.getAircraftConfig(aircraftType);
    const taxiSpeed = config.taxiSpeed || 3.0;
    const turnRate = config.turnRate || 0.3;
    
    // Calculate desired heading to target
    const dx = target.x - position.x;
    const dz = target.z - position.z;
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz);
    
    if (distanceToTarget < 0.5) {
        return {
            position: { ...position, y: 1.0 },
            heading: currentHeading,
            speed: 0,
            reachedTarget: true
        };
    }
    
    const desiredHeading = Math.atan2(-dx, -dz);
    
    // Calculate turn towards target
    const newHeading = calculateTurn(currentHeading, desiredHeading, turnRate, deltaTime);
    
    // Calculate movement speed based on heading alignment
    const headingError = Math.abs(angularDifference(currentHeading, desiredHeading));
    const speedMultiplier = Math.max(0.3, 1.0 - headingError / Math.PI);
    const currentSpeed = taxiSpeed * speedMultiplier;
    
    // Calculate movement
    const movement = calculateMovementToWaypoint(position, target, currentSpeed, deltaTime);
    
    return {
        position: { ...movement.newPosition, y: 1.0 },
        heading: newHeading,
        speed: currentSpeed,
        reachedTarget: movement.distance < 0.5
    };
}

/**
 * Calculate banking angle for turns
 * @param {number} speed - Current speed
 * @param {number} turnRate - Turn rate in radians per second
 * @param {number} [maxBank=0.5] - Maximum bank angle in radians
 * @returns {number} Bank angle in radians
 */
export function calculateBankAngle(speed, turnRate, maxBank = 0.5) {
    if (speed === 0) return 0;
    
    // Simplified bank angle calculation
    const bankAngle = (turnRate * speed) / 20; // Arbitrary scaling factor
    return Math.max(-maxBank, Math.min(maxBank, bankAngle));
}

/**
 * Calculate pitch angle for climb/descent
 * @param {number} verticalSpeed - Vertical speed component
 * @param {number} horizontalSpeed - Horizontal speed component
 * @param {number} [maxPitch=0.5] - Maximum pitch angle in radians
 * @returns {number} Pitch angle in radians
 */
export function calculatePitchAngle(verticalSpeed, horizontalSpeed, maxPitch = 0.5) {
    if (horizontalSpeed === 0) return 0;
    
    const pitchAngle = Math.atan2(verticalSpeed, horizontalSpeed);
    return Math.max(-maxPitch, Math.min(maxPitch, pitchAngle));
}

/**
 * Apply aerodynamic drag
 * @param {Object} velocity - Current velocity {x, y, z}
 * @param {number} dragCoefficient - Drag coefficient
 * @param {number} deltaTime - Time step in seconds
 * @returns {Object} Velocity after drag {x, y, z}
 */
export function applyDrag(velocity, dragCoefficient, deltaTime) {
    const dragFactor = Math.max(0, 1 - dragCoefficient * deltaTime);
    return {
        x: velocity.x * dragFactor,
        y: velocity.y * dragFactor,
        z: velocity.z * dragFactor
    };
}

/**
 * Calculate ground effect (simplified)
 * @param {number} altitude - Current altitude
 * @param {number} aircraftLength - Aircraft length
 * @returns {number} Ground effect multiplier (0-1)
 */
export function calculateGroundEffect(altitude, aircraftLength) {
    const groundEffectHeight = aircraftLength * 0.5;
    if (altitude >= groundEffectHeight) return 0;
    
    return 1 - (altitude / groundEffectHeight);
}

/**
 * Calculate wind effect on movement
 * @param {Object} velocity - Current velocity {x, y, z}
 * @param {Object} windVector - Wind velocity {x, y, z}
 * @returns {Object} Velocity with wind effect {x, y, z}
 */
export function applyWindEffect(velocity, windVector) {
    return {
        x: velocity.x + windVector.x,
        y: velocity.y + windVector.y,
        z: velocity.z + windVector.z
    };
}

/**
 * Validate movement parameters
 * @param {Object} params - Movement parameters
 * @returns {Object} Validation result {isValid, errors}
 */
export function validateMovementParameters(params) {
    const errors = [];
    
    if (!params.position || typeof params.position !== 'object') {
        errors.push('invalid_position');
    }
    
    if (typeof params.speed !== 'number' || params.speed < 0) {
        errors.push('invalid_speed');
    }
    
    if (typeof params.heading !== 'number') {
        errors.push('invalid_heading');
    }
    
    if (typeof params.deltaTime !== 'number' || params.deltaTime <= 0) {
        errors.push('invalid_deltaTime');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}