/**
 * RouteCalculator - Pure route calculation and path optimization functions
 * Single Responsibility: Route calculation and waypoint generation
 * NO state management, NO event handling, ONLY route math
 */

import { configManager } from '../config/ConfigManager.js';
import { distance2D, calculateHeading } from './PositionValidator.js';

/**
 * Get taxi route for aircraft type and direction
 * @param {string} aircraftType - Aircraft type
 * @param {string} direction - 'toRunway' or 'fromRunway'
 * @returns {Array} Array of waypoints
 */
export function getTaxiRoute(aircraftType, direction) {
    return configManager.getTaxiRoute(aircraftType, direction);
}

/**
 * Calculate optimized route between two points
 * @param {Object} start - Start position {x, z}
 * @param {Object} end - End position {x, z}
 * @param {Object} [options] - Route options
 * @param {number} [options.waypointSpacing=20] - Distance between waypoints
 * @param {Array} [options.obstacles] - Obstacles to avoid
 * @returns {Array} Array of waypoints
 */
export function calculateDirectRoute(start, end, options = {}) {
    const { waypointSpacing = 20, obstacles = [] } = options;
    
    const route = [{ ...start, name: 'start' }];
    const totalDistance = distance2D(start, end);
    
    if (totalDistance <= waypointSpacing) {
        route.push({ ...end, name: 'end' });
        return route;
    }
    
    const numWaypoints = Math.floor(totalDistance / waypointSpacing);
    const actualSpacing = totalDistance / (numWaypoints + 1);
    
    for (let i = 1; i <= numWaypoints; i++) {
        const progress = i / (numWaypoints + 1);
        const waypoint = {
            x: start.x + (end.x - start.x) * progress,
            z: start.z + (end.z - start.z) * progress,
            name: `waypoint_${i}`
        };
        route.push(waypoint);
    }
    
    route.push({ ...end, name: 'end' });
    return route;
}

/**
 * Generate flight pattern route
 * @param {Object} center - Center position {x, z}
 * @param {string} patternType - 'rectangular', 'circular', 'oval'
 * @param {Object} [options] - Pattern options
 * @returns {Array} Array of waypoints
 */
export function generateFlightPattern(center, patternType, options = {}) {
    const {
        width = 100,
        height = 80,
        radius = 50,
        altitude = 30,
        numPoints = 8
    } = options;
    
    const route = [];
    
    switch (patternType) {
        case 'rectangular':
            route.push(
                { x: center.x - width/2, y: altitude, z: center.z - height/2, name: 'pattern_sw' },
                { x: center.x + width/2, y: altitude, z: center.z - height/2, name: 'pattern_se' },
                { x: center.x + width/2, y: altitude, z: center.z + height/2, name: 'pattern_ne' },
                { x: center.x - width/2, y: altitude, z: center.z + height/2, name: 'pattern_nw' }
            );
            break;
            
        case 'circular':
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * 2 * Math.PI;
                route.push({
                    x: center.x + Math.cos(angle) * radius,
                    y: altitude,
                    z: center.z + Math.sin(angle) * radius,
                    name: `pattern_${i}`
                });
            }
            break;
            
        case 'oval':
            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * 2 * Math.PI;
                route.push({
                    x: center.x + Math.cos(angle) * width/2,
                    y: altitude,
                    z: center.z + Math.sin(angle) * height/2,
                    name: `pattern_${i}`
                });
            }
            break;
    }
    
    return route;
}

/**
 * Calculate landing approach route
 * @param {Object} runwayEnd - Runway end position {x, y, z}
 * @param {number} runwayHeading - Runway heading in radians
 * @param {Object} [options] - Approach options
 * @returns {Array} Array of waypoints
 */
export function calculateLandingApproach(runwayEnd, runwayHeading, options = {}) {
    const {
        approachDistance = 150,
        approachHeight = 30,
        finalApproachDistance = 50,
        finalApproachHeight = 10,
        numWaypoints = 4
    } = options;
    
    const route = [];
    
    // Calculate approach direction (opposite of runway heading)
    const approachHeading = runwayHeading + Math.PI;
    const approachDx = Math.cos(approachHeading - Math.PI/2);
    const approachDz = -Math.sin(approachHeading - Math.PI/2);
    
    // Initial approach point
    route.push({
        x: runwayEnd.x + approachDx * approachDistance,
        y: approachHeight,
        z: runwayEnd.z + approachDz * approachDistance,
        name: 'initial_approach'
    });
    
    // Intermediate waypoints
    for (let i = 1; i < numWaypoints - 1; i++) {
        const progress = i / (numWaypoints - 1);
        const distance = approachDistance * (1 - progress) + finalApproachDistance * progress;
        const height = approachHeight * (1 - progress) + finalApproachHeight * progress;
        
        route.push({
            x: runwayEnd.x + approachDx * distance,
            y: height,
            z: runwayEnd.z + approachDz * distance,
            name: `approach_${i}`
        });
    }
    
    // Final approach point
    route.push({
        x: runwayEnd.x + approachDx * finalApproachDistance,
        y: finalApproachHeight,
        z: runwayEnd.z + approachDz * finalApproachDistance,
        name: 'final_approach'
    });
    
    // Touchdown point
    route.push({
        x: runwayEnd.x,
        y: runwayEnd.y,
        z: runwayEnd.z,
        name: 'touchdown'
    });
    
    return route;
}

/**
 * Calculate takeoff departure route
 * @param {Object} runwayStart - Runway start position {x, y, z}
 * @param {number} runwayHeading - Runway heading in radians
 * @param {Object} [options] - Departure options
 * @returns {Array} Array of waypoints
 */
export function calculateTakeoffDeparture(runwayStart, runwayHeading, options = {}) {
    const {
        climbDistance = 100,
        climbHeight = 50,
        cruiseHeight = 40,
        numWaypoints = 4
    } = options;
    
    const route = [];
    
    // Calculate departure direction (same as runway heading)
    const departureDx = Math.cos(runwayHeading - Math.PI/2);
    const departureDz = -Math.sin(runwayHeading - Math.PI/2);
    
    // Takeoff roll start
    route.push({
        x: runwayStart.x,
        y: runwayStart.y,
        z: runwayStart.z,
        name: 'takeoff_start'
    });
    
    // Rotation point
    route.push({
        x: runwayStart.x + departureDx * 30,
        y: runwayStart.y,
        z: runwayStart.z + departureDz * 30,
        name: 'rotation'
    });
    
    // Climb waypoints
    for (let i = 1; i <= numWaypoints; i++) {
        const progress = i / numWaypoints;
        const distance = climbDistance * progress;
        const height = runwayStart.y + climbHeight * progress;
        
        route.push({
            x: runwayStart.x + departureDx * distance,
            y: height,
            z: runwayStart.z + departureDz * distance,
            name: `climb_${i}`
        });
    }
    
    // Initial cruise point
    route.push({
        x: runwayStart.x + departureDx * (climbDistance + 50),
        y: cruiseHeight,
        z: runwayStart.z + departureDz * (climbDistance + 50),
        name: 'initial_cruise'
    });
    
    return route;
}

/**
 * Optimize route to avoid obstacles
 * @param {Array} route - Original route waypoints
 * @param {Array} obstacles - Obstacles to avoid {x, z, radius}
 * @param {number} [clearanceDistance=10] - Minimum clearance from obstacles
 * @returns {Array} Optimized route
 */
export function optimizeRouteForObstacles(route, obstacles, clearanceDistance = 10) {
    if (!obstacles || obstacles.length === 0) {
        return [...route];
    }
    
    const optimizedRoute = [route[0]]; // Keep start point
    
    for (let i = 1; i < route.length; i++) {
        const currentWaypoint = route[i];
        const prevWaypoint = optimizedRoute[optimizedRoute.length - 1];
        
        // Check if direct path intersects any obstacles
        const pathIntersectsObstacle = obstacles.some(obstacle => 
            doesLineIntersectCircle(prevWaypoint, currentWaypoint, obstacle, clearanceDistance)
        );
        
        if (pathIntersectsObstacle) {
            // Find alternative path around obstacles
            const alternativeWaypoints = findAlternativePath(
                prevWaypoint, 
                currentWaypoint, 
                obstacles, 
                clearanceDistance
            );
            optimizedRoute.push(...alternativeWaypoints);
        } else {
            optimizedRoute.push(currentWaypoint);
        }
    }
    
    return optimizedRoute;
}

/**
 * Check if line segment intersects circle
 * @private
 */
function doesLineIntersectCircle(start, end, circle, buffer = 0) {
    const totalRadius = circle.radius + buffer;
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const fx = start.x - circle.x;
    const fz = start.z - circle.z;
    
    const a = dx * dx + dz * dz;
    const b = 2 * (fx * dx + fz * dz);
    const c = (fx * fx + fz * fz) - totalRadius * totalRadius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
        return false; // No intersection
    }
    
    const t1 = (-b - Math.sqrt(discriminant)) / (2 * a);
    const t2 = (-b + Math.sqrt(discriminant)) / (2 * a);
    
    return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1) || (t1 < 0 && t2 > 1);
}

/**
 * Find alternative path around obstacles
 * @private
 */
function findAlternativePath(start, end, obstacles, clearanceDistance) {
    // Simple implementation: create waypoint to side of obstacle
    const alternativeWaypoints = [];
    
    // Find the obstacle that intersects the direct path
    const intersectingObstacle = obstacles.find(obstacle => 
        doesLineIntersectCircle(start, end, obstacle, clearanceDistance)
    );
    
    if (intersectingObstacle) {
        // Calculate perpendicular offset
        const dx = end.x - start.x;
        const dz = end.z - start.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        
        if (length > 0) {
            const perpX = -dz / length;
            const perpZ = dx / length;
            const offsetDistance = intersectingObstacle.radius + clearanceDistance + 5;
            
            // Create waypoint to the side
            const sideWaypoint = {
                x: intersectingObstacle.x + perpX * offsetDistance,
                z: intersectingObstacle.z + perpZ * offsetDistance,
                name: 'obstacle_avoidance'
            };
            
            alternativeWaypoints.push(sideWaypoint);
        }
    }
    
    alternativeWaypoints.push(end);
    return alternativeWaypoints;
}

/**
 * Calculate total route distance
 * @param {Array} route - Array of waypoints
 * @returns {number} Total distance
 */
export function calculateRouteDistance(route) {
    if (!route || route.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < route.length; i++) {
        totalDistance += distance2D(route[i - 1], route[i]);
    }
    
    return totalDistance;
}

/**
 * Calculate estimated time for route
 * @param {Array} route - Array of waypoints
 * @param {number} averageSpeed - Average speed
 * @returns {number} Estimated time in milliseconds
 */
export function calculateRouteTime(route, averageSpeed) {
    const distance = calculateRouteDistance(route);
    return (distance / averageSpeed) * 1000; // Convert to milliseconds
}

/**
 * Simplify route by removing unnecessary waypoints
 * @param {Array} route - Original route
 * @param {number} [tolerance=2.0] - Simplification tolerance
 * @returns {Array} Simplified route
 */
export function simplifyRoute(route, tolerance = 2.0) {
    if (!route || route.length <= 2) return [...route];
    
    const simplified = [route[0]]; // Keep start point
    
    for (let i = 1; i < route.length - 1; i++) {
        const prev = simplified[simplified.length - 1];
        const current = route[i];
        const next = route[i + 1];
        
        // Calculate if current point is necessary
        const directDistance = distance2D(prev, next);
        const viaCurrentDistance = distance2D(prev, current) + distance2D(current, next);
        
        if (viaCurrentDistance - directDistance > tolerance) {
            simplified.push(current);
        }
    }
    
    simplified.push(route[route.length - 1]); // Keep end point
    return simplified;
}

/**
 * Validate route for aircraft type
 * @param {Array} route - Route to validate
 * @param {string} aircraftType - Aircraft type
 * @returns {Object} Validation result {isValid, issues}
 */
export function validateRoute(route, aircraftType) {
    const issues = [];
    const config = configManager.getAircraftConfig(aircraftType);
    
    if (!route || route.length === 0) {
        issues.push('empty_route');
        return { isValid: false, issues };
    }
    
    if (route.length < 2) {
        issues.push('insufficient_waypoints');
    }
    
    // Check minimum distances between waypoints
    for (let i = 1; i < route.length; i++) {
        const distance = distance2D(route[i - 1], route[i]);
        if (distance < 1.0) {
            issues.push(`waypoint_too_close_${i}`);
        }
    }
    
    // Check turn angles for aircraft capabilities
    for (let i = 1; i < route.length - 1; i++) {
        const heading1 = calculateHeading(route[i - 1], route[i]);
        const heading2 = calculateHeading(route[i], route[i + 1]);
        const turnAngle = Math.abs(heading2 - heading1);
        const maxTurnAngle = config.turnRate * 10; // Rough calculation
        
        if (turnAngle > maxTurnAngle) {
            issues.push(`sharp_turn_at_waypoint_${i}`);
        }
    }
    
    return {
        isValid: issues.length === 0,
        issues
    };
}